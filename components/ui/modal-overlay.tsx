"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ModalOverlayProps {
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function ModalOverlay({ onClick, className, children }: ModalOverlayProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm z-50",
          className
        )}
        onClick={onClick}
      />
      {children}
    </>
  );
}

// Export just the backdrop for cases where you don't need the wrapper
export function Backdrop({ onClick, className }: Omit<ModalOverlayProps, 'children'>) {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/20 backdrop-blur-sm z-50",
        className
      )}
      onClick={onClick}
    />
  );
}