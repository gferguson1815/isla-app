"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["Ctrl", "K"], description: "Open command palette (Windows/Linux)" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["/"], description: "Focus search" },
      { keys: ["C"], description: "Create new link" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["G", "H"], description: "Go to dashboard" },
      { keys: ["G", "L"], description: "Go to links" },
      { keys: ["G", "A"], description: "Go to analytics" },
      { keys: ["G", "S"], description: "Go to settings" },
    ],
  },
  {
    title: "Links",
    shortcuts: [
      { keys: ["N"], description: "Create new link" },
      { keys: ["E"], description: "Edit selected link" },
      { keys: ["D"], description: "Delete selected link" },
      { keys: ["↑", "↓"], description: "Navigate link list" },
      { keys: ["Enter"], description: "Open selected link details" },
    ],
  },
  {
    title: "Command Palette",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navigate commands" },
      { keys: ["Enter"], description: "Execute selected command" },
      { keys: ["Esc"], description: "Close command palette" },
      { keys: ["Type"], description: "Search commands" },
    ],
  },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("openShortcutsHelp", handleOpen);
    return () => window.removeEventListener("openShortcutsHelp", handleOpen);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick keyboard shortcuts to navigate and perform actions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {shortcutGroups.map((group, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, shortcutIndex) => (
                  <div key={shortcutIndex} className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          {keyIndex > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {shortcut.keys.length === 2 &&
                              !["↑", "↓", "G", "N", "E", "D"].includes(shortcut.keys[0])
                                ? "+"
                                : "then"}
                            </span>
                          )}
                          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-mono">
                            {key}
                          </Badge>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {index < shortcutGroups.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
