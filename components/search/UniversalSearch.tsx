"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Link2, BarChart3, Settings, Tag, Folder, Users, Clock, X } from "lucide-react";
import Fuse from "fuse.js";
import { trpc } from "@/lib/trpc/client";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "use-debounce";

interface SearchResult {
  id: string;
  type: "link" | "analytics" | "settings" | "member" | "tag" | "folder";
  title: string;
  description?: string;
  url?: string;
  icon: React.ReactNode;
  action: () => void;
}

const SEARCH_HISTORY_KEY = "universalSearchHistory";
const MAX_SEARCH_HISTORY = 10;

export function UniversalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: links } = trpc.link.list.useQuery(
    {
      workspaceId: currentWorkspace?.id || "",
      limit: 100,
    },
    {
      enabled: !!currentWorkspace && open,
    }
  );

  const { data: tags } = trpc.tag.list.useQuery(
    {
      workspaceId: currentWorkspace?.id || "",
    },
    {
      enabled: !!currentWorkspace && open,
    }
  );

  const { data: folders } = trpc.folder.list.useQuery(
    {
      workspaceId: currentWorkspace?.id || "",
    },
    {
      enabled: !!currentWorkspace && open,
    }
  );

  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load search history:", error);
      }
    }
  }, []);

  const saveToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setSearchHistory((prev) => {
      const updated = [searchQuery, ...prev.filter((item) => item !== searchQuery)].slice(
        0,
        MAX_SEARCH_HISTORY
      );

      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  const searchableItems = useMemo(() => {
    const items: SearchResult[] = [];

    if (links?.links) {
      links.links.forEach((link) => {
        items.push({
          id: link.id,
          type: "link",
          title: link.title || link.slug,
          description: link.url,
          url: link.url,
          icon: <Link2 className="h-4 w-4" />,
          action: () => {
            router.push(`/links/${link.id}`);
            setOpen(false);
            saveToHistory(query);
          },
        });
      });
    }

    if (tags) {
      tags.forEach((tag) => {
        items.push({
          id: tag.id,
          type: "tag",
          title: tag.name,
          description: `${tag._count?.links || 0} links`,
          icon: <Tag className="h-4 w-4" />,
          action: () => {
            router.push(`/links?tag=${tag.name}`);
            setOpen(false);
            saveToHistory(query);
          },
        });
      });
    }

    if (folders) {
      folders.forEach((folder) => {
        items.push({
          id: folder.id,
          type: "folder",
          title: folder.name,
          description: folder.description || `${folder._count?.links || 0} links`,
          icon: <Folder className="h-4 w-4" />,
          action: () => {
            router.push(`/links?folder=${folder.id}`);
            setOpen(false);
            saveToHistory(query);
          },
        });
      });
    }

    items.push(
      {
        id: "analytics-overview",
        type: "analytics",
        title: "Analytics Overview",
        description: "View overall performance metrics",
        icon: <BarChart3 className="h-4 w-4" />,
        action: () => {
          router.push("/analytics");
          setOpen(false);
          saveToHistory(query);
        },
      },
      {
        id: "workspace-settings",
        type: "settings",
        title: "Workspace Settings",
        description: "Manage workspace configuration",
        icon: <Settings className="h-4 w-4" />,
        action: () => {
          router.push("/settings/workspace");
          setOpen(false);
          saveToHistory(query);
        },
      },
      {
        id: "team-members",
        type: "settings",
        title: "Team Members",
        description: "Manage team and permissions",
        icon: <Users className="h-4 w-4" />,
        action: () => {
          router.push("/settings/team");
          setOpen(false);
          saveToHistory(query);
        },
      }
    );

    return items;
  }, [links, tags, folders, router, query, saveToHistory]);

  const fuse = useMemo(
    () =>
      new Fuse(searchableItems, {
        keys: ["title", "description", "url"],
        threshold: 0.3,
      }),
    [searchableItems]
  );

  const performSearch = useDebouncedCallback((searchQuery: string) => {
    setIsSearching(true);

    if (!searchQuery.trim()) {
      setResults([]);
    } else {
      const searchResults = fuse.search(searchQuery);
      setResults(searchResults.slice(0, 10).map((result) => result.item));
    }

    setIsSearching(false);
  }, 300);

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  useEffect(() => {
    const handleFocusSearch = () => {
      setOpen(true);
    };
    window.addEventListener("focusSearch", handleFocusSearch);
    return () => window.removeEventListener("focusSearch", handleFocusSearch);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (!isTyping && e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((result) => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [results]);

  const typeLabels: Record<string, string> = {
    link: "Links",
    analytics: "Analytics",
    settings: "Settings",
    member: "Team Members",
    tag: "Tags",
    folder: "Folders",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search everything... (Press /)"
            className="pl-9 pr-4"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search links, analytics, settings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 shadow-none focus-visible:ring-0"
          />
          {query && (
            <Button variant="ghost" size="sm" onClick={() => setQuery("")} className="h-8 px-2">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {!query && searchHistory.length > 0 && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1">
                {searchHistory.map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2"
                    onClick={() => setQuery(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {query && results.length === 0 && !isSearching && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {query && results.length > 0 && (
            <div className="p-2">
              {Object.entries(groupedResults).map(([type, items], groupIndex) => (
                <div key={type}>
                  {groupIndex > 0 && <Separator className="my-2" />}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{typeLabels[type]}</p>
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-2"
                        onClick={item.action}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="mt-0.5">{item.icon}</div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">{item.title}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className="ml-auto">
                            {type}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 text-xs font-semibold bg-muted rounded">↵</kbd> to
              select
            </p>
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1 py-0.5 text-xs font-semibold bg-muted rounded">ESC</kbd> to close
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
