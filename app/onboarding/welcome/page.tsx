"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { HelpWidget } from "@/components/help/HelpWidget";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const { data: workspaces, isLoading: isLoadingWorkspaces } =
    trpc.workspace.list.useQuery(undefined, {
      enabled: !!user,
    });

  useEffect(() => {
    if (!isLoadingWorkspaces && workspaces && workspaces.length > 0) {
      // User already has a workspace - they shouldn't be in onboarding
      // Redirect them to their workspace regardless of onboarding completion status
      const defaultWorkspace = workspaces[0];
      router.replace(`/${defaultWorkspace.slug}/links`);
    }
  }, [workspaces, isLoadingWorkspaces, router]);

  const handleGetStarted = () => {
    router.push("/onboarding/workspace");
  };

  if (isLoadingWorkspaces) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-16 w-16 bg-gray-200 rounded-full mb-4 mx-auto"></div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 w-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4 min-h-screen"
      >
        <div className="text-center">
          <h1 className="logo-text text-black dark:text-white mb-8">
            isla
          </h1>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Isla
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto">
            See which marketing efforts actually drive revenue, not just vanity metrics.
          </p>

          <Button
            onClick={handleGetStarted}
            className="px-12 py-3 w-full max-w-xs mx-auto bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-medium rounded-lg transition-colors"
          >
            Get started
          </Button>
        </div>
      </motion.div>

      {user && (
        <div className="fixed bottom-6 left-6 z-50">
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You&apos;re signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{user.email}</span>
            </p>
            <button
              onClick={() => signOut()}
              className="inline-block px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
            >
              Sign in as a different user
            </button>
          </div>
        </div>
      )}

        <HelpWidget />
      </AuroraBackground>
    </ErrorBoundary>
  );
}