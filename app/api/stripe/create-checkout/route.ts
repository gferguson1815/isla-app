import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StripeService } from '@/src/server/services/stripe';
import { getPlanById, getStripePriceId, type PlanId, type BillingPeriod } from '@/app/onboarding/plan/lib/plan-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { planId, billingPeriod, workspaceSlug, successUrl, cancelUrl } = body;

    // Validate required fields
    if (!planId || !billingPeriod || !workspaceSlug || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate plan exists and get price ID
    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Get the price ID based on billing period
    const priceId = getStripePriceId(planId as Exclude<PlanId, "free" | "enterprise">, billingPeriod as BillingPeriod);

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this plan' },
        { status: 500 }
      );
    }

    // Get workspace and verify user has access
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: workspaceSlug },
      include: {
        workspace_memberships: {
          where: { user_id: user.id },
        },
      },
    });

    if (!workspace || workspace.workspace_memberships.length === 0) {
      return NextResponse.json(
        { error: 'Workspace not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if workspace already has a Stripe customer ID
    let customerId = workspace.stripe_customer_id;

    // Create a Stripe customer if one doesn't exist
    if (!customerId) {
      const customer = await StripeService.createCustomer({
        workspaceId: workspace.id,
        email: user.email!,
        name: workspace.name,
        metadata: {
          workspace_slug: workspace.slug,
          user_id: user.id,
        },
      });

      // Update workspace with Stripe customer ID
      await prisma.workspaces.update({
        where: { id: workspace.id },
        data: { stripe_customer_id: customer.id },
      });

      customerId = customer.id;
    }

    // Create a Stripe checkout session
    const session = await StripeService.createCheckoutSession({
      customerId,
      priceId,
      successUrl,
      cancelUrl,
      workspaceId: workspace.id,
    });

    // Return the checkout URL
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}