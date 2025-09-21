"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Loader2 } from "lucide-react";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceSlug = searchParams.get("workspace");
  const sessionId = searchParams.get("session_id");

  const completeOnboarding = trpc.onboarding.completeOnboarding.useMutation();
  const { data: workspace } = trpc.workspace.getBySlug.useQuery(
    { slug: workspaceSlug! },
    { enabled: !!workspaceSlug }
  );

  useEffect(() => {
    if (!workspaceSlug || !workspace) return;

    // Mark onboarding as complete after successful payment
    const markComplete = async () => {
      try {
        await completeOnboarding.mutateAsync({
          workspaceId: workspace.id,
        });

        // Redirect to workspace with onboarded flag
        router.push(`/${workspaceSlug}/links?onboarded=true`);
      } catch (error) {
        console.error("Failed to complete onboarding:", error);
        // Still redirect even if marking fails - user has paid
        router.push(`/${workspaceSlug}/links?onboarded=true`);
      }
    };

    markComplete();
  }, [workspaceSlug, workspace, router, completeOnboarding]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Setting up your workspace...
        </h2>
        <p className="text-sm text-gray-600">
          Please wait while we complete your setup
        </p>
      </div>
    </div>
  );
}