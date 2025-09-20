"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Info, AlertCircle, Loader2, Crown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { HelpWidget } from "@/components/help/HelpWidget";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/components/ui/use-toast";

interface ClaimLinkDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaimLinkDomainModal({ isOpen, onClose }: ClaimLinkDomainModalProps) {
  const [domain, setDomain] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [dnsCheckResult, setDnsCheckResult] = useState<any>(null);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkDNS = trpc.domain.checkDNS.useMutation({
    onSuccess: (data) => {
      setDnsCheckResult(data);
    },
    onError: (error) => {
      setDnsCheckResult({
        valid: false,
        status: 'invalid',
        message: 'Unable to check domain. Please try again.'
      });
    }
  });

  const addDomain = trpc.domain.add.useMutation({
    onSuccess: (data) => {
      // Show success notification with higher priority
      toast({
        title: "Domain interest registered",
        description: `We'll notify you when ${domain}.link becomes available to claim`,
        variant: "default",
        duration: 3000,
      });

      // Redirect to invite page after toast is visible
      const workspaceSlug = searchParams.get("workspace");
      setTimeout(() => {
        if (workspaceSlug) {
          router.push(`/onboarding/invite?workspace=${workspaceSlug}`);
        }
      }, 2000);
    },
    onError: (error) => {
      setIsAddingDomain(false);
      toast({
        title: "Failed to register interest",
        description: error.message || "An error occurred while registering your interest",
        variant: "destructive",
      });
    }
  });

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove .link if user types it
    value = value.replace(/\.link$/i, '');

    // Only allow alphanumeric and hyphens
    value = value.toLowerCase().replace(/[^a-z0-9-]/g, '');

    setDomain(value);

    // Clear any existing timer
    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
      checkTimerRef.current = null;
    }

    // Clear results immediately when typing to avoid showing stale data
    setDnsCheckResult(null);

    // Debounced DNS check with longer delay
    if (value.length > 2) {
      checkTimerRef.current = setTimeout(() => {
        // Add .link to the domain for checking
        checkDNS.mutate({ domain: `${value}.link` });
      }, 750); // Increased delay to reduce flashing
    }
  };

  const handleAddDomain = () => {
    const workspaceSlug = searchParams.get("workspace");
    if (!workspaceSlug) {
      toast({
        title: "Error",
        description: "Workspace not found",
        variant: "destructive",
      });
      return;
    }

    setIsAddingDomain(true);
    // Add .link to the domain when submitting
    addDomain.mutate({
      domain: `${domain}.link`,
      workspaceSlug
    });
  };

  const handleDoThisLater = () => {
    const workspaceSlug = searchParams.get("workspace");
    if (workspaceSlug) {
      router.push(`/onboarding/invite?workspace=${workspaceSlug}`);
    }
  };

  if (!isOpen) return null;

  const showValidationMessage = true; // Always show validation message area like Dub
  const isPointingElsewhere = dnsCheckResult?.status === 'pointing_elsewhere';
  const canAddDomain = domain && dnsCheckResult?.valid && !checkDNS.isLoading && !isAddingDomain;

  return (
    <div className="fixed inset-0 bg-white dark:bg-zinc-900 z-50 overflow-auto">
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
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <div className="bg-white">
            {/* Paid plan required badge */}
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                <Crown className="w-3 h-3" />
                Paid plan required
              </span>
            </div>

            <h1 className="text-2xl font-medium text-center text-gray-900 mb-2">
              Claim your free .link domain
            </h1>

            <p className="text-center text-sm text-gray-500 mb-6">
              Free for a year
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-normal text-gray-700 mb-2">
                  Search domains
                </label>

                {/* Input group with .link suffix */}
                <div className={`rounded-md border ${
                  dnsCheckResult?.exists ? 'border-red-200 bg-red-50/30' :
                  isPointingElsewhere ? 'border-blue-200 bg-blue-50/30' : 'border-gray-300'
                } overflow-hidden`}>
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="yourcompany"
                      value={domain}
                      onChange={handleDomainChange}
                      disabled={isAddingDomain}
                      className="flex-1 px-3 py-2.5 text-sm bg-white border-0 focus:outline-none placeholder:text-gray-400 disabled:opacity-50"
                    />
                    <span className="px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border-l border-gray-300">
                      .link
                    </span>
                  </div>
                  {showValidationMessage && (
                    <div className={`${
                      dnsCheckResult?.exists ? 'bg-red-50 border-red-100' :
                      isPointingElsewhere ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-200'
                    } border-t px-3 py-2.5`}>
                      {checkDNS.isLoading ? (
                        <p className="text-[13px] text-gray-500">
                          Checking domain availability...
                        </p>
                      ) : dnsCheckResult ? (
                        <div className="flex gap-2">
                          {dnsCheckResult.exists && (
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          {isPointingElsewhere && !dnsCheckResult.exists && (
                            <AlertCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            {dnsCheckResult.exists ? (
                              <p className="text-[13px] text-red-600">
                                The domain <span className="font-medium underline">{domain}.link</span> is already in use.
                              </p>
                            ) : isPointingElsewhere ? (
                              <>
                                <p className="text-[13px] text-gray-700">
                                  The domain <span className="font-medium text-blue-600 underline">{domain}.link</span> is currently pointing to an existing website. Only proceed if you're sure you want to use this domain for short links on Isla.
                                </p>
                              </>
                            ) : dnsCheckResult.status === 'available' ? (
                              <p className="text-[13px] text-green-600">
                                {domain}.link is available to claim!
                              </p>
                            ) : dnsCheckResult.status === 'invalid' ? (
                              <p className="text-[13px] text-red-600">
                                {dnsCheckResult.message}
                              </p>
                            ) : (
                              <p className="text-[13px] text-gray-500">
                                {dnsCheckResult.message || 'Enter a domain name to check availability.'}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[13px] text-gray-500">
                          Enter a domain name to check availability.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleAddDomain}
                disabled={!canAddDomain}
                className={`w-full py-2.5 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center ${
                  canAddDomain
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isAddingDomain ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Claiming domain...
                  </>
                ) : (
                  'Claim domain'
                )}
              </button>

              <div className="text-center pt-3">
                <button
                  onClick={handleDoThisLater}
                  disabled={isAddingDomain}
                  className="text-gray-500 hover:text-gray-700 text-[13px] transition-colors disabled:opacity-50"
                >
                  I'll do this later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User info and sign out - same as main page */}
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
    </div>
  );
}