'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { Button } from './button';
import { X } from 'lucide-react';

interface FeatureGateProps {
  featureKey: string;
  workspaceId: string;
  children: React.ReactNode;
  fallback?: 'hide' | 'disable' | 'tooltip' | 'modal' | 'custom';
  customFallback?: React.ReactNode;
  onUpgradeClick?: () => void;
  className?: string;
}

export function FeatureGate({
  featureKey,
  workspaceId,
  children,
  fallback = 'tooltip',
  customFallback,
  onUpgradeClick,
  className
}: FeatureGateProps) {
  const { checkFeature } = useFeatureGate(workspaceId);
  const feature = checkFeature(featureKey);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!showTooltip) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  // If feature is loading, show children with loading state
  if (feature.loading) {
    return (
      <div className={className}>
        <div className="animate-pulse">{children}</div>
      </div>
    );
  }

  // If feature is enabled, render children normally
  if (feature.enabled) {
    return <div className={className}>{children}</div>;
  }

  // Handle different fallback strategies
  switch (fallback) {
    case 'hide':
      return null;

    case 'disable':
      return (
        <div className={className}>
          <div className="opacity-50 pointer-events-none cursor-not-allowed">
            {children}
          </div>
        </div>
      );

    case 'tooltip':
      return (
        <div className={`relative ${className}`} ref={containerRef}>
          <div
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTooltip(true);
            }}
          >
            {children}
          </div>

          {showTooltip && (
            <div className="absolute bottom-full left-0 mb-2 z-50 w-72 animate-in fade-in-0 zoom-in-95">
              <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  {feature.message || 'This feature requires a higher plan'}
                </p>
                <Button
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={() => {
                    if (onUpgradeClick) {
                      onUpgradeClick();
                    } else {
                      // Default upgrade behavior - could navigate to billing page
                      window.location.href = '/billing/upgrade';
                    }
                  }}
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          )}
        </div>
      );

    case 'modal':
      return (
        <>
          <div
            className={`cursor-pointer ${className}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowModal(true);
            }}
          >
            {children}
          </div>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowModal(false)}
              />

              {/* Modal */}
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95">
                {/* Close button */}
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowModal(false)}
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.name || 'Premium Feature'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {feature.message || 'This feature requires a Pro plan or above. Upgrade to continue.'}
                  </p>

                  {feature.description && (
                    <p className="text-sm text-gray-500 mb-6">
                      {feature.description}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-black text-white hover:bg-gray-800"
                      onClick={() => {
                        if (onUpgradeClick) {
                          onUpgradeClick();
                        } else {
                          window.location.href = '/billing/upgrade';
                        }
                      }}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      );

    case 'custom':
      return (
        <div className={className}>
          {customFallback || children}
        </div>
      );

    default:
      return <div className={className}>{children}</div>;
  }
}