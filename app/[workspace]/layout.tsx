"use client";

import { useState, useEffect } from "react";
import { usePathname, useParams } from "next/navigation";
import { IconSidebar } from "@/components/navigation/IconSidebar";
import { NavigationPanel } from "@/components/navigation/NavigationPanel";
import { CommandPalette } from "@/components/command/CommandPalette";
import { KeyboardShortcutsDialog } from "@/components/help/KeyboardShortcutsDialog";
import { useGlobalKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { trpc } from "@/lib/trpc/client";

export default function WorkspaceLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Disabled to prevent conflicts with links page shortcuts
  // useGlobalKeyboardShortcuts();
  const { user } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const [activeSection, setActiveSection] = useState("");
  const workspaceSlug = params.workspace as string;

  // Fetch workspace data to get logo
  const { data: workspace } = trpc.workspace.getBySlug.useQuery(
    { slug: workspaceSlug },
    { enabled: !!workspaceSlug }
  );

  // Determine active section based on pathname
  useEffect(() => {
    if (pathname.includes("/program")) {
      setActiveSection("partners");
    } else {
      setActiveSection("links"); // Default to links for all other routes
    }
  }, [pathname]);

  return (
    <>
      <div className="flex h-screen" style={{ backgroundColor: '#e5e5e5' }}>
        {/* Icon Sidebar - 64px */}
        <IconSidebar
          workspaceLogo={workspace?.logo_url || undefined}
          workspaceName={workspace?.name || params.workspace as string}
          userEmail={user?.email || ""}
          userName={user?.user_metadata?.full_name}
          userAvatar={user?.user_metadata?.avatar_url}
        />

        {/* Navigation Panel - 224px */}
        <NavigationPanel activeSection={activeSection} />

        {/* Gap between nav panel and content */}
        <div className="w-2" />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto pt-2">
          <div className="flex flex-col h-[calc(100vh-8px)] rounded-tl-lg bg-white shadow-sm overflow-hidden">
            {children}
          </div>
        </div>
      </div>
      <CommandPalette />
      <KeyboardShortcutsDialog />
    </>
  );
}