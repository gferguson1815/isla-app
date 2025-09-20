import { prisma } from '@/lib/prisma'
import { redis, RedisKeys, UsageCounter } from '@/lib/redis'
import { type PlanType, PLAN_LIMITS } from '../middleware/usage-limits'
import cron from 'node-cron'

export interface UsageMetrics {
  links: number
  clicks: number
  users: number
  linkLimit: number
  clickLimit: number
  userLimit: number
  linkPercentage: number
  clickPercentage: number
  userPercentage: number
  plan: PlanType
}

export interface UsageAlert {
  type: 'warning' | 'limit_reached'
  metric: 'links' | 'clicks' | 'users'
  percentage: number
  message: string
  action?: 'upgrade' | 'contact_support'
}

/**
 * Get complete usage metrics for a workspace
 */
export async function getWorkspaceUsage(workspaceId: string): Promise<UsageMetrics> {
  const workspace = await prisma.workspaces.findUnique({
    where: { id: workspaceId },
    select: {
      plan: true,
      max_links: true,
      max_clicks: true,
      max_users: true,
      custom_limits: true,
    }
  })
  
  if (!workspace) {
    throw new Error('Workspace not found')
  }
  
  // Get limits based on plan and overrides
  const planLimits = PLAN_LIMITS[workspace.plan as PlanType] || PLAN_LIMITS.free
  const customLimits = workspace.custom_limits as any
  
  // Check for beta/VIP unlimited access
  const isUnlimited = customLimits?.beta_user || customLimits?.vip_customer
  
  const linkLimit = isUnlimited ? -1 : (workspace.max_links ?? planLimits.maxLinks)
  const clickLimit = isUnlimited ? -1 : (workspace.max_clicks ?? planLimits.maxClicks)
  const userLimit = isUnlimited ? -1 : (workspace.max_users ?? planLimits.maxUsers)
  
  // Get current usage from Redis or database
  const [links, clicks, users] = await Promise.all([
    getUsageCount(workspaceId, 'links'),
    getUsageCount(workspaceId, 'clicks'),
    getUsageCount(workspaceId, 'users'),
  ])
  
  return {
    links,
    clicks,
    users,
    linkLimit,
    clickLimit,
    userLimit,
    linkPercentage: linkLimit === -1 ? 0 : (links / linkLimit) * 100,
    clickPercentage: clickLimit === -1 ? 0 : (clicks / clickLimit) * 100,
    userPercentage: userLimit === -1 ? 0 : (users / userLimit) * 100,
    plan: workspace.plan as PlanType,
  }
}

/**
 * Get usage count for a specific metric
 */
async function getUsageCount(workspaceId: string, metric: 'links' | 'clicks' | 'users'): Promise<number> {
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
  
  const cachedValue = await UsageCounter.get(redisKey)
  if (cachedValue !== null) {
    return cachedValue
  }
  
  // Fallback to database
  let count = 0
  switch (metric) {
    case 'links':
      count = await prisma.links.count({
        where: { workspace_id: workspaceId }
      })
      break
    case 'clicks':
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      count = await prisma.click_events.count({
        where: {
          links: { workspace_id: workspaceId },
          timestamp: { gte: startOfMonth }
        }
      })
      break
    case 'users':
      count = await prisma.workspace_memberships.count({
        where: { workspace_id: workspaceId }
      })
      break
  }
  
  // Update Redis cache
  await UsageCounter.set(redisKey, count)
  if (metric === 'clicks') {
    await UsageCounter.setMonthlyExpiry(redisKey)
  }
  
  return count
}

/**
 * Check for usage alerts
 */
export async function checkUsageAlerts(workspaceId: string): Promise<UsageAlert[]> {
  const usage = await getWorkspaceUsage(workspaceId)
  const alerts: UsageAlert[] = []
  
  // Check each metric for warnings and limits
  const metrics: Array<'links' | 'clicks' | 'users'> = ['links', 'clicks', 'users']
  
  for (const metric of metrics) {
    const percentage = usage[`${metric}Percentage` as keyof UsageMetrics] as number
    const limit = usage[`${metric}Limit` as keyof UsageMetrics] as number
    
    if (limit === -1) continue // Skip unlimited
    
    if (percentage >= 100) {
      alerts.push({
        type: 'limit_reached',
        metric,
        percentage,
        message: `You've reached your ${metric} limit. Upgrade to continue.`,
        action: 'upgrade',
      })
    } else if (percentage >= 80) {
      alerts.push({
        type: 'warning',
        metric,
        percentage,
        message: `You're at ${Math.round(percentage)}% of your ${metric} limit.`,
        action: 'upgrade',
      })
    }
  }
  
  return alerts
}

/**
 * Sync Redis counters to database
 */
