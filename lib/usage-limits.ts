// Client-side usage limit utilities

export const PLAN_FEATURES = {
  free: {
    name: 'Free',
    maxLinks: 50,
    maxClicks: 5000,
    maxUsers: 1,
    customDomains: false,
    analytics: 'Basic',
    support: 'Community',
    apiAccess: false,
  },
  starter: {
    name: 'Starter',
    maxLinks: 500,
    maxClicks: 50000,
    maxUsers: 3,
    customDomains: false,
    analytics: 'Advanced',
    support: 'Email',
    apiAccess: true,
  },
  pro: {
    name: 'Pro',
    maxLinks: 5000,
    maxClicks: 500000,
    maxUsers: 10,
    customDomains: true,
    analytics: 'Advanced',
    support: 'Priority',
    apiAccess: true,
  },
  advanced: {
    name: 'Advanced',
    maxLinks: 50000,
    maxClicks: 1000000,
    maxUsers: 20,
    customDomains: true,
    analytics: 'Enterprise',
    support: 'Priority',
    apiAccess: true,
  },
  business: {
    name: 'Business',
    maxLinks: -1, // unlimited
    maxClicks: -1, // unlimited
    maxUsers: -1, // unlimited
    customDomains: true,
    analytics: 'Enterprise',
    support: 'Dedicated',
    apiAccess: true,
  },
} as const

export type PlanType = keyof typeof PLAN_FEATURES

/**
 * Format a usage value for display
 */
export function formatUsageValue(value: number, limit: number): string {
  if (limit === -1) {
    return value.toLocaleString()
  }
  return `${value.toLocaleString()} / ${limit.toLocaleString()}`
}

/**
 * Format a large number with abbreviation
 */
export function formatLargeNumber(value: number | string): string {
  if (typeof value === 'string') return value
  if (value === -1) return 'Unlimited'
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercentage(current: number, limit: number): number {
  if (limit === -1 || limit === 0) return 0
  return Math.min(100, (current / limit) * 100)
}

/**
 * Get usage status color
 */
export function getUsageStatusColor(percentage: number): string {
  if (percentage >= 100) return 'text-red-600 dark:text-red-400'
  if (percentage >= 90) return 'text-orange-600 dark:text-orange-400'
  if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

/**
 * Get usage progress bar color
 */
export function getUsageProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-red-500'
  if (percentage >= 90) return 'bg-orange-500'
  if (percentage >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

/**
 * Get usage status message
 */
export function getUsageStatusMessage(
  metric: 'links' | 'clicks' | 'users',
  percentage: number
): string {
  const metricLabel = {
    links: 'link',
    clicks: 'click',
    users: 'team member'
  }[metric]
  
  if (percentage >= 100) {
    return `You've reached your ${metricLabel} limit. Upgrade to continue.`
  }
  if (percentage >= 90) {
    return `Critical: ${Math.round(percentage)}% of ${metricLabel} limit used.`
  }
  if (percentage >= 80) {
    return `Warning: ${Math.round(percentage)}% of ${metricLabel} limit used.`
  }
  return `${Math.round(percentage)}% of ${metricLabel} limit used.`
}

/**
 * Check if action would exceed limit
 */
export function wouldExceedLimit(
  current: number,
  limit: number,
  increment = 1
): boolean {
  if (limit === -1) return false // Unlimited
  return current + increment > limit
}

/**
 * Get suggested plan based on usage
 */
export function getSuggestedPlan(
  currentPlan: PlanType,
  metric: 'links' | 'clicks' | 'users',
  requiredAmount: number
): PlanType | null {
  const plans: PlanType[] = ['free', 'starter', 'pro', 'advanced', 'business']
  const currentIndex = plans.indexOf(currentPlan)
  
  for (let i = currentIndex + 1; i < plans.length; i++) {
    const plan = plans[i]
    const limit = PLAN_FEATURES[plan][`max${metric.charAt(0).toUpperCase()}${metric.slice(1)}` as keyof typeof PLAN_FEATURES.free]
    
    if (typeof limit === 'number' && (limit === -1 || limit >= requiredAmount)) {
      return plan
    }
  }
  
  return null
}

/**
 * Format time until limit reset (for monthly limits)
 */
export function getTimeUntilReset(): string {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysRemaining === 1) return '1 day'
  return `${daysRemaining} days`
}

/**
 * Check if workspace has custom overrides
 */
export function hasCustomOverrides(customLimits: any): boolean {
  if (!customLimits) return false
  return customLimits.beta_user === true || 
         customLimits.vip_customer === true ||
         (customLimits.temp_increases && Object.keys(customLimits.temp_increases).length > 0)
}

/**
 * Parse custom limits
 */
export function parseCustomLimits(customLimits: any): {
  isBetaUser: boolean
  isVIPCustomer: boolean
  hasTemporaryIncrease: boolean
  temporaryIncreaseExpiry?: Date
} {
  if (!customLimits) {
    return {
      isBetaUser: false,
      isVIPCustomer: false,
      hasTemporaryIncrease: false,
    }
  }
  
  const hasTemp = customLimits.temp_increases && 
                  customLimits.temp_increases.expires &&
                  new Date(customLimits.temp_increases.expires) > new Date()
  
  return {
    isBetaUser: customLimits.beta_user === true,
    isVIPCustomer: customLimits.vip_customer === true,
    hasTemporaryIncrease: hasTemp,
    temporaryIncreaseExpiry: hasTemp ? new Date(customLimits.temp_increases.expires) : undefined,
  }
}

/**
 * Format upgrade reason for analytics
 */
export function formatUpgradeReason(
  metric: 'links' | 'clicks' | 'users',
  percentage: number
): string {
  if (percentage >= 100) {
    return `${metric}_limit_reached`
  }
  if (percentage >= 80) {
    return `${metric}_limit_warning`
  }
  return `${metric}_upgrade_prompt`
}