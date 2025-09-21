
export type PlanId = "free" | "pro" | "business" | "advanced" | "enterprise";
export type BillingPeriod = "monthly" | "yearly";

export interface PlanFeature {
  name: string;
  included: boolean;
  value?: string | number;
}

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  badge?: string;
}

export const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 30,
    yearlyPrice: 25,
    description: "Perfect for growing businesses",
    features: [
      { name: "Everything in Free", included: true },
      { name: "Tracked clicks per month", included: true, value: "50K" },
      { name: "New links per month", included: true, value: "1K" },
      { name: "Analytics retention", included: true, value: "1 year" },
      { name: "Custom domains", included: true, value: "10" },
      { name: "Team members", included: true, value: "3" },
      { name: "Advanced link features", included: true },
      { name: "Unlimited AI credits", included: true },
      { name: "Free .link domain", included: true },
      { name: "Link folders", included: true },
      { name: "Deep links", included: true },
    ],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 90,
    yearlyPrice: 75,
    description: "For teams that need more power",
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Tracked clicks per month", included: true, value: "250K" },
      { name: "New links per month", included: true, value: "10K" },
      { name: "Analytics retention", included: true, value: "3 years" },
      { name: "Partner payouts per month", included: true, value: "$2.5K" },
      { name: "Team members", included: true, value: "10" },
      { name: "Real-time events stream", included: true },
      { name: "Partner management", included: true },
      { name: "A/B testing (beta)", included: true },
      { name: "Customer insights", included: true },
      { name: "Event webhooks", included: true },
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    monthlyPrice: 300,
    yearlyPrice: 250,
    description: "Enterprise-grade features",
    features: [
      { name: "Everything in Business", included: true },
      { name: "Tracked clicks per month", included: true, value: "1M" },
      { name: "New links per month", included: true, value: "50K" },
      { name: "Analytics retention", included: true, value: "5 years" },
      { name: "Partner payouts per month", included: true, value: "$15K" },
      { name: "Team members", included: true, value: "20" },
      { name: "Advanced reward structures", included: true },
      { name: "Embedded referral dashboard", included: true },
      { name: "Messaging center", included: true },
      { name: "Partners API", included: true },
      { name: "Priority Slack support", included: true },
    ],
  },
];

export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
  },
  business: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY,
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEARLY,
  },
  advanced: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADVANCED_MONTHLY,
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADVANCED_YEARLY,
  },
};

export function getPlanById(planId: PlanId): Plan | undefined {
  return PLANS.find((plan) => plan.id === planId);
}

export function getStripePriceId(
  planId: Exclude<PlanId, "free" | "enterprise">,
  billingPeriod: BillingPeriod
): string | undefined {
  return STRIPE_PRICE_IDS[planId]?.[billingPeriod];
}