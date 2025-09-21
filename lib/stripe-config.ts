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
  PRO: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 30,
    yearlyPrice: 25,
    priceIds: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
    },
    limits: {
      maxUsers: 3,
      maxLinks: 1000,
      maxClicks: 50000,
      customDomains: 10,
      analyticsRetention: 365, // days
      aiCredits: -1, // unlimited
    },
  },
  BUSINESS: {
    id: 'business',
    name: 'Business',
    monthlyPrice: 90,
    yearlyPrice: 75,
    priceIds: {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || '',
      yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || '',
    },
    limits: {
      maxUsers: 10,
      maxLinks: 10000,
      maxClicks: 250000,
      customDomains: -1, // unlimited
      analyticsRetention: 1095, // 3 years in days
      partnerPayouts: 2500,
      aiCredits: -1, // unlimited
    },
  },
  ADVANCED: {
    id: 'advanced',
    name: 'Advanced',
    monthlyPrice: 300,
    yearlyPrice: 250,
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ADVANCED_MONTHLY || '',
      yearly: process.env.STRIPE_PRICE_ADVANCED_YEARLY || '',
    },
    limits: {
      maxUsers: 20,
      maxLinks: 50000,
      maxClicks: 1000000,
      customDomains: -1, // unlimited
      analyticsRetention: 1825, // 5 years in days
      partnerPayouts: 15000,
      aiCredits: -1, // unlimited
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: -1, // custom pricing
    yearlyPrice: -1, // custom pricing
    priceIds: {
      monthly: '',
      yearly: '',
    },
    limits: {
      maxUsers: -1, // unlimited
      maxLinks: -1, // unlimited
      maxClicks: -1, // unlimited
      customDomains: -1, // unlimited
      analyticsRetention: -1, // unlimited
      partnerPayouts: -1, // unlimited
      aiCredits: -1, // unlimited
    },
  },
} as const;

export type BillingPlan = typeof BILLING_PLANS[keyof typeof BILLING_PLANS];
export type PlanId = 'free' | 'pro' | 'business' | 'advanced' | 'enterprise';

export function getPlanByPriceId(priceId: string): BillingPlan | null {
  for (const plan of Object.values(BILLING_PLANS)) {
    if ('priceId' in plan && plan.priceId === priceId) {
      return plan;
    }
    if ('priceIds' in plan) {
      if (plan.priceIds.monthly === priceId || plan.priceIds.yearly === priceId) {
        return plan;
      }
    }
  }
  return null;
}

export function getPlanById(planId: PlanId): BillingPlan {
  return BILLING_PLANS[planId.toUpperCase() as keyof typeof BILLING_PLANS];
}