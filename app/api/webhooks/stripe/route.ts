import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/src/server/services/stripe';
import { prisma } from '@/lib/prisma';
import { getPlanByPriceId } from '@/lib/stripe-config';
import { webhookRateLimiter, checkRateLimit } from '@/lib/rate-limit';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Webhook event types we handle
const relevantEvents = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'payment_method.attached',
  'payment_method.detached',
]);

export async function POST(request: NextRequest) {
  // Apply rate limiting based on IP address
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = await checkRateLimit(ip, webhookRateLimiter.stripe);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many webhook requests' },
      { status: 429 }
    );
  }

  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  // Check if we've already processed this event (idempotency)
  const existingEvent = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM audit_logs 
    WHERE metadata->>'stripe_event_id' = ${event.id}
    LIMIT 1
  `;

  if (existingEvent.length > 0) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, skipped: true });
  }

  // Only handle relevant events
  if (!relevantEvents.has(event.type)) {
    console.log(`Unhandled event type: ${event.type}`);
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log the event processing in audit_logs for idempotency
    const workspaceId = await getWorkspaceIdFromEvent(event);
    if (workspaceId) {
      await prisma.audit_logs.create({
        data: {
          workspace_id: workspaceId,
          action: `stripe_webhook_${event.type}`,
          entity_type: 'webhook',
          entity_id: event.id,
          metadata: {
            stripe_event_id: event.id,
            event_type: event.type,
            processed_at: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata.workspace_id;
  if (!workspaceId) {
    console.error('No workspace_id in subscription metadata');
    return;
  }

  const plan = getPlanByPriceId(subscription.items.data[0].price.id);
  
  await prisma.$transaction([
    // Create subscription record
    prisma.subscriptions.create({
      data: {
        workspace_id: workspaceId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0].price.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000) 
          : null,
        trial_start: subscription.trial_start 
          ? new Date(subscription.trial_start * 1000) 
          : null,
        trial_end: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000) 
          : null,
      },
    }),
    // Update workspace with subscription details and plan limits
    prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        stripe_subscription_id: subscription.id,
        plan: plan?.id || 'free',
        max_links: plan?.limits.maxLinks || 100,
        max_clicks: plan?.limits.maxClicks || 1000,
        max_users: plan?.limits.maxUsers || 3,
      },
    }),
  ]);

  console.log(`Subscription created for workspace ${workspaceId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata.workspace_id;
  if (!workspaceId) {
    console.error('No workspace_id in subscription metadata');
    return;
  }

  const plan = getPlanByPriceId(subscription.items.data[0].price.id);
  
  await prisma.$transaction([
    // Update subscription record
    prisma.subscriptions.update({
      where: { stripe_subscription_id: subscription.id },
      data: {
        stripe_price_id: subscription.items.data[0].price.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000) 
          : null,
        trial_end: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000) 
          : null,
      },
    }),
    // Update workspace plan limits
    prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        plan: plan?.id || 'free',
        max_links: plan?.limits.maxLinks || 100,
        max_clicks: plan?.limits.maxClicks || 1000,
        max_users: plan?.limits.maxUsers || 3,
      },
    }),
  ]);

  console.log(`Subscription updated for workspace ${workspaceId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata.workspace_id;
  if (!workspaceId) {
    console.error('No workspace_id in subscription metadata');
    return;
  }

  await prisma.$transaction([
    // Update subscription status to canceled
    prisma.subscriptions.update({
      where: { stripe_subscription_id: subscription.id },
      data: {
        status: 'canceled',
        canceled_at: new Date(),
      },
    }),
    // Downgrade workspace to free plan
    prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        stripe_subscription_id: null,
        plan: 'free',
        max_links: 100,
        max_clicks: 1000,
        max_users: 3,
      },
    }),
  ]);

  console.log(`Subscription canceled for workspace ${workspaceId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );
  const workspaceId = subscription.metadata.workspace_id;
  
  if (!workspaceId) {
    console.error('No workspace_id in subscription metadata');
    return;
  }

  // Create or update invoice record
  await prisma.invoices.upsert({
    where: { stripe_invoice_id: invoice.id },
    create: {
      workspace_id: workspaceId,
      stripe_invoice_id: invoice.id,
      invoice_number: invoice.number,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      amount_remaining: invoice.amount_remaining,
      currency: invoice.currency,
      status: invoice.status || 'paid',
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      paid_at: invoice.status_transitions?.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000) 
        : new Date(),
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    },
    update: {
      amount_paid: invoice.amount_paid,
      amount_remaining: invoice.amount_remaining,
      status: invoice.status || 'paid',
      paid_at: invoice.status_transitions?.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000) 
        : new Date(),
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    },
  });

  // Update usage metrics for billing period
  const currentPeriod = new Date();
  await prisma.usage_metrics.create({
    data: {
      workspace_id: workspaceId,
      metric_type: 'payment',
      value: invoice.amount_paid,
      period: 'monthly',
      period_start: new Date(subscription.current_period_start * 1000),
      period_end: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`Payment succeeded for workspace ${workspaceId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );
  const workspaceId = subscription.metadata.workspace_id;
  
  if (!workspaceId) {
    console.error('No workspace_id in subscription metadata');
    return;
  }

  // Update invoice record
  await prisma.invoices.upsert({
    where: { stripe_invoice_id: invoice.id },
    create: {
      workspace_id: workspaceId,
      stripe_invoice_id: invoice.id,
      invoice_number: invoice.number,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      amount_remaining: invoice.amount_remaining,
      currency: invoice.currency,
      status: invoice.status || 'open',
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    },
    update: {
      status: invoice.status || 'open',
    },
  });

  // Log payment failure in audit logs
  await prisma.audit_logs.create({
    data: {
      workspace_id: workspaceId,
      action: 'payment_failed',
      entity_type: 'invoice',
      entity_id: invoice.id,
      metadata: {
        amount: invoice.amount_due,
        currency: invoice.currency,
        attempt_count: invoice.attempt_count,
        next_payment_attempt: invoice.next_payment_attempt,
      },
    },
  });

  console.log(`Payment failed for workspace ${workspaceId}`);
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  if (!paymentMethod.customer) return;
  
  const customer = await stripe.customers.retrieve(paymentMethod.customer as string);
  if (customer.deleted) return;
  
  const workspaceId = (customer as Stripe.Customer).metadata.workspace_id;
  if (!workspaceId) {
    console.error('No workspace_id in customer metadata');
    return;
  }

  // Check if this is the first payment method
  const existingMethods = await prisma.payment_methods.count({
    where: { workspace_id: workspaceId },
  });

  await prisma.payment_methods.create({
    data: {
      workspace_id: workspaceId,
      stripe_payment_method_id: paymentMethod.id,
      type: paymentMethod.type,
      card_brand: paymentMethod.card?.brand || null,
      card_last4: paymentMethod.card?.last4 || null,
      card_exp_month: paymentMethod.card?.exp_month || null,
      card_exp_year: paymentMethod.card?.exp_year || null,
      is_default: existingMethods === 0, // First payment method is default
    },
  });

  console.log(`Payment method attached for workspace ${workspaceId}`);
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  await prisma.payment_methods.delete({
    where: { stripe_payment_method_id: paymentMethod.id },
  }).catch(() => {
    console.log(`Payment method ${paymentMethod.id} not found in database`);
  });

  console.log(`Payment method ${paymentMethod.id} detached`);
}

async function getWorkspaceIdFromEvent(event: Stripe.Event): Promise<string | null> {
  try {
    const obj = event.data.object as any;
    
    // Try to get workspace_id from metadata
    if (obj.metadata?.workspace_id) {
      return obj.metadata.workspace_id;
    }
    
    // Try to get from subscription metadata
    if (obj.subscription) {
      const subscription = await stripe.subscriptions.retrieve(obj.subscription);
      if (subscription.metadata.workspace_id) {
        return subscription.metadata.workspace_id;
      }
    }
    
    // Try to get from customer metadata
    if (obj.customer) {
      const customer = await stripe.customers.retrieve(obj.customer);
      if (!customer.deleted && (customer as Stripe.Customer).metadata.workspace_id) {
        return (customer as Stripe.Customer).metadata.workspace_id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting workspace_id from event:', error);
    return null;
  }
}