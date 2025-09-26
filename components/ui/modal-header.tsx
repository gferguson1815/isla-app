"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalHeaderProps {
  onClose?: () => void;
  showLogo?: boolean;
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Consistent modal header with Isla logo
 * Used across all modals for brand consistency
 */
export function ModalHeader({
  onClose,
  showLogo = true,
  showCloseButton = true,
  className,
  children,
}: ModalHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between p-6 pb-2", className)}>
      {showLogo && (
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center justify-center w-16 h-16">
            <Image
              src="/images/logos/isla-icon-black.svg"
              alt="Isla"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </div>
        </div>
      )}

      {children}

      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

interface ModalContentProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Consistent modal content wrapper with proper padding
 */
export function ModalContent({ className, children }: ModalContentProps) {
  return (
    <div className={cn("px-6 pb-6 pt-2", className)}>
      {children}
    </div>
  );
}

interface ModalContainerProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Consistent modal container with shadow and rounded corners
 */
export function ModalContainer({ className, children }: ModalContainerProps) {
  return (
    <div className={cn(
      "relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50",
      className
    )}>
      {children}
    </div>
  );
}