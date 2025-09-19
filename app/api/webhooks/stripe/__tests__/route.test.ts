import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock dependencies
vi.mock('@/src/server/services/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
    customers: {
      retrieve: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
    audit_logs: {
      create: vi.fn(),
    },
    subscriptions: {
      create: vi.fn(),
      update: vi.fn(),
    },
    workspaces: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    invoices: {
      upsert: vi.fn(),
    },
    usage_metrics: {
      create: vi.fn(),
    },
    payment_methods: {
      create: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  webhookRateLimiter: {
    stripe: null, // Disable rate limiting in tests
  },
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === 'stripe-signature') {
        return 'test_signature';
      }
      return null;
    }),
  })),
}));

describe('Stripe Webhook Handler', () => {
  const mockStripe = vi.mocked(await import('@/src/server/services/stripe'));
  const mockPrisma = vi.mocked(await import('@/lib/prisma'));

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    
    // Default: event not already processed
    mockPrisma.prisma.$queryRaw.mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  const createMockRequest = (body: any): NextRequest => {
    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'stripe-signature': 'test_signature',
        'x-forwarded-for': '127.0.0.1',
      },
    });
    
    // Override text() to return the body
    request.text = vi.fn().mockResolvedValue(JSON.stringify(body));
    
    return request;
  };

  describe('Signature Verification', () => {
    it('should reject invalid webhook signature', async () => {
      mockStripe.stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid webhook signature');
    });

    it('should accept valid webhook signature', async () => {
      const mockEvent = {
        id: 'evt_test',
        type: 'unhandled.event',
        data: { object: {} },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });

  describe('Idempotency', () => {
    it('should skip already processed events', async () => {
      const mockEvent = {
        id: 'evt_test',
        type: 'customer.subscription.created',
        data: { object: { metadata: { workspace_id: 'ws_123' } } },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockPrisma.prisma.$queryRaw.mockResolvedValue([{ id: 'log_123' }]); // Event already processed

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skipped).toBe(true);
      expect(mockPrisma.prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Events', () => {
    it('should handle subscription.created event', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        metadata: { workspace_id: 'ws_123' },
        items: {
          data: [{
            price: { id: 'price_starter' },
          }],
        },
        status: 'active',
        current_period_start: 1234567890,
        current_period_end: 1234567890,
        cancel_at_period_end: false,
        canceled_at: null,
        trial_start: null,
        trial_end: null,
      };

      const mockEvent = {
        id: 'evt_test',
        type: 'customer.subscription.created',
        data: { object: mockSubscription },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockPrisma.prisma.$transaction.mockResolvedValue([]);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              workspace_id: 'ws_123',
              stripe_subscription_id: 'sub_test123',
            }),
          }),
        ])
      );
    });

    it('should handle subscription.updated event', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        metadata: { workspace_id: 'ws_123' },
        items: {
          data: [{
            price: { id: 'price_growth' },
          }],
        },
        status: 'active',
        current_period_start: 1234567890,
        current_period_end: 1234567890,
        cancel_at_period_end: false,
      };

      const mockEvent = {
        id: 'evt_test',
        type: 'customer.subscription.updated',
        data: { object: mockSubscription },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockPrisma.prisma.$transaction.mockResolvedValue([]);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle subscription.deleted event', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        metadata: { workspace_id: 'ws_123' },
      };

      const mockEvent = {
        id: 'evt_test',
        type: 'customer.subscription.deleted',
        data: { object: mockSubscription },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockPrisma.prisma.$transaction.mockResolvedValue([]);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            where: { stripe_subscription_id: 'sub_test123' },
            data: expect.objectContaining({
              status: 'canceled',
            }),
          }),
        ])
      );
    });
  });

  describe('Payment Events', () => {
    it('should handle invoice.payment_succeeded event', async () => {
      const mockInvoice = {
        id: 'in_test123',
        subscription: 'sub_test123',
        amount_due: 1900,
        amount_paid: 1900,
        amount_remaining: 0,
        currency: 'usd',
        status: 'paid',
        number: 'INV-001',
        due_date: null,
        status_transitions: {
          paid_at: 1234567890,
        },
        invoice_pdf: 'https://invoice.pdf',
        hosted_invoice_url: 'https://invoice.url',
      };

      const mockEvent = {
        id: 'evt_test',
        type: 'invoice.payment_succeeded',
        data: { object: mockInvoice },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockStripe.stripe.subscriptions.retrieve.mockResolvedValue({
        metadata: { workspace_id: 'ws_123' },
        current_period_start: 1234567890,
        current_period_end: 1234567890,
      } as any);

      mockPrisma.prisma.invoices.upsert.mockResolvedValue({} as any);
      mockPrisma.prisma.usage_metrics.create.mockResolvedValue({} as any);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.prisma.invoices.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripe_invoice_id: 'in_test123' },
          create: expect.objectContaining({
            workspace_id: 'ws_123',
            amount_due: 1900,
            amount_paid: 1900,
          }),
        })
      );
    });

    it('should handle invoice.payment_failed event', async () => {
      const mockInvoice = {
        id: 'in_test123',
        subscription: 'sub_test123',
        amount_due: 1900,
        amount_paid: 0,
        amount_remaining: 1900,
        status: 'open',
        attempt_count: 1,
        next_payment_attempt: 1234567890,
      };

      const mockEvent = {
        id: 'evt_test',
        type: 'invoice.payment_failed',
        data: { object: mockInvoice },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockStripe.stripe.subscriptions.retrieve.mockResolvedValue({
        metadata: { workspace_id: 'ws_123' },
      } as any);

      mockPrisma.prisma.invoices.upsert.mockResolvedValue({} as any);
      mockPrisma.prisma.audit_logs.create.mockResolvedValue({} as any);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.prisma.audit_logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'payment_failed',
            entity_type: 'invoice',
          }),
        })
      );
    });
  });

  describe('Payment Method Events', () => {
    it('should handle payment_method.attached event', async () => {
      const mockPaymentMethod = {
        id: 'pm_test123',
        customer: 'cus_test123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
      };

      const mockEvent = {
        id: 'evt_test',
        type: 'payment_method.attached',
        data: { object: mockPaymentMethod },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockStripe.stripe.customers.retrieve.mockResolvedValue({
        deleted: false,
        metadata: { workspace_id: 'ws_123' },
      } as any);

      mockPrisma.prisma.payment_methods.count.mockResolvedValue(0);
      mockPrisma.prisma.payment_methods.create.mockResolvedValue({} as any);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.prisma.payment_methods.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspace_id: 'ws_123',
            stripe_payment_method_id: 'pm_test123',
            type: 'card',
            card_brand: 'visa',
            card_last4: '4242',
            is_default: true, // First payment method
          }),
        })
      );
    });

    it('should handle payment_method.detached event', async () => {
      const mockPaymentMethod = {
        id: 'pm_test123',
      };

      const mockEvent = {
        id: 'evt_test',
        type: 'payment_method.detached',
        data: { object: mockPaymentMethod },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockPrisma.prisma.payment_methods.delete.mockResolvedValue({} as any);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.prisma.payment_methods.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripe_payment_method_id: 'pm_test123' },
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      const mockEvent = {
        id: 'evt_test',
        type: 'customer.subscription.created',
        data: { object: { metadata: { workspace_id: 'ws_123' } } },
      };

      mockStripe.stripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockPrisma.prisma.$transaction.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook processing failed');
    });
  });
});