"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { IconSidebar } from "@/components/navigation/IconSidebar";
import { NavigationPanel } from "@/components/navigation/NavigationPanel";
import { CommandPalette } from "@/components/command/CommandPalette";
import { KeyboardShortcutsDialog } from "@/components/help/KeyboardShortcutsDialog";
import { QuickCreateDialog } from "@/components/links/QuickCreateDialog";
import { useGlobalKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useGlobalKeyboardShortcuts();
  const { user } = useAuth();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("");

  // Determine active section based on pathname
  useEffect(() => {
    if (pathname.startsWith("/partners")) {
      setActiveSection("partners");
    } else {
      setActiveSection("links"); // Default to links for all other routes including dashboard
    }
  }, [pathname]);

  return (
    <>
      <div className="flex h-screen">
        {/* Icon Sidebar - 64px */}
        <IconSidebar
          workspaceName="Isla"
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
          {children}
        </div>
      </div>
      <CommandPalette />
      <KeyboardShortcutsDialog />
      <QuickCreateDialog />
    </>
  );
}
