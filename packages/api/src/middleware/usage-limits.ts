import { TRPCError } from '@trpc/server'
import { type Context } from '../context'
import { UsageCounter, RedisKeys } from '@/lib/redis'
import { prisma } from '@/lib/prisma'

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    maxLinks: 50,
    maxClicks: 5000,
    maxUsers: 1,
    customDomains: false,
  },
  starter: {
    maxLinks: 500,
    maxClicks: 50000,
    maxUsers: 3,
    customDomains: false,
  },
  pro: {
    maxLinks: 5000,
    maxClicks: 500000,
    maxUsers: 10,
    customDomains: true,
  },
  business: {
    maxLinks: -1, // unlimited
    maxClicks: -1, // unlimited
    maxUsers: -1, // unlimited
    customDomains: true,
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS
export type LimitType = 'links' | 'clicks' | 'users'

interface UsageCheckResult {
  allowed: boolean
  current: number
  limit: number
  percentage: number
  shouldWarn: boolean
  upgradeRequired: boolean
  suggestedPlan?: PlanType
}

interface CustomLimits {
  beta_user?: boolean
  vip_customer?: boolean
  temp_increases?: {
    links?: number
    clicks?: number
    users?: number
    expires?: string
  }
}

/**
 * Get the next tier plan suggestion
 */
function getNextTier(currentPlan: PlanType): PlanType | null {
  const tiers: PlanType[] = ['free', 'starter', 'pro', 'business']
  const currentIndex = tiers.indexOf(currentPlan)
  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null
  }
  return tiers[currentIndex + 1]
}

/**
 * Get effective limits for a workspace considering overrides
 */
async function getEffectiveLimits(workspace: any): Promise<typeof PLAN_LIMITS.free> {
  const baseLimits = PLAN_LIMITS[workspace.plan as PlanType] || PLAN_LIMITS.free
  const customLimits = workspace.custom_limits as CustomLimits | null
  
  // Beta users and VIP customers get unlimited access
  if (customLimits?.beta_user || customLimits?.vip_customer) {
    return {
      maxLinks: -1,
      maxClicks: -1,
      maxUsers: -1,
      customDomains: true,
    }
  }
  
  // Apply temporary increases if not expired
  if (customLimits?.temp_increases) {
    const { temp_increases } = customLimits
    if (!temp_increases.expires || new Date(temp_increases.expires) > new Date()) {
      return {
        maxLinks: temp_increases.links ?? baseLimits.maxLinks,
        maxClicks: temp_increases.clicks ?? baseLimits.maxClicks,
        maxUsers: temp_increases.users ?? baseLimits.maxUsers,
        customDomains: baseLimits.customDomains,
      }
    }
  }
  
  // Use workspace-level overrides or base plan limits
  return {
    maxLinks: workspace.max_links ?? baseLimits.maxLinks,
    maxClicks: workspace.max_clicks ?? baseLimits.maxClicks,
    maxUsers: workspace.max_users ?? baseLimits.maxUsers,
    customDomains: baseLimits.customDomains,
  }
}

/**
 * Get current usage for a metric
 */
async function getCurrentUsage(
  workspaceId: string, 
  metric: LimitType
): Promise<number> {
  // Try Redis first
  let redisKey: string
  switch (metric) {
    case 'links':
      redisKey = RedisKeys.workspaceLinks(workspaceId)
      break
    case 'clicks':
      redisKey = RedisKeys.workspaceClicks(workspaceId)
      break
    case 'users':
      redisKey = RedisKeys.workspaceMembers(workspaceId)
      break
  }
  
  const redisValue = await UsageCounter.get(redisKey)
  if (redisValue !== null) {
    return redisValue
  }
  
  // Fallback to database
  switch (metric) {
    case 'links':
      const linkCount = await prisma.links.count({
        where: { workspace_id: workspaceId }
      })
      // Update Redis cache
      await UsageCounter.set(redisKey, linkCount)
      return linkCount
      
    case 'clicks':
      // Get current month clicks
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const clickCount = await prisma.click_events.count({
        where: {
          links: { workspace_id: workspaceId },
          timestamp: { gte: startOfMonth }
        }
      })
      // Update Redis cache with monthly expiry
      await UsageCounter.set(redisKey, clickCount)
      await UsageCounter.setMonthlyExpiry(redisKey)
      return clickCount
      
    case 'users':
      const userCount = await prisma.workspace_memberships.count({
        where: { workspace_id: workspaceId }
      })
      // Update Redis cache
      await UsageCounter.set(redisKey, userCount)
      return userCount
  }
}

/**
 * Check usage limits for a specific metric
 */
