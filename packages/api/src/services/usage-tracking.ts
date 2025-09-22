import { prisma } from '@/lib/prisma'
import { redis, RedisKeys, UsageCounter } from '@/lib/redis'
import { type PlanType, PLAN_LIMITS } from '../middleware/usage-limits'

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
    }
  })

  if (!workspace) {
    throw new Error('Workspace not found')
  }

  // Get limits based on plan and overrides
  const planLimits = PLAN_LIMITS[workspace.plan as PlanType] || PLAN_LIMITS.free

  // Use workspace max limits if set, otherwise use plan defaults
  const linkLimit = workspace.max_links ?? planLimits.maxLinks
  const clickLimit = workspace.max_clicks ?? planLimits.maxClicks
  const userLimit = workspace.max_users ?? planLimits.maxUsers
  
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
      // Links are counted for the current billing period
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { created_at: true }
      })

      if (!workspace) {
        return 0
      }

      const linkStartDate = calculateCurrentPeriodStart(workspace.created_at)
      count = await prisma.links.count({
        where: {
          workspace_id: workspaceId,
          created_at: { gte: linkStartDate }
        }
      })
      break
    case 'clicks':
      // Clicks are counted for the current billing period based on workspace creation
      const workspaceForClicks = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { created_at: true }
      })

      if (!workspaceForClicks) {
        return 0
      }

      const clickStartDate = calculateCurrentPeriodStart(workspaceForClicks.created_at)
      count = await prisma.click_events.count({
        where: {
          links: { workspace_id: workspaceId },
          timestamp: { gte: clickStartDate }
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
  if (metric === 'clicks' || metric === 'links') {
    // Set expiry to the end of the current billing period
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { created_at: true }
    })
    if (workspace) {
      const nextReset = calculateNextPeriodStart(workspace.created_at)
      const ttlSeconds = Math.floor((nextReset.getTime() - Date.now()) / 1000)
      if (ttlSeconds > 0 && redis) {
        await redis.expire(redisKey, ttlSeconds)
      }
    }
  }

  return count
}

/**
 * Calculate the start of the current billing period based on workspace creation date
 */
function calculateCurrentPeriodStart(createdAt: Date): Date {
  const now = new Date()
  const startDate = new Date(createdAt)

  // Calculate months since creation
  let monthsSinceCreation = (now.getFullYear() - startDate.getFullYear()) * 12
  monthsSinceCreation += now.getMonth() - startDate.getMonth()

  // If we haven't reached the day of the month yet, we're still in the previous period
  if (now.getDate() < startDate.getDate()) {
    monthsSinceCreation--
  }

  // Calculate the start of the current period
  const periodStart = new Date(startDate)
  periodStart.setMonth(startDate.getMonth() + monthsSinceCreation)

  // Handle edge cases where the day doesn't exist in the target month
  if (periodStart.getDate() !== startDate.getDate()) {
    periodStart.setDate(0) // Set to last day of previous month
  }

  return periodStart
}

/**
 * Calculate the start of the next billing period based on workspace creation date
 */
function calculateNextPeriodStart(createdAt: Date): Date {
  const currentPeriodStart = calculateCurrentPeriodStart(createdAt)
  const nextPeriod = new Date(currentPeriodStart)
  nextPeriod.setMonth(nextPeriod.getMonth() + 1)

  // Handle edge cases for month boundaries
  const originalDate = new Date(createdAt).getDate()
  if (nextPeriod.getDate() !== originalDate) {
    nextPeriod.setDate(0) // Set to last day of previous month
  }

  return nextPeriod
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
 * Reset counters for workspaces that have reached their billing period reset date
 */
export async function resetWorkspaceCounters(): Promise<void> {
  console.log('Checking for workspace counter resets...')

  const now = new Date()
  const workspaces = await prisma.workspaces.findMany({
    select: {
      id: true,
      created_at: true
    }
  })

  let resetCount = 0
  for (const workspace of workspaces) {
    const currentPeriodStart = calculateCurrentPeriodStart(workspace.created_at)
    const lastResetKey = `${RedisKeys.workspaceClicks(workspace.id)}:last_reset`

    // Check if we've already reset for this period
    const lastResetStr = redis ? await redis.get(lastResetKey) : null
    const lastReset = lastResetStr ? new Date(lastResetStr) : null

    // If we haven't reset yet for this period, do it now
    if (!lastReset || lastReset < currentPeriodStart) {
      // Reset click and link counters for this workspace
      const clickKey = RedisKeys.workspaceClicks(workspace.id)
      const linkKey = RedisKeys.workspaceLinks(workspace.id)

      await UsageCounter.set(clickKey, 0)
      await UsageCounter.set(linkKey, 0)

      // Set expiry to next reset date
      const nextReset = calculateNextPeriodStart(workspace.created_at)
      const ttlSeconds = Math.floor((nextReset.getTime() - now.getTime()) / 1000)
      if (ttlSeconds > 0 && redis) {
        await redis.expire(clickKey, ttlSeconds)
        await redis.expire(linkKey, ttlSeconds)
      }

      // Mark this workspace as reset for this period
      if (redis) {
        await redis.set(lastResetKey, currentPeriodStart.toISOString())
        await redis.expire(lastResetKey, 60 * 60 * 24 * 35) // Keep for 35 days
      }

      resetCount++
    }
  }

  if (resetCount > 0) {
    console.log(`Reset counters for ${resetCount} workspaces`)
  }
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