'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import UpgradeModal from './UpgradeModal';

interface TrialBannerProps {
  daysRemaining: number;
  workspaceId: string;
}

export default function TrialBanner({ daysRemaining, workspaceId }: TrialBannerProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const getUrgencyLevel = () => {
    if (daysRemaining <= 1) return 'critical';
    if (daysRemaining <= 3) return 'warning';
    if (daysRemaining <= 7) return 'notice';
    return 'info';
  };

  const urgencyLevel = getUrgencyLevel();

  const bannerConfig = {
    critical: {
      icon: AlertCircle,
      bgColor: 'bg-destructive/10 border-destructive/20',
      textColor: 'text-destructive',
      badgeVariant: 'destructive' as const,
      message: daysRemaining === 0 
        ? 'Your trial expires today!' 
        : `Only ${daysRemaining} day left in your trial!`,
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900',
      textColor: 'text-yellow-800 dark:text-yellow-400',
      badgeVariant: 'outline' as const,
      message: `${daysRemaining} days left in your trial`,
    },
    notice: {
      icon: Clock,
      bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900',
      textColor: 'text-blue-800 dark:text-blue-400',
      badgeVariant: 'secondary' as const,
      message: `${daysRemaining} days left in your trial`,
    },
    info: {
      icon: Sparkles,
      bgColor: 'bg-primary/5 border-primary/10',
      textColor: 'text-foreground',
      badgeVariant: 'secondary' as const,
      message: `${daysRemaining} days left in your 14-day trial`,
    },
  };

  const config = bannerConfig[urgencyLevel];
  const Icon = config.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert className={cn('relative overflow-hidden', config.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-full', 
                urgencyLevel === 'critical' ? 'bg-destructive/20' : 'bg-primary/10'
              )}>
                <Icon className={cn('w-5 h-5', config.textColor)} />
              </div>
              
              <div className="flex items-center gap-3">
                <AlertDescription className="text-base font-medium">
                  {config.message}
                </AlertDescription>
                
                <Badge variant={config.badgeVariant}>
                  Free Trial
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={urgencyLevel === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
                className={cn(
                  urgencyLevel === 'critical' && 'animate-pulse'
                )}
              >
                Upgrade now
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <motion.div
              className={cn(
                'h-full',
                urgencyLevel === 'critical' ? 'bg-destructive' :
                urgencyLevel === 'warning' ? 'bg-yellow-500' :
                'bg-primary'
              )}
              initial={{ width: '100%' }}
              animate={{ width: `${(daysRemaining / 14) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </Alert>
      </motion.div>

      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          workspaceId={workspaceId}
          targetPlan="starter"
          currentPlan="free"
        />
      )}
    </>
  );
}