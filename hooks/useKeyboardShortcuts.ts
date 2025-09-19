import { useEffect, useCallback, useRef } from "react";

type ShortcutHandler = (event: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: ShortcutHandler;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      shortcutsRef.current.forEach((shortcut) => {
        const isExactMatch =
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.metaKey === !!shortcut.metaKey &&
          !!event.shiftKey === !!shortcut.shiftKey &&
          !!event.altKey === !!shortcut.altKey;

        if (isExactMatch && (!isTyping || shortcut.ctrlKey || shortcut.metaKey)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
        }
      });
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}

export function useGlobalKeyboardShortcuts() {
  const handleCommandPalette = useCallback(() => {
    const event = new CustomEvent("openCommandPalette");
    window.dispatchEvent(event);
  }, []);

  const handleQuickCreate = useCallback(() => {
    const event = new CustomEvent("openQuickCreate");
    window.dispatchEvent(event);
  }, []);

  const handleSearch = useCallback(() => {
    const event = new CustomEvent("focusSearch");
    window.dispatchEvent(event);
  }, []);

  const handleHelp = useCallback(() => {
    const event = new CustomEvent("openShortcutsHelp");
    window.dispatchEvent(event);
  }, []);

  const shortcuts: Shortcut[] = [
    {
      key: "k",
      metaKey: true,
      handler: handleCommandPalette,
    },
    {
      key: "k",
      ctrlKey: true,
      handler: handleCommandPalette,
    },
    {
      key: "/",
      metaKey: true,
      handler: handleCommandPalette,
    },
    {
      key: "/",
      ctrlKey: true,
      handler: handleCommandPalette,
    },
    {
      key: "c",
      handler: handleQuickCreate,
    },
    {
      key: "/",
      handler: handleSearch,
    },
    {
      key: "?",
      shiftKey: true,
      handler: handleHelp,
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
