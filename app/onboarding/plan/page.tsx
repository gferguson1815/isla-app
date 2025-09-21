"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/contexts/auth-context";
import { HelpWidget } from "@/components/help/HelpWidget";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PlanCards } from "./components/PlanCards";
import { StripeErrorBoundary } from "./components/StripeErrorBoundary";

export default function PlanSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
  const [recommendedPlan, setRecommendedPlan] = useState<string>("pro");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [stripeError, setStripeError] = useState<string | null>(null);

  const completeOnboarding = trpc.onboarding.completeOnboarding.useMutation();

  // Extract and validate workspace parameter
  useEffect(() => {
    const slug = searchParams.get("workspace");
    if (!slug) {
      router.push("/onboarding/workspace");
      return;
    }
    setWorkspaceSlug(slug);

    // Extract plan recommendation from URL
    const plan = searchParams.get("plan");
    if (plan && ["pro", "business", "advanced"].includes(plan)) {
      setRecommendedPlan(plan);
    } else {
      setRecommendedPlan("pro"); // Default to pro if missing/invalid
    }
  }, [searchParams, router]);

  // Workspace validation query
  const { data: workspace, isLoading, error } = trpc.workspace.getBySlug.useQuery(
    { slug: workspaceSlug! },
    {
      enabled: !!workspaceSlug,
      retry: false,
    }
  );

  // Redirect if workspace invalid or unauthorized
  useEffect(() => {
    if (workspaceSlug && !isLoading && (!workspace || error)) {
      router.push("/");
    }
  }, [workspace, workspaceSlug, isLoading, error, router]);

  const handlePlanSelect = useCallback(async (planId: string) => {
    if (!workspaceSlug || !workspace) return;

    if (planId === "free") {
      // Mark onboarding as complete in database
      await completeOnboarding.mutateAsync({
        workspaceId: workspace.id,
      });

      // Navigate to links page with onboarded flag for free plan
      router.push(`/${workspaceSlug}/links?onboarded=true`);
      return;
    }

    // Create Stripe checkout session for paid plans
    try {
      setStripeError(null); // Clear any previous errors

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingPeriod,
          workspaceSlug,
          successUrl: `${window.location.origin}/onboarding/complete?workspace=${workspaceSlug}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/onboarding/plan?workspace=${workspaceSlug}&plan=${recommendedPlan}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received from Stripe");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "An unexpected error occurred while setting up payment";
      setStripeError(errorMessage);

      // Trigger error boundary by throwing if it's a critical error
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        throw error;
      }
    }
  }, [workspaceSlug, workspace, billingPeriod, router, recommendedPlan, completeOnboarding]);

  const handleRetryStripe = useCallback(() => {
    setStripeError(null);
    // Force re-render of the plan cards component
  }, []);

  if (!workspaceSlug || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" role="progressbar" aria-label="Loading"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-zinc-900 relative">
        {/* Aurora gradient effect - visible arc at top */}
        <div className="absolute inset-x-0 top-0 h-[40vh] overflow-hidden pointer-events-none">
          {/* Main centered gradient */}
          <div
            className="absolute -top-[15vh] left-1/2 -translate-x-1/2"
            style={{
              width: '120vw',
              height: '50vh',
              background: `
                radial-gradient(
                  ellipse 100% 100% at 50% 0%,
                  rgba(147, 51, 234, 0.25) 0%,
                  rgba(79, 70, 229, 0.2) 20%,
                  rgba(237, 100, 166, 0.15) 40%,
                  transparent 65%
                )
              `,
            }}
          />

          {/* Side color accents */}
          <div
            className="absolute -top-[10vh] left-[15vw]"
            style={{
              width: '35vw',
              height: '35vh',
              background: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 45%)',
            }}
          />

          <div
            className="absolute -top-[10vh] right-[15vw]"
            style={{
              width: '35vw',
              height: '35vh',
              background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 45%)',
            }}
          />

          {/* Soft fade to white at bottom */}
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>

        {/* Logo positioned at top */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10">
          <h1 className="logo-text-header text-4xl text-black dark:text-white">
            isla
          </h1>
        </div>

        {/* Pricing cards centered in viewport */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-20"
        >
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Choose your plan
              </h1>
              <p className="text-base text-gray-600">
                Select a plan that works best for you
              </p>
            </div>

            <StripeErrorBoundary onRetry={handleRetryStripe}>
              {stripeError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800 mb-1">
                        Payment Setup Failed
                      </h3>
                      <p className="text-sm text-red-700">{stripeError}</p>
                      <button
                        onClick={handleRetryStripe}
                        className="mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <PlanCards
                billingPeriod={billingPeriod}
                onBillingPeriodChange={setBillingPeriod}
                recommendedPlan={recommendedPlan}
                onPlanSelect={handlePlanSelect}
              />
            </StripeErrorBoundary>

            {/* Navigation links */}
            <div className="mt-8 flex items-center justify-center gap-6 text-sm">
                <a
                  href="https://isla.so/enterprise"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  Looking for enterprise? <span className="text-xs">↗</span>
                </a>
                <button
                  onClick={() => handlePlanSelect("free")}
                  className="text-gray-900 font-medium hover:text-gray-700"
                >
                  Start for free, pick a plan later
                </button>
                <a
                  href="https://isla.so/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  Compare all plans <span className="text-xs">↗</span>
                </a>
              </div>
          </div>
        </motion.div>

        {/* User info and sign out */}
        {user && (
          <div className="fixed bottom-6 left-6 z-50">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You&apos;re signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{user.email}</span>
              </p>
              <button
                onClick={() => signOut()}
                aria-label="Sign out and sign in as a different user"
                className="inline-block px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
              >
                Sign in as a different user
              </button>
            </div>
          </div>
        )}

        <HelpWidget />
      </div>
    </ErrorBoundary>
  );
}