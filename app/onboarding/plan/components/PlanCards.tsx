"use client";

import { useState } from "react";
import { PLANS, type BillingPeriod } from "../lib/plan-config";
import { PlanCard } from "./PlanCard";
import { PlanCardSkeleton } from "./PlanCardSkeleton";
import { cn } from "@/lib/utils";

interface PlanCardsProps {
  billingPeriod: BillingPeriod;
  onBillingPeriodChange: (period: BillingPeriod) => void;
  recommendedPlan: string;
  onPlanSelect: (planId: string) => void;
  isLoading?: boolean;
}

export function PlanCards({
  billingPeriod,
  onBillingPeriodChange,
  recommendedPlan,
  onPlanSelect,
  isLoading = false,
}: PlanCardsProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePlanSelect = async (planId: string) => {
    setLoadingPlan(planId);
    await onPlanSelect(planId);
    // Loading state will be cleared on navigation or error
  };

  return (
    <div>
      {/* Billing period toggle */}
      <div className="flex justify-center mb-8">
        <div className="relative flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onBillingPeriodChange("monthly")}
            className={cn(
              "relative px-6 py-2 text-sm font-medium rounded-md transition-all",
              billingPeriod === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => onBillingPeriodChange("yearly")}
            className={cn(
              "relative px-6 py-2 text-sm font-medium rounded-md transition-all",
              billingPeriod === "yearly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <span className="flex items-center gap-1.5">
              Yearly
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-green-700 bg-green-50 rounded">
                Save 2 months
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards container */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-gray-200">
          {isLoading ? (
            // Show skeleton loading state
            Array.from({ length: 3 }).map((_, index) => (
              <PlanCardSkeleton key={`skeleton-${index}`} />
            ))
          ) : (
            // Show actual plan cards
            PLANS.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingPeriod={billingPeriod}
                isRecommended={plan.id === recommendedPlan}
                isLoading={loadingPlan === plan.id}
                onSelect={() => handlePlanSelect(plan.id)}
                isFirst={index === 0}
                isLast={index === PLANS.length - 1}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}