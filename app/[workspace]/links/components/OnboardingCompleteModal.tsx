"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FlickeringGrid } from "@/src/components/ui/shadcn-io/flickering-grid";
import { Logo } from "@/components/brand/Logo";
import { trpc } from "@/lib/trpc/client";

export function OnboardingCompleteModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownBefore, setHasShownBefore] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const workspaceSlug = params.workspace as string;

  // Get workspace data to check onboarding status
  const { data: workspace } = trpc.workspace.getBySlug.useQuery(
    { slug: workspaceSlug },
    { enabled: !!workspaceSlug }
  );

  useEffect(() => {
    // Check if onboarded=true is in URL and we haven't shown modal yet
    if (searchParams.get("onboarded") === "true" && !hasShownBefore) {
      // Check if onboarding was already completed previously
      if (workspace && workspace.onboarding_completed_at) {
        // Already completed before, don't show modal again
        handleGetStarted();
      } else {
        // First time completing, show the modal
        setIsOpen(true);
        setHasShownBefore(true);
      }
    }
  }, [searchParams, workspace, hasShownBefore]);

  const handleGetStarted = () => {
    // Clean up URL and close modal
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("onboarded");
    const newUrl = newSearchParams.toString()
      ? `${pathname}?${newSearchParams.toString()}`
      : pathname;

    // Update URL without triggering navigation
    window.history.replaceState({}, "", newUrl);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Semi-transparent backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/75 backdrop-blur-[1px] z-50"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden h-[400px] flex flex-col">
              {/* Gradient header with flickering grid - 50% height */}
              <div className="h-[50%] relative bg-gradient-to-br from-purple-500/60 via-blue-500/60 to-pink-500/60 overflow-hidden">
                <FlickeringGrid
                  className="absolute inset-0 z-0"
                  squareSize={4}
                  gridGap={6}
                  color="#ffffff"
                  maxOpacity={0.5}
                  flickerChance={0.1}
                />

                {/* Logo */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Logo size="xl" variant="default" type="wordmark" />
                </div>
              </div>

              {/* Content - 50% height */}
              <div className="h-[50%] px-8 py-6 text-center flex flex-col justify-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to isla!
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Thanks for signing up – your account is ready to go!
                  Now you have one central, organized place to build
                  and manage all your short links.
                </p>

                {/* Get started button */}
                <button
                  onClick={handleGetStarted}
                  className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
                >
                  Get started
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}