import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCallerFactory } from '../trpc';
import { billingRouter } from '../billing';
import { TRPCError } from '@trpc/server';

// Mock dependencies
vi.mock('@/src/server/services/stripe', () => ({
  StripeService: {
    createCustomer: vi.fn(),
    createSubscription: vi.fn(),
    updateSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    createCheckoutSession: vi.fn(),
    createBillingPortalSession: vi.fn(),
    attachPaymentMethod: vi.fn(),
    detachPaymentMethod: vi.fn(),
    calculateProration: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspaces: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscriptions: {
      update: vi.fn(),
    },
    links: {
      count: vi.fn(),
    },
    workspace_memberships: {
      count: vi.fn(),
    },
    click_events: {
      count: vi.fn(),
    },
    usage_metrics: {
      findMany: vi.fn(),
    },
    invoices: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    payment_methods: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/stripe-config', () => ({
  BILLING_PLANS: {
    FREE: {
      id: 'free',
      name: 'Free',
      price: 0,
      priceId: 'price_free',
      limits: {
        maxUsers: 3,
        maxLinks: 100,
        maxClicks: 1000,
        customDomains: false,
      },
    },
    STARTER: {
      id: 'starter',
      name: 'Starter',
      price: 19,
      priceId: 'price_starter',
      limits: {
        maxUsers: 10,
        maxLinks: 1000,
        maxClicks: 10000,
        customDomains: true,
      },
    },
    GROWTH: {
      id: 'growth',
      name: 'Growth',
      price: 49,
      priceId: 'price_growth',
      limits: {
        maxUsers: -1,
        maxLinks: 10000,
        maxClicks: 100000,
        customDomains: true,
      },
    },
  },
  getPlanById: vi.fn((id) => {
    const plans = {
      free: { id: 'free', name: 'Free', price: 0, priceId: 'price_free', limits: {} },
      starter: { id: 'starter', name: 'Starter', price: 19, priceId: 'price_starter', limits: {} },
      growth: { id: 'growth', name: 'Growth', price: 49, priceId: 'price_growth', limits: {} },
    };
    return plans[id];
  }),
  getPlanByPriceId: vi.fn(),
}));

describe('billingRouter', () => {
  const mockStripeService = vi.mocked(await import('@/src/server/services/stripe')).StripeService;
  const mockPrisma = vi.mocked(await import('@/lib/prisma')).prisma;

  const createCaller = createCallerFactory(billingRouter);
  const mockContext = {
    user: {
      id: 'user_123',
      email: 'test@example.com',
    },
    session: {
      userId: 'user_123',
    },
  };

  const caller = createCaller(mockContext);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentPlan', () => {
    it('should return current plan details', async () => {
      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: 'ws_123',
        plan: 'starter',
        subscriptions: {
          status: 'active',
          cancel_at_period_end: false,
          current_period_end: new Date('2024-12-31'),
        },
      } as any);

      const result = await caller.getCurrentPlan({
        workspaceId: 'ws_123',
      });

      expect(result).toMatchObject({
        plan: 'starter',
        name: 'Starter',
        price: 19,
        isActive: true,
        cancelAtPeriodEnd: false,
      });
    });

    it('should throw error if workspace not found', async () => {
      mockPrisma.workspaces.findUnique.mockResolvedValue(null);

      await expect(
        caller.getCurrentPlan({ workspaceId: 'ws_999' })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getUsageMetrics', () => {
    it('should return usage metrics', async () => {
      mockPrisma.usage_metrics.findMany.mockResolvedValue([
        { metric_type: 'links', value: 50 },
        { metric_type: 'users', value: 5 },
        { metric_type: 'clicks', value: 500 },
      ] as any);

      mockPrisma.links.count.mockResolvedValue(45);
      mockPrisma.workspace_memberships.count.mockResolvedValue(4);
      mockPrisma.click_events.count.mockResolvedValue(450);

      const result = await caller.getUsageMetrics({
        workspaceId: 'ws_123',
        period: 'monthly',
      });

      expect(result).toMatchObject({
        links: { current: 45, limit: 50 },
        users: { current: 4, limit: 5 },
        clicks: { current: 450, limit: 500 },
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for existing customer', async () => {
      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: 'ws_123',
        name: 'Test Workspace',
        stripe_customer_id: 'cus_existing',
      } as any);

      mockStripeService.createCheckoutSession.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/session',
      } as any);

      const result = await caller.createCheckoutSession({
        workspaceId: 'ws_123',
        planId: 'starter',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result).toMatchObject({
        sessionId: 'cs_test',
        url: 'https://checkout.stripe.com/session',
      });
      expect(mockStripeService.createCustomer).not.toHaveBeenCalled();
    });

    it('should create customer if not exists', async () => {
      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: 'ws_123',
        name: 'Test Workspace',
        stripe_customer_id: null,
      } as any);

      mockStripeService.createCustomer.mockResolvedValue({
        id: 'cus_new',
      } as any);

      mockPrisma.workspaces.update.mockResolvedValue({} as any);

      mockStripeService.createCheckoutSession.mockResolvedValue({
        id: 'cs_test',
        url: 'https://checkout.stripe.com/session',
      } as any);

      await caller.createCheckoutSession({
        workspaceId: 'ws_123',
        planId: 'starter',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockStripeService.createCustomer).toHaveBeenCalledWith({
        workspaceId: 'ws_123',
        email: 'test@example.com',
        name: 'Test Workspace',
      });
    });
  });

  describe('updateSubscription', () => {
    it('should downgrade to free plan', async () => {
      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: 'ws_123',
        stripe_subscription_id: 'sub_123',
        subscriptions: {},
      } as any);

      mockStripeService.cancelSubscription.mockResolvedValue({
        id: 'sub_123',
        cancel_at_period_end: true,
      } as any);

      mockPrisma.subscriptions.update.mockResolvedValue({} as any);

      const result = await caller.updateSubscription({
        workspaceId: 'ws_123',
        planId: 'free',
      });

      expect(result.success).toBe(true);
      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith({
        subscriptionId: 'sub_123',
        immediately: false,
      });
    });

    it('should upgrade to paid plan', async () => {
      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: 'ws_123',
        stripe_subscription_id: 'sub_123',
        subscriptions: {},
      } as any);

      mockStripeService.updateSubscription.mockResolvedValue({
        id: 'sub_123',
      } as any);

      const result = await caller.updateSubscription({
        workspaceId: 'ws_123',
        planId: 'growth',
      });

      expect(result.success).toBe(true);
      expect(mockStripeService.updateSubscription).toHaveBeenCalledWith({
        subscriptionId: 'sub_123',
        priceId: 'price_growth',
        cancelAtPeriodEnd: false,
      });
    });
  });

  describe('checkPlanLimits', () => {
    it('should check link limits', async () => {
      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: 'ws_123',
        max_links: 100,
        max_users: 3,
        max_clicks: 1000,
        plan: 'free',
      } as any);

      mockPrisma.links.count.mockResolvedValue(95);

      const result = await caller.checkPlanLimits({
        workspaceId: 'ws_123',
        resource: 'links',
      });

      expect(result).toMatchObject({
        resource: 'links',
        current: 95,
        limit: 100,
        isAtLimit: false,
        percentUsed: 95,
        canUpgrade: true,
      });
    });

    it('should indicate when at limit', async () => {
      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: 'ws_123',
        max_links: 100,
        plan: 'free',
      } as any);

      mockPrisma.links.count.mockResolvedValue(100);

      const result = await caller.checkPlanLimits({
        workspaceId: 'ws_123',
        resource: 'links',
      });

      expect(result.isAtLimit).toBe(true);
      expect(result.percentUsed).toBe(100);
    });

    it('should handle unlimited resources', async () => {
      mockPrisma.workspaces.findUnique.mockResolvedValue({
        id: 'ws_123',
        max_users: -1, // Unlimited
        plan: 'growth',
      } as any);

      mockPrisma.workspace_memberships.count.mockResolvedValue(50);

      const result = await caller.checkPlanLimits({
        workspaceId: 'ws_123',
        resource: 'users',
      });

      expect(result).toMatchObject({
        current: 50,
        limit: 'unlimited',
        isAtLimit: false,
        canUpgrade: false, // Already on highest plan
      });
    });
  });

  describe('Payment Methods', () => {
    it('should list payment methods', async () => {
      mockPrisma.payment_methods.findMany.mockResolvedValue([
        {
          id: 'pm_1',
          type: 'card',
          card_brand: 'visa',
          card_last4: '4242',
          card_exp_month: 12,
          card_exp_year: 2025,
          is_default: true,
        },
        {
          id: 'pm_2',
          type: 'card',
          card_brand: 'mastercard',
          card_last4: '5555',
          card_exp_month: 6,
          card_exp_year: 2024,
          is_default: false,
        },
      ] as any);

      const result = await caller.getPaymentMethods({
        workspaceId: 'ws_123',
      });

      expect(result).toHaveLength(2);
      expect(result[0].isDefault).toBe(true);
      expect(result[1].brand).toBe('mastercard');
    });

    it('should set default payment method', async () => {
      mockPrisma.payment_methods.findFirst.mockResolvedValue({
        id: 'pm_2',
        workspace_id: 'ws_123',
        stripe_payment_method_id: 'pm_stripe_2',
      } as any);

      mockPrisma.workspaces.findUnique.mockResolvedValue({
        stripe_customer_id: 'cus_123',
      } as any);

      mockPrisma.$transaction.mockResolvedValue([]);
      mockStripeService.attachPaymentMethod.mockResolvedValue({} as any);

      const result = await caller.setDefaultPaymentMethod({
        workspaceId: 'ws_123',
        paymentMethodId: 'pm_2',
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockStripeService.attachPaymentMethod).toHaveBeenCalledWith({
        customerId: 'cus_123',
        paymentMethodId: 'pm_stripe_2',
        setAsDefault: true,
      });
    });

    it('should remove payment method', async () => {
      mockPrisma.payment_methods.findFirst.mockResolvedValue({
        id: 'pm_1',
        stripe_payment_method_id: 'pm_stripe_1',
      } as any);

      mockStripeService.detachPaymentMethod.mockResolvedValue({} as any);
      mockPrisma.payment_methods.delete.mockResolvedValue({} as any);

      const result = await caller.removePaymentMethod({
        workspaceId: 'ws_123',
        paymentMethodId: 'pm_1',
      });

      expect(result.success).toBe(true);
      expect(mockStripeService.detachPaymentMethod).toHaveBeenCalledWith('pm_stripe_1');
      expect(mockPrisma.payment_methods.delete).toHaveBeenCalledWith({
        where: { id: 'pm_1' },
      });
    });
  });
});