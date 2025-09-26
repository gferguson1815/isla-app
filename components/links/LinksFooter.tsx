"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { ChevronRight, Circle, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LinksFooterProps {
  totalLinks?: number;
  currentPage?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
}

interface Task {
  id: string;
  label: string;
  completed: boolean;
  action: () => void;
}

export function LinksFooter({
  totalLinks = 0,
  currentPage = 1,
  hasNextPage = false,
  hasPreviousPage = false,
  onNextPage,
  onPreviousPage,
}: LinksFooterProps) {
  const [isGettingStartedDismissed, setIsGettingStartedDismissed] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const searchParams = useSearchParams();
  const hasOnboardedParam = searchParams.get('onboarded') === 'true';

  // Get workspace data to check task completion status
  const { data: workspace } = trpc.workspace.getBySlug.useQuery(
    { slug: workspaceSlug },
    { enabled: !!workspaceSlug }
  );

  // Check if workspace has any links
  const { data: links } = trpc.link.list.useQuery(
    { workspaceId: workspace?.id || "", limit: 1 },
    { enabled: !!workspace?.id }
  );

  // Mutation to dismiss widget forever
  const dismissWidget = trpc.workspace.dismissGettingStarted.useMutation({
    onSuccess: () => {
      setIsGettingStartedDismissed(true);
    },
  });

  // Calculate tasks and completion
  const getTasks = (): Task[] => {
    if (!workspace) return [];

    const steps = (workspace.onboarding_steps as Record<string, boolean>) || {};
    const tasks: Task[] = [];

    // Task 1: Create your first short link
    if (!steps.first_link || links?.links.length === 0) {
      tasks.push({
        id: "first_link",
        label: "Create your first short link",
        completed: false,
        action: () => router.push(`/${workspaceSlug}/links?action=create`),
      });
    }

    // Task 2: Set up your custom domain
    if (!steps.domain_added) {
      tasks.push({
        id: "domain",
        label: "Set up your custom domain",
        completed: false,
        action: () => router.push(`/${workspaceSlug}/domains`),
      });
    }

    // Task 3: Invite your teammates
    if (!steps.team_invited) {
      tasks.push({
        id: "team",
        label: "Invite your teammates",
        completed: false,
        action: () => router.push(`/${workspaceSlug}/settings/team`),
      });
    }

    return tasks;
  };

  const tasks = getTasks();
  const totalOnboardingTasks = 4;
  const completedTasks = totalOnboardingTasks - tasks.length;
  const completionPercentage = Math.round((completedTasks / totalOnboardingTasks) * 100);

  // Check if we should show getting started
  const shouldShowGettingStarted =
    !hasOnboardedParam &&
    !isGettingStartedDismissed &&
    !workspace?.getting_started_dismissed &&
    tasks.length > 0 &&
    workspace;

  const handleDismiss = async () => {
    await dismissWidget.mutateAsync({ workspaceId: workspace!.id });
  };

  return (
    <div className="pb-6 relative" style={{ marginLeft: '109.5px', marginRight: '109.5px' }}>
      <div className="flex items-center justify-center">
        {/* Pagination section - centered with more width */}
        <div className="w-full max-w-xl">
          <div className="px-6 py-3 border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Viewing {totalLinks} {totalLinks === 1 ? 'link' : 'links'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={!hasPreviousPage}
                  onClick={onPreviousPage}
                  className="px-3 py-1.5 text-sm text-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed hover:text-gray-700 transition-colors"
                >
                  Previous
                </button>
                <div className="h-4 w-px bg-gray-200"></div>
                <button
                  disabled={!hasNextPage}
                  onClick={onNextPage}
                  className="px-3 py-1.5 text-sm text-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed hover:text-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started section - right aligned, absolute positioning */}
        {shouldShowGettingStarted && (
          <div className="absolute right-0 bg-gray-900 text-white rounded-full shadow-md">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-5 py-2.5 hover:bg-gray-800 rounded-full transition-colors">
                  <div className="text-center">
                    <div className="text-[13px] font-semibold">Getting Started</div>
                    <div className="text-xs text-gray-300 mt-0.5 font-semibold">
                      {completionPercentage}% complete
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[320px] p-0">
                {/* Header */}
                <div className="bg-black text-white p-4 rounded-t-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">Getting Started</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Complete these tasks to get familiar with isla
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-gray-800 rounded transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleDismiss}>
                          Dismiss forever
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-3">
                  <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                    {tasks.map((task, index) => (
                      <button
                        key={task.id}
                        onClick={task.action}
                        className="w-full px-3 py-2.5 hover:bg-gray-100 transition-colors flex items-center gap-3 group text-gray-900 relative text-left"
                      >
                        <Circle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm flex-1">{task.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                        {index < tasks.length - 1 && (
                          <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-gray-100" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}