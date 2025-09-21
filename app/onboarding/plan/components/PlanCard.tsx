"use client";

import { useEffect, useRef } from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { getFeatureIconByName } from "../lib/feature-icons";
import type { Plan, BillingPeriod } from "../lib/plan-config";

interface PlanCardProps {
  plan: Plan;
  billingPeriod: BillingPeriod;
  isRecommended: boolean;
  isLoading: boolean;
  onSelect: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}


// Animated counter component
function AnimatedPrice({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const previousValue = useRef(value);

  useEffect(() => {
    const animation = animate(count, value, {
      duration: 0.5,
      ease: "easeOut",
    });

    previousValue.current = value;
    return animation.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

export function PlanCard({
  plan,
  billingPeriod,
  isRecommended,
  isLoading,
  onSelect,
  isFirst,
  isLast,
}: PlanCardProps) {
  const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

  // Define gradient colors for each plan
  const gradientColors = {
    pro: "from-purple-100/50 via-purple-50/30 to-transparent",
    business: "from-blue-100/50 via-blue-50/30 to-transparent",
    advanced: "from-pink-100/50 via-pink-50/30 to-transparent",
  };

  const badgeColors = {
    pro: "bg-purple-100 text-purple-600",
    business: "bg-blue-100 text-blue-600",
    advanced: "bg-pink-100 text-pink-600",
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Gradient header - only for recommended */}
      {isRecommended && (
        <div className={cn(
          "absolute inset-x-0 top-0 h-32 bg-gradient-to-b",
          gradientColors[plan.id as keyof typeof gradientColors]
        )} />
      )}

      {/* Content */}
      <div className="relative flex flex-col p-4 h-full">
        {/* Plan name and price */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
            {isRecommended && (
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wide",
                badgeColors[plan.id as keyof typeof badgeColors]
              )}>
                Recommended
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-semibold text-gray-900">
              US$<AnimatedPrice value={price} />
            </span>
            <span className="text-sm text-gray-500">per month</span>
          </div>
        </div>

        {/* Get started button */}
        <button
          onClick={onSelect}
          disabled={isLoading}
          className={cn(
            "w-full py-2 px-4 rounded-md font-medium transition-all mb-4 text-sm",
            "bg-gray-900 text-white hover:bg-black",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </span>
          ) : (
            "Get started"
          )}
        </button>

        {/* Features list */}
        <div className="flex-grow">
        {plan.features.map((feature, index) => {
          // First feature is special "Everything in X, plus:"
          if (index === 0 && feature.name.startsWith("Everything in")) {
            return (
              <div key={index} className="text-sm text-gray-600 mb-3">
                {feature.name}, plus:
              </div>
            );
          }

          const Icon = getFeatureIconByName(feature.name);
          let displayText = feature.name;

          // Format features with values
          if (feature.value) {
            if (feature.name.includes("clicks")) {
              displayText = `${feature.value} tracked clicks/mo`;
            } else if (feature.name.includes("links")) {
              displayText = `${feature.value} new links/mo`;
            } else if (feature.name.includes("Analytics")) {
              displayText = `${feature.value} analytics retention`;
            } else if (feature.name.includes("domains")) {
              displayText = `${feature.value} domains`;
            } else if (feature.name.includes("Team members")) {
              displayText = `${feature.value} users`;
            } else if (feature.name.includes("Partner payouts")) {
              displayText = `${feature.value} partner payouts/mo`;
            } else {
              displayText = `${feature.value} ${feature.name.toLowerCase()}`;
            }
          }

          return (
            <div key={index} className="flex items-center gap-2 py-1">
              <Icon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                {displayText}
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}