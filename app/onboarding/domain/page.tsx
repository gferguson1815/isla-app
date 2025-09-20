"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { HelpWidget } from "@/components/help/HelpWidget";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Link, Crown } from "lucide-react";
import ConnectDomainModal from "./components/ConnectDomainModal";

export default function DomainOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

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

  const handleSkip = () => {
    if (workspaceSlug) {
      router.push(`/onboarding/invite?workspace=${workspaceSlug}`);
    }
  };

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
        <div className="absolute inset-x-0 top-0 h-[30vh] overflow-hidden pointer-events-none">
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
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
          <h1 className="logo-text-header text-5xl text-black dark:text-white">
            isla
          </h1>
        </div>

        {/* Form centered in viewport */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center justify-center min-h-screen px-4"
        >
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-xl p-8">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-semibold text-gray-900 mb-3">
                  Add a custom domain
                </h2>
                <p className="text-base text-gray-600">
                  Make your links stand out and<br />
                  <span className="underline decoration-2 decoration-gray-400 underline-offset-2">boost click-through rates by 30%</span>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Connect custom domain card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors cursor-pointer group relative">
                  <div className="text-center pt-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-200 transition-colors">
                      <Link className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Connect a custom domain
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Already have a domain? Connect it<br />to Isla in just a few clicks
                    </p>
                    <Button
                      onClick={() => setConnectModalOpen(true)}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      Connect domain
                    </Button>
                  </div>
                </div>

                {/* Claim .link domain card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors cursor-pointer group relative opacity-75">
                  {/* Coming Soon badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
                      Coming Soon
                    </span>
                  </div>

                  <div className="text-center pt-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-200 transition-colors">
                      <Crown className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Claim a free <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-sm">.link</span> domain
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Register a domain like<br /><span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">company.link</span> – free for 1 year
                    </p>
                    <Button
                      className="w-full bg-gray-400 hover:bg-gray-400 text-white cursor-not-allowed"
                      disabled
                    >
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </div>

              {/* Skip option */}
              <div className="text-center">
                <button
                  onClick={handleSkip}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  I&apos;ll do this later
                </button>
              </div>
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
                className="inline-block px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
              >
                Sign in as a different user
              </button>
            </div>
          </div>
        )}

        <HelpWidget />

        {/* Modals */}
        <ConnectDomainModal
          isOpen={connectModalOpen}
          onClose={() => setConnectModalOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
}