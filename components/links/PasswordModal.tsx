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
import { Crown, Eye, EyeOff, Shuffle } from 'lucide-react';
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

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: string) => void;
  initialPassword?: string;
  workspaceId: string;
}

export function PasswordModal({
  isOpen,
  onClose,
  onSave,
  initialPassword = '',
  workspaceId,
}: PasswordModalProps) {
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const upgradeRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspace as string;

  // Check if password protection is enabled
  const { checkFeature } = useFeatureGate(workspaceId);
  const passwordFeature = checkFeature('password_protection');

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

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
  };

  const handleSave = () => {
    if (!passwordFeature.enabled) {
      setShowUpgrade(true);
      return;
    }
    onSave(password);
    onClose();
  };

  const handleCancel = () => {
    setPassword(initialPassword);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            Link Password
            <ProTooltip
              content={{
                text: 'Password protect your links.',
                link: 'https://isla.so/help/article/password-protection',
                linkText: 'Learn more about password protection.'
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

        <div className="px-6 pb-6">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-900">
              Password
            </Label>
            <div className="relative" ref={upgradeRef}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                onFocus={() => {
                  if (!passwordFeature.enabled) {
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
                className="w-full px-3 py-2 pr-20 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    aria-label={showPassword ? "Hide password" : "Reveal password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {showPassword ? "Hide password" : "Reveal password"}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] border-4 border-transparent border-t-white"></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[6px] border-4 border-transparent border-t-gray-200"></div>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (!passwordFeature.enabled) {
                        setShowUpgrade(true);
                        return;
                      }
                      generatePassword();
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Generate password"
                  >
                    <Shuffle className="h-4 w-4 text-gray-500" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Generate password
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] border-4 border-transparent border-t-white"></div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[6px] border-4 border-transparent border-t-gray-200"></div>
                  </div>
                </div>
              </div>

              {/* Password Protection Upgrade Dropdown */}
              {showUpgrade && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-sm text-gray-600 text-center mb-4">
                    You can only use Password Protection on a Pro plan and above. Upgrade to Pro to continue.
                  </p>
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={() => router.push(`/${workspaceSlug}/settings/billing?upgrade=true&reason=password_protection`)}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
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
              disabled={!password}
              className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 text-white"
            >
              Add password
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}