'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Crown, Calendar, HelpCircle } from 'lucide-react';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

// Simple tooltip component
function ProTooltip({
  children,
  content
}: {
  children: React.ReactNode;
  content: { text: string; link: string; linkText: string }
}) {
  return <>{children}</>;
}

interface LinkExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expirationDate: Date | null, expirationUrl: string) => void;
  initialDate?: Date | null;
  initialUrl?: string;
  workspaceId: string;
}

export function LinkExpirationModal({
  isOpen,
  onClose,
  onSave,
  initialDate = null,
  initialUrl = '',
  workspaceId,
}: LinkExpirationModalProps) {
  const [dateInput, setDateInput] = useState('');
  const [expirationUrl, setExpirationUrl] = useState(initialUrl);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const upgradeRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspace as string;

  // Check if link expiration is enabled
  const expirationFeature = useFeatureGate({
    workspaceId,
    feature: 'link_expiration'
  });

  // Handle click outside to close upgrade dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (upgradeRef.current && !upgradeRef.current.contains(event.target as Node)) {
        setShowUpgrade(false);
      }
    };

    if (showUpgrade) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUpgrade]);

  // Parse natural language date input
  const parseNaturalDate = (input: string): Date | null => {
    const now = new Date();
    const lowerInput = input.toLowerCase().trim();

    // Check for "tomorrow at Xpm"
    if (lowerInput.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const timeMatch = lowerInput.match(/(\d+)(:\d+)?\s*(am|pm)/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const isPM = timeMatch[3] === 'pm';
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        tomorrow.setHours(hours, 0, 0, 0);
      }
      return tomorrow;
    }

    // Check for "in X hours/days/weeks"
    const inMatch = lowerInput.match(/in\s+(\d+)\s+(hour|day|week|month)s?/);
    if (inMatch) {
      const amount = parseInt(inMatch[1]);
      const unit = inMatch[2];
      const future = new Date(now);

      switch (unit) {
        case 'hour':
          future.setHours(future.getHours() + amount);
          break;
        case 'day':
          future.setDate(future.getDate() + amount);
          break;
        case 'week':
          future.setDate(future.getDate() + (amount * 7));
          break;
        case 'month':
          future.setMonth(future.getMonth() + amount);
          break;
      }
      return future;
    }

    // Try to parse as a regular date
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const handleSave = () => {
    if (!expirationFeature.enabled) {
      setShowUpgrade(true);
      return;
    }

    const parsedDate = dateInput ? parseNaturalDate(dateInput) : null;
    onSave(parsedDate, expirationUrl);
    onClose();
  };

  const handleCancel = () => {
    setDateInput('');
    setExpirationUrl(initialUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            Link Expiration
            <ProTooltip
              content={{
                text: 'Set an expiration date for your link.',
                link: 'https://isla.so/help/article/link-expiration',
                linkText: 'Learn more about link expiration.'
              }}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded cursor-help focus:outline-none"
              >
                <Crown className="h-3 w-3" />
                PRO
              </button>
            </ProTooltip>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Date and Time Input */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">
              Date and Time
            </Label>
            <div className="relative" ref={upgradeRef}>
              <input
                type="text"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                placeholder='E.g. "tomorrow at 5pm" or "in 2 hours"'
                onFocus={() => {
                  if (!expirationFeature.enabled) {
                    setShowUpgrade(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!upgradeRef.current?.contains(document.activeElement)) {
                      setShowUpgrade(false);
                    }
                  }, 200);
                }}
                className="w-full px-3 py-2 pr-10 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

              {/* Link Expiration Upgrade Dropdown */}
              {showUpgrade && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-sm text-gray-600 text-center mb-4">
                    You can only use Link Expiration on a Pro plan and above. Upgrade to Pro to continue.
                  </p>
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={() => router.push(`/${workspaceSlug}/settings/billing?upgrade=true&reason=link_expiration`)}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Expiration URL */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium text-gray-900">
                Expiration URL
              </Label>
              <div className="relative group">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  URL to redirect to after expiration
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] border-4 border-transparent border-t-white"></div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[6px] border-4 border-transparent border-t-gray-200"></div>
                </div>
              </div>
            </div>
            <input
              type="url"
              value={expirationUrl}
              onChange={(e) => setExpirationUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            />
            <p className="text-xs text-gray-500 mt-2">
              Set a default expiration URL for your domain
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-4 py-2 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 text-white"
            >
              Add expiration
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}