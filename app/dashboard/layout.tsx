"use client";

import { useSession } from "@supabase/auth-helpers-react";
import { redirect } from "next/navigation";
import { GlobalNav } from "@/components/navigation/GlobalNav";
import { CommandPalette } from "@/components/command/CommandPalette";
import { KeyboardShortcutsDialog } from "@/components/help/KeyboardShortcutsDialog";
import { QuickCreateDialog } from "@/components/links/QuickCreateDialog";
import { useGlobalKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();

  useGlobalKeyboardShortcuts();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <GlobalNav />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
      <CommandPalette />
      <KeyboardShortcutsDialog />
      <QuickCreateDialog />
    </>
  );
}
