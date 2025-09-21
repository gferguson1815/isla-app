"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, MoreVertical, Circle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  label: string;
  completed: boolean;
  action: () => void;
}

export function GettingStartedWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspace as string;

  // Check if we're on an onboarding page or showing the onboarding modal
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOnboardingPage = pathname.includes('/onboarding');
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
      setIsDismissed(true);
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

    // Task 2: Set up your custom domain (if not completed in onboarding)
    if (!steps.domain_added) {
      tasks.push({
        id: "domain",
        label: "Set up your custom domain",
        completed: false,
        action: () => router.push(`/${workspaceSlug}/domains`),
      });
    }

    // Task 3: Invite your teammates (if not completed in onboarding)
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
  // Total onboarding tasks include workspace creation (which is already done) + 3 optional tasks
  const totalOnboardingTasks = 4;
  // Workspace is created (1 task complete) + any additional completed tasks
  const completedTasks = (totalOnboardingTasks - tasks.length);
  const completionPercentage = Math.round((completedTasks / totalOnboardingTasks) * 100);

  // Don't show widget if dismissed or all tasks completed
  useEffect(() => {
    if (workspace?.getting_started_dismissed) {
      setIsDismissed(true);
    }
  }, [workspace]);

  // Don't show widget if:
  // - On an onboarding page
  // - Showing the onboarding complete modal (onboarded=true param)
  // - Widget is dismissed
  // - All tasks are completed
  // - No workspace data
  if (isOnboardingPage || hasOnboardedParam || isDismissed || tasks.length === 0 || !workspace) {
    return null;
  }

  const handleDismiss = async () => {
    await dismissWidget.mutateAsync({ workspaceId: workspace.id });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 right-6 z-50"
      >
        {/* Collapsed state */}
        {!isExpanded && (
          <motion.button
            onClick={() => setIsExpanded(true)}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center">
              <div className="text-[13px] font-semibold">Getting Started</div>
              <div className="text-xs text-gray-300 mt-0.5 font-semibold">{completionPercentage}% complete</div>
            </div>
          </motion.button>
        )}

        {/* Expanded state - positioned above the button */}
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-xl w-[360px] overflow-hidden border border-gray-200"
            >
              {/* Black Header */}
              <div className="bg-black text-white p-4 relative">
                <div className="pr-16">
                  <h3 className="text-base font-semibold">Getting Started</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Get familiar with isla by completing the following tasks
                  </p>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-0.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 hover:bg-gray-800 rounded transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleDismiss}>
                        Dismiss forever
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 hover:bg-gray-800 rounded transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* White body with task list */}
              <div className="bg-white p-4">
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  {tasks.map((task, index) => (
                    <button
                      key={task.id}
                      onClick={task.action}
                      className="w-full px-4 py-3.5 hover:bg-gray-100 transition-colors flex items-center gap-3 group text-gray-900 relative"
                    >
                      <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-left flex-1">{task.label}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      {/* Separator line between items */}
                      {index < tasks.length - 1 && (
                        <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gray-200" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* The button remains visible */}
            <motion.button
              onClick={() => setIsExpanded(false)}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-center">
                <div className="text-[13px] font-semibold">Getting Started</div>
                <div className="text-xs text-gray-300 mt-0.5 font-semibold">{completionPercentage}% complete</div>
              </div>
            </motion.button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}