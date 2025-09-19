import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { StripeService } from '@/src/server/services/stripe';
import { BILLING_PLANS, getPlanById } from '@/lib/stripe-config';
import { prisma } from '@/lib/prisma';

export const billingRouter = router({
  getCurrentPlan: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        include: { subscriptions: true },
      });

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        });
      }

      const plan = getPlanById(workspace.plan as 'free' | 'starter' | 'growth');
      
      return {
        plan: plan.id,
        name: plan.name,
        price: plan.price,
        limits: plan.limits,
        subscription: workspace.subscriptions,
        isActive: workspace.subscriptions?.status === 'active',
        cancelAtPeriodEnd: workspace.subscriptions?.cancel_at_period_end || false,
        currentPeriodEnd: workspace.subscriptions?.current_period_end || null,
      };
    }),

  getUsageMetrics: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      period: z.enum(['daily', 'monthly', 'lifetime']).optional().default('monthly'),
    }))
    .query(async ({ input }) => {
      const now = new Date();
      const periodStart = input.period === 'daily' 
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : input.period === 'monthly'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(0);

      const metrics = await prisma.usage_metrics.findMany({
        where: {
          workspace_id: input.workspaceId,
          period: input.period,
          period_start: { gte: periodStart },
        },
        orderBy: { created_at: 'desc' },
      });

      // Get current counts
      const [linkCount, userCount, clickCount] = await Promise.all([
        prisma.links.count({ where: { workspace_id: input.workspaceId } }),
        prisma.workspace_memberships.count({ where: { workspace_id: input.workspaceId } }),
        prisma.click_events.count({
          where: {
            links: { workspace_id: input.workspaceId },
            timestamp: { gte: periodStart },
          },
        }),
      ]);

      return {
        links: {
          current: linkCount,
          limit: metrics.find(m => m.metric_type === 'links')?.value || linkCount,
        },
        users: {
          current: userCount,
          limit: metrics.find(m => m.metric_type === 'users')?.value || userCount,
        },
        clicks: {
          current: clickCount,
          limit: metrics.find(m => m.metric_type === 'clicks')?.value || clickCount,
        },
      };
    }),

  createCheckoutSession: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      planId: z.enum(['starter', 'growth']),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: { 
          id: true, 
          stripe_customer_id: true,
          name: true,
        },
      });

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        });
      }

      // Create customer if doesn't exist
      let customerId = workspace.stripe_customer_id;
      if (!customerId) {
        const customer = await StripeService.createCustomer({
          workspaceId: workspace.id,
          email: ctx.user.email,
          name: workspace.name,
        });
        customerId = customer.id;

        await prisma.workspaces.update({
          where: { id: workspace.id },
          data: { stripe_customer_id: customerId },
        });
      }

      const plan = getPlanById(input.planId);
      const session = await StripeService.createCheckoutSession({
        customerId,
        priceId: plan.priceId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        workspaceId: workspace.id,
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  createBillingPortalSession: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      returnUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: { stripe_customer_id: true },
      });

      if (!workspace || !workspace.stripe_customer_id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No billing information found for this workspace',
        });
      }

      const session = await StripeService.createBillingPortalSession({
        customerId: workspace.stripe_customer_id,
        returnUrl: input.returnUrl,
      });

      return {
        url: session.url,
      };
    }),

  updateSubscription: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      planId: z.enum(['free', 'starter', 'growth']),
    }))
    .mutation(async ({ input }) => {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        include: { subscriptions: true },
      });

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        });
      }

      if (!workspace.stripe_subscription_id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active subscription found',
        });
      }

      // Handle downgrade to free
      if (input.planId === 'free') {
        const subscription = await StripeService.cancelSubscription({
          subscriptionId: workspace.stripe_subscription_id,
          immediately: false, // Cancel at end of period
        });

        await prisma.subscriptions.update({
          where: { stripe_subscription_id: subscription.id },
          data: { cancel_at_period_end: true },
        });

        return {
          success: true,
          message: 'Subscription will be canceled at the end of the billing period',
        };
      }

      // Handle upgrade/downgrade to paid plan
      const plan = getPlanById(input.planId);
      const subscription = await StripeService.updateSubscription({
        subscriptionId: workspace.stripe_subscription_id,
        priceId: plan.priceId,
        cancelAtPeriodEnd: false, // Reactivate if was canceling
      });

      return {
        success: true,
        subscription,
      };
    }),

  cancelSubscription: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      immediately: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: { stripe_subscription_id: true },
      });

      if (!workspace || !workspace.stripe_subscription_id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active subscription found',
        });
      }

      const subscription = await StripeService.cancelSubscription({
        subscriptionId: workspace.stripe_subscription_id,
        immediately: input.immediately,
      });

      await prisma.subscriptions.update({
        where: { stripe_subscription_id: subscription.id },
        data: {
          cancel_at_period_end: !input.immediately,
          status: input.immediately ? 'canceled' : subscription.status,
          canceled_at: input.immediately ? new Date() : null,
        },
      });

      return {
        success: true,
        message: input.immediately 
          ? 'Subscription canceled immediately'
          : 'Subscription will be canceled at the end of the billing period',
      };
    }),

  getInvoices: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      limit: z.number().min(1).max(100).optional().default(10),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ input }) => {
      const [invoices, total] = await Promise.all([
        prisma.invoices.findMany({
          where: { workspace_id: input.workspaceId },
          orderBy: { created_at: 'desc' },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.invoices.count({
          where: { workspace_id: input.workspaceId },
        }),
      ]);

      return {
        invoices,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  getPaymentMethods: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const paymentMethods = await prisma.payment_methods.findMany({
        where: { workspace_id: input.workspaceId },
        orderBy: [
          { is_default: 'desc' },
          { created_at: 'desc' },
        ],
      });

      return paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        brand: pm.card_brand,
        last4: pm.card_last4,
        expiryMonth: pm.card_exp_month,
        expiryYear: pm.card_exp_year,
        isDefault: pm.is_default,
      }));
    }),

  setDefaultPaymentMethod: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      paymentMethodId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const paymentMethod = await prisma.payment_methods.findFirst({
        where: {
          id: input.paymentMethodId,
          workspace_id: input.workspaceId,
        },
      });

      if (!paymentMethod) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment method not found',
        });
      }

      // Update all payment methods for this workspace
      await prisma.$transaction([
        // Set all to non-default
        prisma.payment_methods.updateMany({
          where: { workspace_id: input.workspaceId },
          data: { is_default: false },
        }),
        // Set selected as default
        prisma.payment_methods.update({
          where: { id: input.paymentMethodId },
          data: { is_default: true },
        }),
      ]);

      // Update Stripe
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: { stripe_customer_id: true },
      });

      if (workspace?.stripe_customer_id) {
        await StripeService.attachPaymentMethod({
          customerId: workspace.stripe_customer_id,
          paymentMethodId: paymentMethod.stripe_payment_method_id,
          setAsDefault: true,
        });
      }

      return { success: true };
    }),

  removePaymentMethod: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      paymentMethodId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const paymentMethod = await prisma.payment_methods.findFirst({
        where: {
          id: input.paymentMethodId,
          workspace_id: input.workspaceId,
        },
      });

      if (!paymentMethod) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment method not found',
        });
      }

      // Detach from Stripe
      await StripeService.detachPaymentMethod(paymentMethod.stripe_payment_method_id);

      // Delete from database
      await prisma.payment_methods.delete({
        where: { id: input.paymentMethodId },
      });

      return { success: true };
    }),

  checkPlanLimits: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      resource: z.enum(['links', 'users', 'clicks']),
    }))
    .query(async ({ input }) => {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: {
          max_links: true,
          max_users: true,
          max_clicks: true,
          plan: true,
        },
      });

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        });
      }

      let current = 0;
      let limit = 0;

      switch (input.resource) {
        case 'links':
          current = await prisma.links.count({
            where: { workspace_id: input.workspaceId },
          });
          limit = workspace.max_links;
          break;
        case 'users':
          current = await prisma.workspace_memberships.count({
            where: { workspace_id: input.workspaceId },
          });
          limit = workspace.max_users;
          break;
        case 'clicks':
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          current = await prisma.click_events.count({
            where: {
              links: { workspace_id: input.workspaceId },
              timestamp: { gte: monthStart },
            },
          });
          limit = workspace.max_clicks;
          break;
      }

      const isAtLimit = limit > 0 && current >= limit;
      const percentUsed = limit > 0 ? Math.round((current / limit) * 100) : 0;

      return {
        resource: input.resource,
        current,
        limit: limit === -1 ? 'unlimited' : limit,
        isAtLimit,
        percentUsed,
        canUpgrade: workspace.plan !== 'growth',
      };
    }),
});