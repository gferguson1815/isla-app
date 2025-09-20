"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createWorkspaceMutation = trpc.workspace.create.useMutation({
    onSuccess: (workspace) => {
      // Redirect to the new workspace
      router.push(`/${workspace.slug}/links`);
    },
    onError: (error) => {
      console.error("Failed to create workspace:", error);
      alert("Failed to create workspace. Please try again.");
      setIsCreating(false);
    },
  });

  const handleWorkspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setWorkspaceName(name);

    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50);
    setWorkspaceSlug(slug);
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName || !workspaceSlug) {
      alert("Please enter a workspace name");
      return;
    }

    setIsCreating(true);
    createWorkspaceMutation.mutate({
      name: workspaceName,
      slug: workspaceSlug,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Isla! 🎉
            </h1>
            <p className="text-gray-600">
              Let's set up your first workspace to get started
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                type="text"
                placeholder="e.g., My Company, Personal Projects"
                value={workspaceName}
                onChange={handleWorkspaceNameChange}
                className="w-full"
                autoFocus
              />
              <p className="text-sm text-gray-500">
                This is the name of your organization or team
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-slug">Workspace URL</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">app.isla.sh/</span>
                <Input
                  id="workspace-slug"
                  type="text"
                  placeholder="my-workspace"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-gray-500">
                This will be your unique workspace URL
              </p>
            </div>

            {/* User Info */}
            {user && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600">
                  Creating workspace for:
                </p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            )}

            {/* Create Button */}
            <Button
              onClick={handleCreateWorkspace}
              disabled={!workspaceName || !workspaceSlug || isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            >
              {isCreating ? (
                "Creating workspace..."
              ) : (
                <>
                  Create Workspace and Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              You can invite team members and configure settings after creating your workspace
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}