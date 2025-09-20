"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Command as CommandPrimitive } from "cmdk";
import Fuse from "fuse.js";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, commandRegistry } from "@/lib/command-registry";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { CommandErrorBoundary, useCommandErrorHandler } from "./CommandErrorBoundary";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import {
  Home,
  Link2,
  BarChart3,
  Settings,
  Plus,
  Search,
  ArrowRight,
  Zap,
  FileText,
  Users,
  Tag,
  Folder,
} from "lucide-react";

const fuseOptions = {
  keys: ["name", "description", "keywords"],
  threshold: 0.3,
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [commands, setCommands] = useState<Command[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [recentCommands, setRecentCommands] = useState<Command[]>([]);
  const { hasPermission, isAdmin } = usePermissions();
  const { handleCommandError } = useCommandErrorHandler();
  const { startRender, endRender, startSearch, endSearch } = usePerformanceMonitor("CommandPalette");
  const isInitialized = useRef(false);

  // Define all commands using useMemo to prevent recreation
  const allCommands = useMemo(() => [
      {
        id: "home",
        name: "Go to Dashboard",
        description: "Navigate to the dashboard",
        category: "navigation",
        icon: Home,
        shortcut: "G H",
        handler: () => router.push("/dashboard"),
        keywords: ["dashboard", "home", "overview"],
      },
      {
        id: "links",
        name: "Go to Links",
        description: "Navigate to links page",
        category: "navigation",
        icon: Link2,
        shortcut: "G L",
        handler: () => router.push("/links"),
        keywords: ["links", "urls", "shortcuts"],
      },
      {
        id: "analytics",
        name: "Go to Analytics",
        description: "Navigate to analytics page",
        category: "navigation",
        icon: BarChart3,
        shortcut: "G A",
        handler: () => router.push("/analytics"),
        keywords: ["analytics", "stats", "metrics"],
      },
      {
        id: "settings",
        name: "Go to Settings",
        description: "Navigate to settings page",
        category: "navigation",
        icon: Settings,
        shortcut: "G S",
        handler: () => router.push("/settings"),
        keywords: ["settings", "preferences", "config"],
      },
      {
        id: "create-link",
        name: "Create New Link",
        description: "Create a new short link",
        category: "actions",
        icon: Plus,
        shortcut: "C",
        handler: () => {
          const event = new CustomEvent("openQuickCreate");
          window.dispatchEvent(event);
          setOpen(false);
        },
        keywords: ["create", "new", "link", "add"],
        permission: Permission.LINKS_CREATE,
      },
      {
        id: "search-links",
        name: "Search Links",
        description: "Search through your links",
        category: "search",
        icon: Search,
        shortcut: "/",
        handler: () => {
          router.push("/links");
          setTimeout(() => {
            const event = new CustomEvent("focusSearch");
            window.dispatchEvent(event);
          }, 100);
          setOpen(false);
        },
        keywords: ["search", "find", "filter"],
      },
      {
        id: "search-analytics",
        name: "Search Analytics",
        description: "Search analytics data",
        category: "search",
        icon: BarChart3,
        handler: () => {
          router.push("/analytics");
          setOpen(false);
        },
        keywords: ["search", "analytics", "data"],
      },
      {
        id: "workspace-settings",
        name: "Workspace Settings",
        description: "Manage workspace settings",
        category: "actions",
        icon: Settings,
        handler: () => router.push("/settings/workspace"),
        keywords: ["workspace", "team", "organization"],
        requiresAdmin: true,
      },
      {
        id: "team-members",
        name: "Team Members",
        description: "Manage team members",
        category: "actions",
        icon: Users,
        handler: () => router.push("/settings/team"),
        keywords: ["team", "members", "users", "invite"],
        requiresAdmin: true,
      },
      {
        id: "tags",
        name: "Manage Tags",
        description: "View and manage tags",
        category: "actions",
        icon: Tag,
        handler: () => router.push("/links?view=tags"),
        keywords: ["tags", "labels", "categories"],
      },
      {
        id: "folders",
        name: "Manage Folders",
        description: "View and manage folders",
        category: "actions",
        icon: Folder,
        handler: () => router.push("/links?view=folders"),
        keywords: ["folders", "directories", "organize"],
      },
      {
        id: "api-keys",
        name: "API Keys",
        description: "Manage API keys",
        category: "actions",
        icon: Zap,
        handler: () => router.push("/settings/api"),
        keywords: ["api", "keys", "tokens", "integration"],
        requiresAdmin: true,
      },
      {
        id: "documentation",
        name: "Documentation",
        description: "View documentation",
        category: "actions",
        icon: FileText,
        handler: () => window.open("https://docs.isla.sh", "_blank"),
        keywords: ["docs", "help", "guide"],
      },
    ], [router, setOpen]);

  // Filter commands based on permissions
  const permissionFilteredCommands = useMemo(() => {
    return allCommands.filter(cmd => {
      // Check permission-based visibility
      if ((cmd as any).permission && !hasPermission((cmd as any).permission)) {
        return false;
      }
      // Check admin-only visibility
      if ((cmd as any).requiresAdmin && !isAdmin()) {
        return false;
      }
      return true;
    });
  }, [allCommands, hasPermission, isAdmin]);

  // Register commands only once on initial mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    startRender();
    commandRegistry.clear();
    commandRegistry.registerBatch(permissionFilteredCommands);

    const registeredCommands = commandRegistry.getAll();
    setCommands(registeredCommands);
    setRecentCommands(commandRegistry.getRecentCommands());

    // Track command loading performance
    endRender(registeredCommands.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (search) {
      startSearch();
      const fuse = new Fuse(commands, fuseOptions);
      const results = fuse.search(search);
      const filteredResults = results.map((result) => result.item);
      setFilteredCommands(filteredResults);
      endSearch(filteredResults.length);
    } else {
      setFilteredCommands([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, commands]);

  const handleCommand = useCallback(async (command: Command) => {
    try {
      await commandRegistry.execute(command.id);
      setOpen(false);
      setSearch("");
      setRecentCommands(commandRegistry.getRecentCommands());
    } catch (error) {
      handleCommandError(error as Error, `command: ${command.name}`);
      // Keep the dialog open so user can try again
    }
  }, [handleCommandError]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("openCommandPalette", handleOpen);
    return () => window.removeEventListener("openCommandPalette", handleOpen);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigationCommands = commandRegistry.getByCategory("navigation");
  const actionCommands = commandRegistry.getByCategory("actions");
  const searchCommands = commandRegistry.getByCategory("search");

  const displayCommands = search ? filteredCommands : commands;

  return (
    <CommandErrorBoundary>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl">
          <CommandPrimitive className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandPrimitive.Input
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandPrimitive.List className="max-h-[450px] overflow-y-auto overflow-x-hidden">
            <CommandPrimitive.Empty className="py-6 text-center text-sm">
              No results found.
            </CommandPrimitive.Empty>

            {!search && recentCommands.length > 0 && (
              <CommandPrimitive.Group heading="Recent">
                {recentCommands.map((command) => {
                  const stats = commandRegistry.getCommandStats(command.id);
                  return (
                    <CommandItem
                      key={command.id}
                      command={command}
                      stats={stats}
                      onSelect={() => handleCommand(command)}
                    />
                  );
                })}
              </CommandPrimitive.Group>
            )}

            {!search && (
              <>
                <CommandPrimitive.Group heading="Navigation">
                  {navigationCommands.map((command) => (
                    <CommandItem
                      key={command.id}
                      command={command}
                      onSelect={() => handleCommand(command)}
                    />
                  ))}
                </CommandPrimitive.Group>

                <CommandPrimitive.Group heading="Actions">
                  {actionCommands.map((command) => (
                    <CommandItem
                      key={command.id}
                      command={command}
                      onSelect={() => handleCommand(command)}
                    />
                  ))}
                </CommandPrimitive.Group>

                <CommandPrimitive.Group heading="Search">
                  {searchCommands.map((command) => (
                    <CommandItem
                      key={command.id}
                      command={command}
                      onSelect={() => handleCommand(command)}
                    />
                  ))}
                </CommandPrimitive.Group>
              </>
            )}

            {search && displayCommands.length > 0 && (
              <CommandPrimitive.Group heading="Search Results">
                {displayCommands.map((command) => (
                  <CommandItem
                    key={command.id}
                    command={command}
                    onSelect={() => handleCommand(command)}
                  />
                ))}
              </CommandPrimitive.Group>
            )}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  </CommandErrorBoundary>
  );
}

interface CommandItemProps {
  command: Command;
  stats?: { count: number; lastUsed: number; avgExecutionTime?: number } | null;
  onSelect: () => void;
}

function CommandItem({ command, stats, onSelect }: CommandItemProps) {
  const Icon = command.icon || ArrowRight;

  return (
    <CommandPrimitive.Item
      value={command.name}
      onSelect={onSelect}
      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
    >
      <Icon className="mr-2 h-4 w-4" />
      <div className="flex-1">
        <div className="font-medium">{command.name}</div>
        {command.description && (
          <div className="text-xs text-muted-foreground">{command.description}</div>
        )}
        {stats && stats.count > 1 && (
          <div className="text-xs text-muted-foreground opacity-75">
            Used {stats.count} times
          </div>
        )}
      </div>
      {command.shortcut && (
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          {command.shortcut}
        </kbd>
      )}
    </CommandPrimitive.Item>
  );
}