export async function syncUsageToDatabase(workspaceId: string): Promise<void> {
  // Acquire lock to prevent concurrent syncs
  const lockKey = RedisKeys.usageSyncLock(workspaceId)
  const lockAcquired = await UsageCounter.set(lockKey, 1, 60) // 60 second lock
  
  if (!lockAcquired) {
    console.log(`Sync already in progress for workspace ${workspaceId}`)
    return
  }
  
  try {
    // Get current values from Redis
    const [links, clicks, users] = await Promise.all([
      UsageCounter.get(RedisKeys.workspaceLinks(workspaceId)),
      UsageCounter.get(RedisKeys.workspaceClicks(workspaceId)),
      UsageCounter.get(RedisKeys.workspaceMembers(workspaceId)),
    ])
    
    const now = new Date()
    const updates = []
    
    // Sync link count (lifetime)
    if (links !== null) {
      updates.push(
        prisma.usage_metrics.upsert({
          where: {
            unique_workspace_metric_period: {
              workspace_id: workspaceId,
              metric_type: 'links',
              period: 'lifetime',
              period_start: new Date(0),
            },
          },
          update: {
            value: links,
            updated_at: now,
          },
          create: {
            workspace_id: workspaceId,
            metric_type: 'links',
            value: links,
            period: 'lifetime',
            period_start: new Date(0),
            period_end: new Date('2099-12-31'),
          },
        })
      )
    }
    
    // Sync click count (monthly)
    if (clicks !== null) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      updates.push(
        prisma.usage_metrics.upsert({
          where: {
            unique_workspace_metric_period: {
              workspace_id: workspaceId,
              metric_type: 'clicks',
              period: 'monthly',
              period_start: startOfMonth,
            },
          },
          update: {
            value: clicks,
            updated_at: now,
          },
          create: {
            workspace_id: workspaceId,
            metric_type: 'clicks',
            value: clicks,
            period: 'monthly',
            period_start: startOfMonth,
            period_end: endOfMonth,
          },
        })
      )
    }
    
    // Sync user count (lifetime)
    if (users !== null) {
      updates.push(
        prisma.usage_metrics.upsert({
          where: {
            unique_workspace_metric_period: {
              workspace_id: workspaceId,
              metric_type: 'users',
              period: 'lifetime',
              period_start: new Date(0),
            },
          },
          update: {
            value: users,
            updated_at: now,
          },
          create: {
            workspace_id: workspaceId,
            metric_type: 'users',
            value: users,
            period: 'lifetime',
            period_start: new Date(0),
            period_end: new Date('2099-12-31'),
          },
        })
      )
    }
    
    // Execute all updates
    if (updates.length > 0) {
      await prisma.$transaction(updates)
    }
  } finally {
    // Release lock
    if (redis) {
      await redis.del(lockKey)
    }
  }
}

/**
 * Reset monthly click counters
 */
export async function resetMonthlyCounters(): Promise<void> {
  console.log('Starting monthly counter reset...')
  
  // Get all workspaces
  const workspaces = await prisma.workspaces.findMany({
    select: { id: true }
  })
  
  // Reset click counters for each workspace
  for (const workspace of workspaces) {
    const clickKey = RedisKeys.workspaceClicks(workspace.id)
    await UsageCounter.set(clickKey, 0)
    await UsageCounter.setMonthlyExpiry(clickKey)
  }
  
  console.log(`Reset monthly counters for ${workspaces.length} workspaces`)
}

/**
 * Initialize cron job for daily sync
 */
export function initializeUsageSyncJob(): void {
  // Run daily sync at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily usage sync...')
    
    try {
      const workspaces = await prisma.workspaces.findMany({
        select: { id: true }
      })
      
      for (const workspace of workspaces) {
        await syncUsageToDatabase(workspace.id)
      }
      
      console.log(`Synced usage for ${workspaces.length} workspaces`)
    } catch (error) {
      console.error('Daily usage sync failed:', error)
    }
  })
  
  // Reset monthly counters on the 1st of each month at 12:01 AM
  cron.schedule('1 0 1 * *', async () => {
    await resetMonthlyCounters()
  })
  
  console.log('Usage sync cron jobs initialized')
}

/**
 * Recalculate usage from database (recovery function)
 */
export async function recalculateUsage(workspaceId: string): Promise<void> {
  // Count links
  const linkCount = await prisma.links.count({
    where: { workspace_id: workspaceId }
  })
  await UsageCounter.set(RedisKeys.workspaceLinks(workspaceId), linkCount)
  
  // Count monthly clicks
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const clickCount = await prisma.click_events.count({
    where: {
      links: { workspace_id: workspaceId },
      timestamp: { gte: startOfMonth }
    }
  })
  const clickKey = RedisKeys.workspaceClicks(workspaceId)
  await UsageCounter.set(clickKey, clickCount)
  await UsageCounter.setMonthlyExpiry(clickKey)
  
  // Count users
  const userCount = await prisma.workspace_memberships.count({
    where: { workspace_id: workspaceId }
  })
  await UsageCounter.set(RedisKeys.workspaceMembers(workspaceId), userCount)
  
  // Sync to database
  await syncUsageToDatabase(workspaceId)
}

/**
 * Track click event (always succeeds, never blocks)
 */
export async function trackClick(linkId: string, workspaceId: string): Promise<void> {
  try {
    // Increment Redis counter
    const clickKey = RedisKeys.workspaceClicks(workspaceId)
    await UsageCounter.increment(clickKey, 1)
    await UsageCounter.setMonthlyExpiry(clickKey)
  } catch (error) {
    // Log but don't throw - clicks should never be lost
    console.error('Failed to update click counter in Redis:', error)
    
    // Try to update database directly as fallback
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      await prisma.usage_metrics.upsert({
        where: {
          unique_workspace_metric_period: {
            workspace_id: workspaceId,
            metric_type: 'clicks',
            period: 'monthly',
            period_start: startOfMonth,
          },
        },
        update: {
          value: { increment: 1 },
          updated_at: now,
        },
        create: {
          workspace_id: workspaceId,
          metric_type: 'clicks',
          value: 1,
          period: 'monthly',
          period_start: startOfMonth,
          period_end: endOfMonth,
        },
      })
    } catch (dbError) {
      console.error('Failed to update click counter in database:', dbError)
      // Still don't throw - clicks should never be lost
    }
  }
}