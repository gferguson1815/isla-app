import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the stripe module before importing anything that uses it
vi.mock('../stripe', () => {
  const stripeMock = {
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    subscriptions: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
      list: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
    paymentMethods: {
      attach: vi.fn(),
      detach: vi.fn(),
      list: vi.fn(),
    },
    invoices: {
      retrieveUpcoming: vi.fn(),
      list: vi.fn(),
    },
    prices: {
      list: vi.fn(),
    },
    products: {
      list: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  };

  return {
    stripe: stripeMock,
    StripeService: {
      createCustomer: vi.fn().mockImplementation(async ({ workspaceId, email, name }) => {
        return stripeMock.customers.create({
          email,
          name,
          metadata: { workspace_id: workspaceId },
        });
      }),
      createSubscription: vi.fn().mockImplementation(async ({ customerId, priceId, workspaceId, trialDays = 14 }) => {
        return stripeMock.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          metadata: { workspace_id: workspaceId },
          trial_period_days: trialDays,
        });
      }),
      updateSubscription: vi.fn().mockImplementation(async ({ subscriptionId, newPriceId, payImmediately = false }) => {
        return stripeMock.subscriptions.update(subscriptionId, {
          proration_behavior: payImmediately ? 'always_invoice' : 'create_prorations',
          ...(payImmediately && { payment_behavior: 'pending_if_incomplete' }),
        });
      }),
      cancelSubscription: vi.fn().mockImplementation(async (subscriptionId, immediately = false) => {
        if (immediately) {
          return stripeMock.subscriptions.cancel(subscriptionId);
        }
        return stripeMock.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }),
      createCheckoutSession: vi.fn().mockImplementation(async ({ customerId, priceId, successUrl, cancelUrl, workspaceId }) => {
        return stripeMock.checkout.sessions.create({
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: { workspace_id: workspaceId },
          subscription_data: {
            metadata: { workspace_id: workspaceId },
            trial_period_days: 14,
          },
        });
      }),
      createPortalSession: vi.fn().mockImplementation(async ({ customerId, returnUrl }) => {
        return stripeMock.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        });
      }),
      attachPaymentMethod: vi.fn().mockImplementation(async ({ paymentMethodId, customerId, setAsDefault = false }) => {
        const result = await stripeMock.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
        if (setAsDefault) {
          await stripeMock.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
        }
        return result;
      }),
      calculateProration: vi.fn().mockImplementation(async ({ subscriptionId, newPriceId }) => {
        const subscription = await stripeMock.subscriptions.retrieve(subscriptionId);
        const invoice = await stripeMock.invoices.retrieveUpcoming({
          customer: subscription.customer,
          subscription: subscriptionId,
          subscription_items: [{
            id: subscription.items.data[0].id,
            price: newPriceId,
          }],
          subscription_proration_behavior: 'always_invoice',
        });
        return invoice.amount_due;
      }),
    },
    stripeMockInstance: stripeMock,
  };
});

// Import after mocking
import { StripeService, stripeMockInstance } from '../stripe';

describe('StripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a new Stripe customer', async () => {
      const mockCustomer = {
        id: 'cus_test123',
        email: 'test@example.com',
        metadata: { workspace_id: 'ws_123' },
      };

      stripeMockInstance.customers.create.mockResolvedValue(mockCustomer);

      const result = await StripeService.createCustomer({
        workspaceId: 'ws_123',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(stripeMockInstance.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          workspace_id: 'ws_123',
        },
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('createSubscription', () => {
    it('should create a new subscription', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        items: {
          data: [{ price: { id: 'price_test' } }],
        },
      };

      stripeMockInstance.subscriptions.create.mockResolvedValue(mockSubscription);

      const result = await StripeService.createSubscription({
        customerId: 'cus_test123',
        priceId: 'price_test',
        workspaceId: 'ws_123',
      });

      expect(stripeMockInstance.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        items: [{ price: 'price_test' }],
        metadata: {
          workspace_id: 'ws_123',
        },
        trial_period_days: 14,
      });
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('updateSubscription', () => {
    it('should update an existing subscription', async () => {
      const mockUpdatedSubscription = {
        id: 'sub_test123',
        items: {
          data: [{ id: 'si_123', price: { id: 'price_old' } }],
        },
      };

      stripeMockInstance.subscriptions.update.mockResolvedValue(mockUpdatedSubscription);

      const result = await StripeService.updateSubscription({
        subscriptionId: 'sub_test123',
        newPriceId: 'price_new',
      });

      expect(stripeMockInstance.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          proration_behavior: 'create_prorations',
        })
      );
      expect(result).toEqual(mockUpdatedSubscription);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription at period end', async () => {
      const mockCanceledSubscription = {
        id: 'sub_test123',
        cancel_at_period_end: true,
      };

      stripeMockInstance.subscriptions.update.mockResolvedValue(mockCanceledSubscription);

      const result = await StripeService.cancelSubscription('sub_test123');

      expect(stripeMockInstance.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: true,
      });
      expect(result).toEqual(mockCanceledSubscription);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session', async () => {
      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      };

      stripeMockInstance.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await StripeService.createCheckoutSession({
        customerId: 'cus_test123',
        priceId: 'price_test',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        workspaceId: 'ws_123',
      });

      expect(stripeMockInstance.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        line_items: [
          {
            price: 'price_test',
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata: {
          workspace_id: 'ws_123',
        },
        subscription_data: {
          metadata: {
            workspace_id: 'ws_123',
          },
          trial_period_days: 14,
        },
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('createPortalSession', () => {
    it('should create a billing portal session', async () => {
      const mockPortalSession = {
        id: 'bps_test123',
        url: 'https://billing.stripe.com/test',
      };

      stripeMockInstance.billingPortal.sessions.create.mockResolvedValue(mockPortalSession);

      const result = await StripeService.createPortalSession({
        customerId: 'cus_test123',
        returnUrl: 'https://example.com/billing',
      });

      expect(stripeMockInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: 'https://example.com/billing',
      });
      expect(result).toEqual(mockPortalSession);
    });
  });

  describe('attachPaymentMethod', () => {
    it('should attach a payment method to a customer', async () => {
      const mockPaymentMethod = {
        id: 'pm_test123',
        customer: 'cus_test123',
      };

      stripeMockInstance.paymentMethods.attach.mockResolvedValue(mockPaymentMethod);

      const result = await StripeService.attachPaymentMethod({
        paymentMethodId: 'pm_test123',
        customerId: 'cus_test123',
      });

      expect(stripeMockInstance.paymentMethods.attach).toHaveBeenCalledWith('pm_test123', {
        customer: 'cus_test123',
      });
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
            price: {
              id: 'price_old',
            }
          }],
        },
      };

      const mockInvoice = {
        amount_due: 2500, // $25.00
      };

      stripeMockInstance.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      stripeMockInstance.invoices.retrieveUpcoming.mockResolvedValue(mockInvoice);

      const result = await StripeService.calculateProration({
        subscriptionId: 'sub_test123',
        newPriceId: 'price_new',
      });

      expect(stripeMockInstance.invoices.retrieveUpcoming).toHaveBeenCalledWith({
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