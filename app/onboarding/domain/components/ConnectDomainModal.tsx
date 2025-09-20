"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Info, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { HelpWidget } from "@/components/help/HelpWidget";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/components/ui/use-toast";
import { DNSErrorWrapper } from "./DNSErrorBoundary";

interface ConnectDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectDomainModal({ isOpen }: ConnectDomainModalProps) {
  const [domain, setDomain] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [dnsCheckResult, setDnsCheckResult] = useState<{
    valid: boolean;
    status: string;
    message?: string;
    exists?: boolean;
  } | null>(null);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkDNS = trpc.domain.checkDNS.useMutation({
    onSuccess: (data) => {
      setDnsCheckResult(data);
    },
    onError: () => {
      setDnsCheckResult({
        valid: false,
        status: 'invalid',
        message: 'Unable to check domain. Please try again.'
      });
    }
  });

  const addDomain = trpc.domain.add.useMutation({
    onSuccess: () => {
      // Show success notification with higher priority
      toast({
        title: "Domain added successfully",
        description: `${domain} has been added to your workspace`,
        variant: "default"
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
        title: "Failed to add domain",
        description: error.message || "An error occurred while adding the domain",
        variant: "destructive"
      });
    }
  });

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDomain(value);

    // Clear any existing timer
    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
      checkTimerRef.current = null;
    }

    // Clear results immediately when typing to avoid showing stale data
    setDnsCheckResult(null);

    // Debounced DNS check with longer delay
    if (value.length > 3 && value.includes('.')) {
      checkTimerRef.current = setTimeout(() => {
        checkDNS.mutate({ domain: value });
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
    addDomain.mutate({
      domain,
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
  const canAddDomain = domain && dnsCheckResult?.valid && !checkDNS.isPending && !isAddingDomain;

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
            <h1 className="text-2xl font-medium text-center text-gray-900 mb-1.5">
              Connect a custom domain
            </h1>

            <p className="text-center mb-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 underline decoration-gray-300 underline-offset-2">
                Read our guide for best practices
              </a>
            </p>

            <div className="space-y-4">
              <div>
                <div className="relative">
                  <label className="block text-[13px] font-normal text-gray-700 mb-2">
                    <span>Your domain</span>
                    <div
                      className="inline-block ml-1"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <Info className="w-[14px] h-[14px] text-gray-400 inline-block cursor-help" />

                      {/* Tooltip */}
                      {showTooltip && (
                        <div
                          className="absolute left-28 -top-14 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-[300px]"
                          style={{
                            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          <div className="text-sm font-semibold text-gray-900 mb-1">
                            Connect a custom domain
                          </div>
                          <div className="text-sm text-gray-600">
                            Not sure which domain to use?
                          </div>
                          <a
                            href="#"
                            className="text-sm text-gray-600 underline decoration-1 underline-offset-2 hover:text-gray-800"
                          >
                            Check out our guide
                          </a>

                          {/* Arrow pointing to info icon */}
                          <div
                            className="absolute -left-2 top-[50%] -translate-y-1/2 w-0 h-0"
                            style={{
                              borderTop: '6px solid transparent',
                              borderBottom: '6px solid transparent',
                              borderRight: '8px solid #e5e7eb',
                            }}
                          />
                          <div
                            className="absolute -left-[7px] top-[50%] -translate-y-1/2 w-0 h-0"
                            style={{
                              borderTop: '6px solid transparent',
                              borderBottom: '6px solid transparent',
                              borderRight: '8px solid white',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Input group */}
                <div className={`rounded-md border ${
                  dnsCheckResult?.exists ? 'border-red-200 bg-red-50/30' :
                  isPointingElsewhere ? 'border-blue-200 bg-blue-50/30' : 'border-gray-300'
                } overflow-hidden`}>
                  <input
                    type="text"
                    placeholder="go.acme.com"
                    value={domain}
                    onChange={handleDomainChange}
                    disabled={isAddingDomain}
                    className="w-full px-3 py-2.5 text-sm bg-white border-0 focus:outline-none placeholder:text-gray-400 disabled:opacity-50"
                  />
                  {showValidationMessage && (
                    <DNSErrorWrapper
                      onError={(error) => {
                        console.error('DNS checking error:', error);
                        // Optionally show toast notification
                        toast({
                          title: "DNS Check Error",
                          description: "There was an issue checking your domain. Please try again.",
                          variant: "destructive"
                        });
                      }}
                    >
                      <div className={`${
                        dnsCheckResult?.exists ? 'bg-red-50 border-red-100' :
                        isPointingElsewhere ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-200'
                      } border-t px-3 py-2.5`}>
                        {checkDNS.isPending ? (
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
                                The domain <span className="font-medium underline">{domain}</span> is already in use.
                              </p>
                            ) : isPointingElsewhere ? (
                              <>
                                <p className="text-[13px] text-gray-700">
                                  The domain <span className="font-medium text-blue-600 underline">{domain}</span> is currently pointing to an existing website. Only proceed if you&apos;re sure you want to use this domain for short links on Isla.
                                </p>
                              </>
                            ) : dnsCheckResult.status === 'available' ? (
                              <p className="text-[13px] text-green-600">
                                {dnsCheckResult.message}
                              </p>
                            ) : dnsCheckResult.status === 'invalid' ? (
                              <p className="text-[13px] text-red-600">
                                {dnsCheckResult.message}
                              </p>
                            ) : (
                              <p className="text-[13px] text-gray-500">
                                {dnsCheckResult.message || 'Enter a valid domain to check availability.'}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[13px] text-gray-500">
                          Enter a valid domain to check availability.
                        </p>
                      )}
                      </div>
                    </DNSErrorWrapper>
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
                    Adding domain...
                  </>
                ) : (
                  'Add domain'
                )}
              </button>

              <div className="text-center pt-3">
                <button
                  onClick={handleDoThisLater}
                  disabled={isAddingDomain}
                  className="text-gray-500 hover:text-gray-700 text-[13px] transition-colors disabled:opacity-50"
                >
                  I&apos;ll do this later
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