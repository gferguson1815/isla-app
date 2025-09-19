'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface WarningBannerProps {
  metric: 'links' | 'clicks' | 'users'
  percentage: number
  currentUsage: number
  limit: number
  workspaceSlug: string
  onDismiss?: () => void
  className?: string
}

export function WarningBanner({
  metric,
  percentage,
  currentUsage,
  limit,
  workspaceSlug,
  onDismiss,
  className
}: WarningBannerProps) {
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(false)
  
  // Only show if over 80%
  if (percentage < 80 || isDismissed) {
    return null
  }
  
  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
    
    // Store dismissal in session storage with expiry
    const dismissKey = `usage-warning-${workspaceSlug}-${metric}`
    const dismissData = {
      dismissed: true,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    sessionStorage.setItem(dismissKey, JSON.stringify(dismissData))
  }
  
  const handleUpgrade = () => {
    router.push(`/${workspaceSlug}/settings/billing?upgrade=true&reason=${metric}_limit`)
  }
  
  // Check if previously dismissed
  useEffect(() => {
    const dismissKey = `usage-warning-${workspaceSlug}-${metric}`
    const stored = sessionStorage.getItem(dismissKey)
    
    if (stored) {
      try {
        const dismissData = JSON.parse(stored)
        if (dismissData.expires > Date.now()) {
          setIsDismissed(true)
        } else {
          sessionStorage.removeItem(dismissKey)
        }
      } catch {
        sessionStorage.removeItem(dismissKey)
      }
    }
  }, [workspaceSlug, metric])
  
  const getMetricLabel = () => {
    switch (metric) {
      case 'links':
        return 'link'
      case 'clicks':
        return 'click'
      case 'users':
        return 'team member'
    }
  }
  
  const getWarningLevel = () => {
    if (percentage >= 100) return 'error'
    if (percentage >= 90) return 'warning'
    return 'info'
  }
  
  const level = getWarningLevel()
  const metricLabel = getMetricLabel()
  
  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Alert
            className={cn(
              'relative mb-4',
              {
                'border-orange-500 bg-orange-50 dark:bg-orange-950/20': level === 'warning',
                'border-red-500 bg-red-50 dark:bg-red-950/20': level === 'error',
                'border-blue-500 bg-blue-50 dark:bg-blue-950/20': level === 'info'
              },
              className
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle 
                  className={cn(
                    'h-5 w-5 mt-0.5',
                    {
                      'text-orange-600': level === 'warning',
                      'text-red-600': level === 'error',
                      'text-blue-600': level === 'info'
                    }
                  )}
                />
                <div className="flex-1">
                  <AlertDescription className="text-sm font-medium">
                    {percentage >= 100 ? (
                      <>
                        You've reached your {metricLabel} limit ({currentUsage.toLocaleString()} of {limit.toLocaleString()}).
                        Upgrade now to continue adding {metric}.
                      </>
                    ) : (
                      <>
                        You're at {Math.round(percentage)}% of your {metricLabel} limit 
                        ({currentUsage.toLocaleString()} of {limit.toLocaleString()}).
                        {percentage >= 90 && ' Consider upgrading soon to avoid interruptions.'}
                      </>
                    )}
                  </AlertDescription>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={percentage >= 100 ? 'default' : 'outline'}
                      onClick={handleUpgrade}
                      className="h-7"
                    >
                      Upgrade Plan
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                    
                    {percentage < 100 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                        className="h-7 text-muted-foreground"
                      >
                        Remind me later
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {percentage < 100 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Dismiss</span>
                </Button>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  {
                    'bg-orange-500': level === 'warning',
                    'bg-red-500': level === 'error',
                    'bg-blue-500': level === 'info'
                  }
                )}
              />
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Compound component for multiple warnings
interface UsageWarningsProps {
  warnings: Array<{
    metric: 'links' | 'clicks' | 'users'
    percentage: number
    currentUsage: number
    limit: number
  }>
  workspaceSlug: string
  className?: string
}

export function UsageWarnings({ warnings, workspaceSlug, className }: UsageWarningsProps) {
  // Only show the most critical warning
  const sortedWarnings = [...warnings].sort((a, b) => b.percentage - a.percentage)
  const mostCritical = sortedWarnings[0]
  
  if (!mostCritical || mostCritical.percentage < 80) {
    return null
  }
  
  return (
    <WarningBanner
      metric={mostCritical.metric}
      percentage={mostCritical.percentage}
      currentUsage={mostCritical.currentUsage}
      limit={mostCritical.limit}
      workspaceSlug={workspaceSlug}
      className={className}
    />
  )
}