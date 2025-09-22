"use client";

import React, { useEffect, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KeyboardShortcutButtonProps extends ButtonProps {
  shortcut?: string | string[];
  showShortcut?: boolean;
  onShortcut?: () => void;
}

/**
 * Button component with integrated keyboard shortcut display
 * Automatically detects OS and shows appropriate modifier keys
 */
export function KeyboardShortcutButton({
  shortcut,
  showShortcut = true,
  onShortcut,
  children,
  className,
  onClick,
  ...props
}: KeyboardShortcutButtonProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect OS on client side
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  useEffect(() => {
    if (!shortcut || !onShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];

      for (const key of shortcuts) {
        const parts = key.toLowerCase().split('+');
        const mainKey = parts[parts.length - 1];
        const hasCmd = parts.includes('cmd') || parts.includes('meta');
        const hasCtrl = parts.includes('ctrl');
        const hasShift = parts.includes('shift');
        const hasAlt = parts.includes('alt');

        // Check if the key combination matches
        const isMatch =
          e.key.toLowerCase() === mainKey &&
          e.metaKey === (hasCmd && isMac) &&
          e.ctrlKey === (hasCtrl || (hasCmd && !isMac)) &&
          e.shiftKey === hasShift &&
          e.altKey === hasAlt;

        if (isMatch) {
          e.preventDefault();
          onShortcut();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut, onShortcut, isMac]);

  const formatShortcut = (key: string): string => {
    const parts = key.split('+');
    return parts.map(part => {
      switch (part.toLowerCase()) {
        case 'cmd':
        case 'meta':
          return isMac ? '⌘' : 'Ctrl';
        case 'ctrl':
          return 'Ctrl';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        case 'shift':
          return isMac ? '⇧' : 'Shift';
        case 'enter':
          return '↵';
        case 'escape':
          return 'Esc';
        case 'backspace':
          return '⌫';
        case 'delete':
          return 'Del';
        case 'tab':
          return '⇥';
        case 'space':
          return 'Space';
        default:
          return part.toUpperCase();
      }
    }).join(' ');
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
    if (onShortcut) onShortcut();
  };

  return (
    <Button
      className={cn("group relative antialiased", className)}
      onClick={handleClick}
      {...props}
    >
      <span className="flex items-center gap-2">
        {children}
        {showShortcut && shortcut && (
          <kbd className="ml-2 inline-flex h-5 items-center rounded border border-gray-200 bg-gray-100 px-1.5 font-sans text-[11px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 antialiased">
            {Array.isArray(shortcut)
              ? formatShortcut(shortcut[0])
              : formatShortcut(shortcut)
            }
          </kbd>
        )}
      </span>
    </Button>
  );
}

/**
 * Hook to register global keyboard shortcuts
 */
export function useKeyboardShortcut(
  shortcut: string | string[],
  callback: () => void,
  enabled = true
) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut];

      for (const key of shortcuts) {
        const parts = key.toLowerCase().split('+');
        const mainKey = parts[parts.length - 1];
        const hasCmd = parts.includes('cmd') || parts.includes('meta');
        const hasCtrl = parts.includes('ctrl');
        const hasShift = parts.includes('shift');
        const hasAlt = parts.includes('alt');

        const isMatch =
          e.key.toLowerCase() === mainKey &&
          e.metaKey === (hasCmd && isMac) &&
          e.ctrlKey === (hasCtrl || (hasCmd && !isMac)) &&
          e.shiftKey === hasShift &&
          e.altKey === hasAlt;

        if (isMatch) {
          e.preventDefault();
          callback();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut, callback, enabled, isMac]);
}

// Export a preset for common button styles with shortcuts
export const ShortcutButtonPresets = {
  create: {
    className: "bg-black text-white hover:bg-gray-800",
    shortcut: "c",
  },
  save: {
    className: "bg-black text-white hover:bg-gray-800",
    shortcut: "cmd+s",
  },
  search: {
    className: "bg-white text-gray-600 hover:bg-gray-50",
    shortcut: "cmd+k",
  },
  delete: {
    className: "bg-red-600 text-white hover:bg-red-700",
    shortcut: "cmd+backspace",
  },
  escape: {
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    shortcut: "escape",
  },
} as const;