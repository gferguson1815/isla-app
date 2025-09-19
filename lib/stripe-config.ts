export const BILLING_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: process.env.STRIPE_PRICE_FREE || '',
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
    priceId: process.env.STRIPE_PRICE_STARTER || '',
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
    priceId: process.env.STRIPE_PRICE_GROWTH || '',
    limits: {
      maxUsers: -1, // Unlimited
      maxLinks: 10000,
      maxClicks: 100000,
      customDomains: true,
    },
  },
} as const;

export type BillingPlan = typeof BILLING_PLANS[keyof typeof BILLING_PLANS];
export type PlanId = 'free' | 'starter' | 'growth';

export function getPlanByPriceId(priceId: string): BillingPlan | null {
  return Object.values(BILLING_PLANS).find(plan => plan.priceId === priceId) || null;
}

export function getPlanById(planId: PlanId): BillingPlan {
  return BILLING_PLANS[planId.toUpperCase() as keyof typeof BILLING_PLANS];
}