'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  content: string | React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  iconClassName?: string;
  contentClassName?: string;
  href?: string; // Optional link to documentation
}

export function InfoTooltip({
  content,
  side = 'top',
  align = 'center',
  className,
  iconClassName,
  contentClassName,
  href
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (href) {
      e.preventDefault();
      e.stopPropagation();
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              "transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-1",
              href && "cursor-pointer hover:text-gray-700",
              !href && "cursor-help",
              className
            )}
            aria-label="More information"
          >
            <HelpCircle
              className={cn(
                "h-3.5 w-3.5 text-gray-400",
                href && "hover:text-gray-600",
                iconClassName
              )}
            />
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={5}
            className={cn(
              "z-50 max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg",
              "animate-in fade-in-0 zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2",
              "data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2",
              "data-[side=top]:slide-in-from-bottom-2",
              contentClassName
            )}
          >
            <div className="text-sm text-gray-700">
              {content}
            </div>
            <TooltipPrimitive.Arrow
              className="fill-white"
              width={11}
              height={5}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// Simple variant without Radix UI for inline help text
export function SimpleInfoTooltip({
  content,
  className,
  iconClassName
}: {
  content: string;
  className?: string;
  iconClassName?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div className={cn("relative inline-flex", className)} ref={containerRef}>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full focus:outline-none"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        aria-label="More information"
      >
        <HelpCircle className={cn("h-3.5 w-3.5 text-gray-400 hover:text-gray-600", iconClassName)} />
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-md py-1.5 px-2.5 whitespace-nowrap">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}