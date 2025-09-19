import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeService } from '../stripe';
import Stripe from 'stripe';

// Mock Stripe
vi.mock('stripe', () => {
  const Stripe = vi.fn();
  Stripe.prototype.customers = {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
  };
  Stripe.prototype.subscriptions = {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    list: vi.fn(),
  };
  Stripe.prototype.checkout = {
    sessions: {
      create: vi.fn(),
    },
  };
  Stripe.prototype.billingPortal = {
    sessions: {
      create: vi.fn(),
    },
  };
  Stripe.prototype.paymentMethods = {
    attach: vi.fn(),
    detach: vi.fn(),
    list: vi.fn(),
  };
  Stripe.prototype.invoices = {
    retrieveUpcoming: vi.fn(),
  };
  return { default: Stripe };
});

describe('StripeService', () => {
  let stripeMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    stripeMock = new (Stripe as any)();
  });

  describe('createCustomer', () => {
    it('should create a new Stripe customer', async () => {
      const mockCustomer = {
        id: 'cus_test123',
        email: 'test@example.com',
        metadata: { workspace_id: 'ws_123' },
      };

      stripeMock.customers.create.mockResolvedValue(mockCustomer);

      const result = await StripeService.createCustomer({
        workspaceId: 'ws_123',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          workspace_id: 'ws_123',
        },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw error on failure', async () => {
      stripeMock.customers.create.mockRejectedValue(new Error('Stripe error'));

      await expect(
        StripeService.createCustomer({
          workspaceId: 'ws_123',
          email: 'test@example.com',
        })
      ).rejects.toThrow('Failed to create customer in Stripe');
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription without trial', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        items: { data: [{ price: { id: 'price_123' } }] },
        status: 'active',
      };

      stripeMock.subscriptions.create.mockResolvedValue(mockSubscription);

      const result = await StripeService.createSubscription({
        customerId: 'cus_test123',
        priceId: 'price_123',
        workspaceId: 'ws_123',
      });

      expect(stripeMock.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        items: [{ price: 'price_123' }],
        metadata: {
          workspace_id: 'ws_123',
        },
        expand: ['latest_invoice.payment_intent'],
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should create a subscription with trial period', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        trial_period_days: 14,
      };

      stripeMock.subscriptions.create.mockResolvedValue(mockSubscription);

      await StripeService.createSubscription({
        customerId: 'cus_test123',
        priceId: 'price_123',
        workspaceId: 'ws_123',
        trialDays: 14,
      });

      expect(stripeMock.subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          trial_period_days: 14,
        })
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription price', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        items: {
          data: [{
            id: 'si_123',
            price: { id: 'price_old' },
          }],
        },
      };

      const updatedSubscription = {
        ...mockSubscription,
        items: {
          data: [{
            id: 'si_123',
            price: { id: 'price_new' },
          }],
        },
      };

      stripeMock.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      stripeMock.subscriptions.update.mockResolvedValue(updatedSubscription);

      const result = await StripeService.updateSubscription({
        subscriptionId: 'sub_test123',
        priceId: 'price_new',
      });

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        {
          items: [{
            id: 'si_123',
            price: 'price_new',
          }],
          proration_behavior: 'always_invoice',
        }
      );
      expect(result).toEqual(updatedSubscription);
    });

    it('should update cancel at period end status', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        items: {
          data: [{
            id: 'si_123',
            price: { id: 'price_123' },
          }],
        },
      };

      stripeMock.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      stripeMock.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: true,
      });

      await StripeService.updateSubscription({
        subscriptionId: 'sub_test123',
        priceId: 'price_123',
        cancelAtPeriodEnd: true,
      });

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          cancel_at_period_end: true,
        })
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const mockCanceled = {
        id: 'sub_test123',
        status: 'canceled',
      };

      stripeMock.subscriptions.cancel.mockResolvedValue(mockCanceled);

      const result = await StripeService.cancelSubscription({
        subscriptionId: 'sub_test123',
        immediately: true,
      });

      expect(stripeMock.subscriptions.cancel).toHaveBeenCalledWith('sub_test123');
      expect(result).toEqual(mockCanceled);
    });

    it('should cancel subscription at period end', async () => {
      const mockUpdated = {
        id: 'sub_test123',
        cancel_at_period_end: true,
      };

      stripeMock.subscriptions.update.mockResolvedValue(mockUpdated);

      const result = await StripeService.cancelSubscription({
        subscriptionId: 'sub_test123',
        immediately: false,
      });

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        { cancel_at_period_end: true }
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session', async () => {
      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/session',
      };

      stripeMock.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await StripeService.createCheckoutSession({
        customerId: 'cus_test123',
        priceId: 'price_123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        workspaceId: 'ws_123',
      });

      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: 'price_123',
          quantity: 1,
        }],
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata: {
          workspace_id: 'ws_123',
        },
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('createBillingPortalSession', () => {
    it('should create a billing portal session', async () => {
      const mockSession = {
        id: 'bps_test123',
        url: 'https://billing.stripe.com/session',
      };

      stripeMock.billingPortal.sessions.create.mockResolvedValue(mockSession);

      const result = await StripeService.createBillingPortalSession({
        customerId: 'cus_test123',
        returnUrl: 'https://example.com/settings',
      });

      expect(stripeMock.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: 'https://example.com/settings',
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('attachPaymentMethod', () => {
    it('should attach payment method and set as default', async () => {
      const mockPaymentMethod = {
        id: 'pm_test123',
        customer: 'cus_test123',
      };

      stripeMock.paymentMethods.attach.mockResolvedValue(mockPaymentMethod);
      stripeMock.customers.update.mockResolvedValue({ id: 'cus_test123' });

      const result = await StripeService.attachPaymentMethod({
        customerId: 'cus_test123',
        paymentMethodId: 'pm_test123',
        setAsDefault: true,
      });

      expect(stripeMock.paymentMethods.attach).toHaveBeenCalledWith(
        'pm_test123',
        { customer: 'cus_test123' }
      );
      expect(stripeMock.customers.update).toHaveBeenCalledWith(
        'cus_test123',
        {
          invoice_settings: {
            default_payment_method: 'pm_test123',
          },
        }
      );
      expect(result).toEqual(mockPaymentMethod);
    });
  });

  describe('calculateProration', () => {
    it('should calculate proration amount', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        items: {
          data: [{
            id: 'si_123',
          }],
        },
      };

      const mockInvoice = {
        amount_due: 2500, // $25.00
      };

      stripeMock.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      stripeMock.invoices.retrieveUpcoming.mockResolvedValue(mockInvoice);

      const result = await StripeService.calculateProration({
        subscriptionId: 'sub_test123',
        newPriceId: 'price_new',
      });

      expect(stripeMock.invoices.retrieveUpcoming).toHaveBeenCalledWith({
        customer: 'cus_test123',
        subscription: 'sub_test123',
        subscription_items: [{
          id: 'si_123',
          price: 'price_new',
        }],
        subscription_proration_behavior: 'always_invoice',
      });
      expect(result).toBe(2500);
    });
  });
});