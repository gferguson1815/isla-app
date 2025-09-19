'use client'

import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { type UsageMetrics, type UsageAlert } from '@/packages/api/src/services/usage-tracking'

interface UseUsageMetricsOptions {
  pollInterval?: number // in milliseconds
  enablePolling?: boolean
  showWarnings?: boolean
}

export function useUsageMetrics(options: UseUsageMetricsOptions = {}) {
  const {
    pollInterval = 30000, // 30 seconds default
    enablePolling = true,
    showWarnings = true,
  } = options
  
  const { workspace } = useWorkspace()
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Fetch usage metrics
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = trpc.usage.getMetrics.useQuery(
    { workspaceId: workspace?.id || '' },
    {
      enabled: !!workspace?.id,
      refetchInterval: enablePolling ? pollInterval : false,
      onSettled: () => setIsInitialLoad(false),
    }
  )
  
  // Fetch usage alerts
  const { data: alerts } = trpc.usage.getAlerts.useQuery(
    { workspaceId: workspace?.id || '' },
    {
      enabled: !!workspace?.id && showWarnings,
      refetchInterval: enablePolling ? pollInterval : false,
    }
  )
  
  // Check specific limit
  const checkLimit = trpc.usage.checkLimit.useMutation()
  
  // Helper functions
  const isNearLimit = (metric: 'links' | 'clicks' | 'users') => {
    if (!metrics) return false
    const percentage = metrics[`${metric}Percentage` as keyof UsageMetrics] as number
    return percentage >= 80
  }
  
  const isAtLimit = (metric: 'links' | 'clicks' | 'users') => {
    if (!metrics) return false
    const percentage = metrics[`${metric}Percentage` as keyof UsageMetrics] as number
    return percentage >= 100
  }
  
  const canPerformAction = async (
    metric: 'links' | 'clicks' | 'users',
    incrementAmount = 1
  ): Promise<boolean> => {
    if (!workspace?.id) return false
    
    try {
      const result = await checkLimit.mutateAsync({
        workspaceId: workspace.id,
        metric,
        incrementAmount,
      })
      return result.allowed
    } catch {
      return false
    }
  }
  
  const getUsagePercentage = (metric: 'links' | 'clicks' | 'users'): number => {
    if (!metrics) return 0
    return metrics[`${metric}Percentage` as keyof UsageMetrics] as number
  }
  
  const getRemainingCapacity = (metric: 'links' | 'clicks' | 'users'): number => {
    if (!metrics) return 0
    const current = metrics[metric]
    const limit = metrics[`${metric}Limit` as keyof UsageMetrics] as number
    if (limit === -1) return Infinity // Unlimited
    return Math.max(0, limit - current)
  }
  
  // Format usage display
  const formatUsage = (metric: 'links' | 'clicks' | 'users'): string => {
    if (!metrics) return '...'
    const current = metrics[metric]
    const limit = metrics[`${metric}Limit` as keyof UsageMetrics] as number
    
    if (limit === -1) {
      return `${current.toLocaleString()} (Unlimited)`
    }
    
    return `${current.toLocaleString()} / ${limit.toLocaleString()}`
  }
  
  // Auto-refresh on window focus
  useEffect(() => {
    if (!enablePolling) return
    
    const handleFocus = () => {
      refetch()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetch, enablePolling])
  
  return {
    metrics,
    alerts: alerts || [],
    isLoading: isInitialLoad && isLoading,
    error,
    refetch,
    
    // Helper functions
    isNearLimit,
    isAtLimit,
    canPerformAction,
    getUsagePercentage,
    getRemainingCapacity,
    formatUsage,
    
    // Quick access to specific metrics
    links: metrics?.links || 0,
    clicks: metrics?.clicks || 0,
    users: metrics?.users || 0,
    
    // Quick access to limits
    linkLimit: metrics?.linkLimit || 0,
    clickLimit: metrics?.clickLimit || 0,
    userLimit: metrics?.userLimit || 0,
    
    // Plan info
    plan: metrics?.plan || 'free',
  }
}

// Hook for usage warnings
export function useUsageWarnings() {
  const { workspace } = useWorkspace()
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set())
  
  const { data: alerts, isLoading } = trpc.usage.getAlerts.useQuery(
    { workspaceId: workspace?.id || '' },
    {
      enabled: !!workspace?.id,
      refetchInterval: 60000, // Check every minute
    }
  )
  
  const dismissWarning = (metric: string) => {
    setDismissedWarnings(prev => new Set(prev).add(metric))
    
    // Store in session storage
    const key = `dismissed-warning-${workspace?.id}-${metric}`
    sessionStorage.setItem(key, Date.now().toString())
  }
  
  // Filter out dismissed warnings
  const activeWarnings = alerts?.filter(
    alert => !dismissedWarnings.has(alert.metric)
  ) || []
  
  // Load dismissed warnings from session storage
  useEffect(() => {
    if (!workspace?.id) return
    
    const dismissed = new Set<string>()
    const metrics = ['links', 'clicks', 'users']
    
    metrics.forEach(metric => {
      const key = `dismissed-warning-${workspace.id}-${metric}`
      const timestamp = sessionStorage.getItem(key)
      
      if (timestamp) {
        const dismissedAt = parseInt(timestamp, 10)
        const hoursSinceDismissal = (Date.now() - dismissedAt) / (1000 * 60 * 60)
        
        // Re-show warning after 24 hours
        if (hoursSinceDismissal < 24) {
          dismissed.add(metric)
        } else {
          sessionStorage.removeItem(key)
        }
      }
    })
    
    setDismissedWarnings(dismissed)
  }, [workspace?.id])
  
  return {
    warnings: activeWarnings,
    isLoading,
    dismissWarning,
    hasWarnings: activeWarnings.length > 0,
    criticalWarning: activeWarnings.find(w => w.type === 'limit_reached'),
  }
}

// Hook for optimistic updates
export function useOptimisticUsage(metric: 'links' | 'clicks' | 'users') {
  const { metrics, refetch } = useUsageMetrics({ enablePolling: false })
  const [optimisticValue, setOptimisticValue] = useState<number | null>(null)
  
  const current = metrics?.[metric] || 0
  const limit = metrics?.[`${metric}Limit` as keyof UsageMetrics] as number || 0
  const displayValue = optimisticValue !== null ? optimisticValue : current
  
  const increment = (amount = 1) => {
    setOptimisticValue(displayValue + amount)
    
    // Reset after a delay and refetch
    setTimeout(() => {
      setOptimisticValue(null)
      refetch()
    }, 2000)
  }
  
  const decrement = (amount = 1) => {
    if (metric === 'clicks') return // Clicks can't be decremented
    
    setOptimisticValue(Math.max(0, displayValue - amount))
    
    // Reset after a delay and refetch
    setTimeout(() => {
      setOptimisticValue(null)
      refetch()
    }, 2000)
  }
  
  return {
    value: displayValue,
    limit,
    percentage: limit === -1 ? 0 : (displayValue / limit) * 100,
    isOptimistic: optimisticValue !== null,
    increment,
    decrement,
    refetch,
  }
}