'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Users, Link, MousePointerClick } from 'lucide-react';

interface UsageMetersProps {
  metrics: {
    users: { current: number; limit: number | 'unlimited' };
    links: { current: number; limit: number | 'unlimited' };
    clicks: { current: number; limit: number | 'unlimited' };
  };
  isLoading?: boolean;
}

export default function UsageMeters({ metrics, isLoading }: UsageMetersProps) {
  const getPercentage = (current: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited' || limit === -1) return 0;
    return Math.min(100, Math.round((current / limit) * 100));
  };

  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'warning';
    return 'primary';
  };

  const meters = [
    {
      icon: Users,
      label: 'Team Members',
      current: metrics.users.current,
      limit: metrics.users.limit,
      color: 'blue',
    },
    {
      icon: Link,
      label: 'Links Created',
      current: metrics.links.current,
      limit: metrics.links.limit,
      color: 'green',
    },
    {
      icon: MousePointerClick,
      label: 'Clicks This Month',
      current: metrics.clicks.current,
      limit: metrics.clicks.limit,
      color: 'purple',
    },
  ];

  return (
    <div className="space-y-4">
      {meters.map((meter, index) => {
        const Icon = meter.icon;
        const percentage = getPercentage(meter.current, meter.limit);
        const color = getColor(percentage);

        return (
          <motion.div
            key={meter.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Icon className="w-4 h-4" />
                {meter.label}
              </span>
              <span className="text-muted-foreground">
                {meter.current.toLocaleString()} / {' '}
                {meter.limit === 'unlimited' ? '∞' : meter.limit.toLocaleString()}
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={0} 
                className="h-3 bg-muted"
              />
              <motion.div
                className={cn(
                  "absolute top-0 left-0 h-full rounded-full",
                  color === 'primary' && "bg-primary",
                  color === 'warning' && "bg-yellow-500",
                  color === 'destructive' && "bg-destructive"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ 
                  duration: 1, 
                  ease: "easeOut",
                  delay: 0.2 + index * 0.1
                }}
              />
            </div>
            {percentage >= 90 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-destructive"
              >
                {percentage >= 100 ? 'Limit reached' : `${100 - percentage}% remaining`}
              </motion.p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}