import Stripe from 'stripe';
import { BILLING_PLANS, getPlanByPriceId } from '@/lib/stripe-config';

// Only enforce Stripe configuration in production
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : ({} as Stripe); // Mock object for testing

export interface CreateCustomerParams {
  workspaceId: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  workspaceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId: string;
  cancelAtPeriodEnd?: boolean;
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  immediately?: boolean;
}

export class StripeService {
  /**
   * Create a new Stripe customer for a workspace
   */
  static async createCustomer({
    workspaceId,
    email,
    name,
    metadata = {},
  }: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          workspace_id: workspaceId,
          ...metadata,
        },
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer in Stripe');
    }
  }

  /**
   * Create a subscription for a customer
   */
  static async createSubscription({
    customerId,
    priceId,
    workspaceId,
    trialDays,
    metadata = {},
  }: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          workspace_id: workspaceId,
          ...metadata,
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (trialDays && trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);
      return subscription;
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw new Error('Failed to create subscription in Stripe');
    }
  }

  /**
   * Update an existing subscription (e.g., change plan)
   */
  static async updateSubscription({
    subscriptionId,
    priceId,
    cancelAtPeriodEnd,
  }: UpdateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const updateData: Stripe.SubscriptionUpdateParams = {};
      
      // Update price if changing plans
      if (priceId && subscription.items.data[0]?.price.id !== priceId) {
        updateData.items = [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ];
        updateData.proration_behavior = 'always_invoice';
      }
      
      // Update cancellation status
      if (cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = cancelAtPeriodEnd;
      }
      
      const updatedSubscription = await stripe.subscriptions.update(
        subscriptionId,
        updateData
      );
      
      return updatedSubscription;
    } catch (error) {
      console.error('Error updating Stripe subscription:', error);
      throw new Error('Failed to update subscription in Stripe');
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription({
    subscriptionId,
    immediately = false,
  }: CancelSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      if (immediately) {
        // Cancel immediately
        const subscription = await stripe.subscriptions.cancel(subscriptionId);
        return subscription;
      } else {
        // Cancel at end of billing period
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        return subscription;
      }
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error);
      throw new Error('Failed to cancel subscription in Stripe');
    }
  }

  /**
   * Retrieve a subscription
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'default_payment_method'],
      });
      return subscription;
    } catch (error) {
      console.error('Error retrieving Stripe subscription:', error);
      throw new Error('Failed to retrieve subscription from Stripe');
    }
  }

  /**
   * Retrieve a customer
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      throw new Error('Failed to retrieve customer from Stripe');
    }
  }

  /**
   * List all subscriptions for a customer
   */
  static async listSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        expand: ['data.default_payment_method'],
      });
      return subscriptions.data;
    } catch (error) {
      console.error('Error listing Stripe subscriptions:', error);
      throw new Error('Failed to list subscriptions from Stripe');
    }
  }

  /**
   * Create a checkout session for a new subscription
   */
  static async createCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    workspaceId,
  }: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    workspaceId: string;
  }): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          workspace_id: workspaceId,
        },
      });
      return session;
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      throw new Error('Failed to create checkout session in Stripe');
    }
  }

  /**
   * Create a billing portal session for customer to manage subscription
   */
  static async createBillingPortalSession({
    customerId,
    returnUrl,
  }: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      console.error('Error creating Stripe billing portal session:', error);
      throw new Error('Failed to create billing portal session in Stripe');
    }
  }

  /**
   * Add a payment method to a customer
   */
  static async attachPaymentMethod({
    customerId,
    paymentMethodId,
    setAsDefault = false,
  }: {
    customerId: string;
    paymentMethodId: string;
    setAsDefault?: boolean;
  }): Promise<Stripe.PaymentMethod> {
    try {
      // Attach payment method to customer
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default if requested
      if (setAsDefault) {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      return paymentMethod;
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw new Error('Failed to attach payment method');
    }
  }

  /**
   * List payment methods for a customer
   */
  static async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error listing payment methods:', error);
      throw new Error('Failed to list payment methods');
    }
  }

  /**
   * Detach a payment method from a customer
   */
  static async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      console.error('Error detaching payment method:', error);
      throw new Error('Failed to detach payment method');
    }
  }

  /**
   * Calculate proration for a subscription update
   */
  static async calculateProration({
    subscriptionId,
    newPriceId,
  }: {
    subscriptionId: string;
    newPriceId: string;
  }): Promise<number> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const proration = await stripe.invoices.retrieveUpcoming({
        customer: subscription.customer as string,
        subscription: subscriptionId,
        subscription_items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        subscription_proration_behavior: 'always_invoice',
      });
      
      return proration.amount_due;
    } catch (error) {
      console.error('Error calculating proration:', error);
      throw new Error('Failed to calculate proration');
    }
  }
}