"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Consistent external link component with default styling
 * Opens in new tab with security attributes by default
 */
export function ExternalLink({
  children,
  className,
  target = "_blank",
  rel = "noopener noreferrer",
  ...props
}: ExternalLinkProps) {
  return (
    <a
      target={target}
      rel={rel}
      className={cn(
        "underline font-medium text-gray-900 hover:text-gray-700 transition-colors",
        className
      )}
      onClick={(e) => {
        // Stop propagation to prevent closing modals/tooltips
        e.stopPropagation();
        props.onClick?.(e);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Internal link component (for Next.js Link wrapper if needed)
 * Can be extended to use Next.js Link component
 */
export function InternalLink({
  children,
  className,
  ...props
}: ExternalLinkProps) {
  return (
    <a
      className={cn(
        "underline font-medium text-gray-900 hover:text-gray-700 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}