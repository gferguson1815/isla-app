"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/contexts/auth-context";
import { HelpWidget } from "@/components/help/HelpWidget";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import UsageForm from "./components/UsageForm";

export default function UsageOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);

  // Extract and validate workspace parameter
  useEffect(() => {
    const slug = searchParams.get("workspace");
    if (!slug) {
      router.push("/onboarding/workspace");
      return;
    }
    setWorkspaceSlug(slug);
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
      router.push("/dashboard");
    }
  }, [workspace, workspaceSlug, isLoading, error, router]);

  const handleContinue = useCallback((formData: {
    linksPerMonth: string;
    clicksPerMonth: string;
    trackConversions: string;
    partnerProgram: string;
  }) => {
    // Determine recommended plan based on user selections
    let recommendedPlan = "pro"; // Default to Pro

    // Plan recommendation logic:
    // - Free tier is not offered in onboarding (they start with trial)
    // - Pro: Up to 50K clicks, 1K links, basic features
    // - Business: Up to 250K clicks, 10K links, conversion tracking, partner payouts
    // - Advanced: 1M+ clicks, 50K links, all advanced features

    // Check for Advanced tier needs (highest priority)
    if (
      formData.clicksPerMonth === "1m" ||
      formData.linksPerMonth === "50k"
    ) {
      recommendedPlan = "advanced";
    }
    // Check for Business tier needs
    else if (
      formData.clicksPerMonth === "250k" ||
      formData.linksPerMonth === "10k" ||
      formData.partnerProgram === "yes" ||  // Partner program requires Business tier
      formData.trackConversions === "yes"   // Conversion tracking requires Business tier
    ) {
      recommendedPlan = "business";
    }
    // Default to Pro for basic needs (no conversions, no partner program, minimal usage)
    else {
      recommendedPlan = "pro";
    }

    // Navigate to plan selection page with recommended plan
    router.push(`/onboarding/plan?plan=${recommendedPlan}&workspace=${workspaceSlug}`);
  }, [router, workspaceSlug]);

  if (!workspaceSlug || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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

        {/* Form centered in viewport */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-24"
        >
          <div className="w-full max-w-md">
            <div className="relative">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Estimate your usage
                </h1>
                <p className="text-base text-gray-500 leading-relaxed">
                  Give us a few details about your usage<br />
                  and we&apos;ll help recommend the best plan
                </p>
              </div>

              <UsageForm
                onContinue={handleContinue}
              />
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