export async function checkUsageLimits(
  workspaceId: string,
  metric: LimitType,
  incrementAmount = 0
): Promise<UsageCheckResult> {
  // Get workspace with custom limits
  const workspace = await prisma.workspaces.findUnique({
    where: { id: workspaceId }
  })
  
  if (!workspace) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Workspace not found',
    })
  }
  
  const limits = await getEffectiveLimits(workspace)
  const limitKey = `max${metric.charAt(0).toUpperCase()}${metric.slice(1)}` as keyof typeof limits
  const limit = limits[limitKey] as number
  
  // Unlimited (-1) always allows
  if (limit === -1) {
    return {
      allowed: true,
      current: 0,
      limit: -1,
      percentage: 0,
      shouldWarn: false,
      upgradeRequired: false,
    }
  }
  
  const current = await getCurrentUsage(workspaceId, metric)
  const projected = current + incrementAmount
  const percentage = (projected / limit) * 100
  
  return {
    allowed: projected <= limit,
    current,
    limit,
    percentage,
    shouldWarn: percentage >= 80 && percentage < 100,
    upgradeRequired: projected > limit,
    suggestedPlan: projected > limit ? getNextTier(workspace.plan as PlanType) ?? undefined : undefined,
  }
}

/**
 * Middleware to check usage limits before actions
 */
export async function checkUsageLimitsMiddleware(opts: {
  ctx: Context
  metric: LimitType
  incrementAmount?: number
  gracefulDegradation?: boolean
}) {
  const { ctx, metric, incrementAmount = 1, gracefulDegradation = false } = opts
  
  if (!ctx.session?.user || !ctx.workspaceId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  }
  
  const usageCheck = await checkUsageLimits(ctx.workspaceId, metric, incrementAmount)
  
  // Allow read operations when over limit (graceful degradation)
  if (gracefulDegradation && !usageCheck.allowed) {
    return {
      ...usageCheck,
      readOnly: true,
    }
  }
  
  // Block write operations when over limit
  if (!usageCheck.allowed) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `${metric.charAt(0).toUpperCase()}${metric.slice(1)} limit reached`,
      cause: {
        error: 'LIMIT_EXCEEDED',
        metric,
        current: usageCheck.current,
        limit: usageCheck.limit,
        action: 'upgrade',
        suggestedPlan: usageCheck.suggestedPlan,
      },
    })
  }
  
  return usageCheck
}

/**
 * Increment usage counter after successful action
 */
export async function incrementUsage(
  workspaceId: string,
  metric: LimitType,
  amount = 1
): Promise<void> {
  let redisKey: string
  switch (metric) {
    case 'links':
      redisKey = RedisKeys.workspaceLinks(workspaceId)
      break
    case 'clicks':
      redisKey = RedisKeys.workspaceClicks(workspaceId)
      break
    case 'users':
      redisKey = RedisKeys.workspaceMembers(workspaceId)
      break
  }
  
  // Update Redis
  const newValue = await UsageCounter.increment(redisKey, amount)
  
  // If Redis update failed, update database directly
  if (newValue === null) {
    const now = new Date()
    const period = metric === 'clicks' ? 'monthly' : 'lifetime'
    const periodStart = metric === 'clicks' 
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(0)
    const periodEnd = metric === 'clicks'
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
      : new Date('2099-12-31')
    
    await prisma.usage_metrics.upsert({
      where: {
        unique_workspace_metric_period: {
          workspace_id: workspaceId,
          metric_type: metric,
          period,
          period_start: periodStart,
        },
      },
      update: {
        value: { increment: amount },
        updated_at: now,
      },
      create: {
        workspace_id: workspaceId,
        metric_type: metric,
        value: amount,
        period,
        period_start: periodStart,
        period_end: periodEnd,
      },
    })
  }
  
  // Set monthly expiry for click counters
  if (metric === 'clicks') {
    await UsageCounter.setMonthlyExpiry(redisKey)
  }
}

/**
 * Decrement usage counter after deletion
 */
export async function decrementUsage(
  workspaceId: string,
  metric: LimitType,
  amount = 1
): Promise<void> {
  // Only decrement for non-time-based metrics
  if (metric === 'clicks') {
    return // Clicks are never decremented
  }
  
  let redisKey: string
  switch (metric) {
    case 'links':
      redisKey = RedisKeys.workspaceLinks(workspaceId)
      break
    case 'users':
      redisKey = RedisKeys.workspaceMembers(workspaceId)
      break
    default:
      return
  }
  
  // Update Redis
  const newValue = await UsageCounter.decrement(redisKey, amount)
  
  // If Redis update failed, update database directly
  if (newValue === null) {
    await prisma.usage_metrics.updateMany({
      where: {
        workspace_id: workspaceId,
        metric_type: metric,
        period: 'lifetime',
      },
      data: {
        value: { decrement: amount },
        updated_at: new Date(),
      },
    })
  }
}