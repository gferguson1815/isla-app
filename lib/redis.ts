import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Redis client for usage tracking
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

// Initialize Redis client
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  // Create rate limiter instance
  ratelimit = new Ratelimit({
    redis: redis as any,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit',
  })
}

// Export singleton instance
export { redis, ratelimit }

// Redis key schemas for counters
export const RedisKeys = {
  // Workspace link count
  workspaceLinks: (workspaceId: string) => `workspace:${workspaceId}:links`,
  
  // Workspace click count per month (YYYY-MM format)
  workspaceClicks: (workspaceId: string, month?: string) => {
    const currentMonth = month || new Date().toISOString().slice(0, 7)
    return `workspace:${workspaceId}:clicks:${currentMonth}`
  },
  
  // Workspace team member count
  workspaceMembers: (workspaceId: string) => `workspace:${workspaceId}:members`,
  
  // Usage sync flag (to prevent duplicate syncs)
  usageSyncLock: (workspaceId: string) => `workspace:${workspaceId}:sync:lock`,
  
  // Temporary limit overrides
  limitOverride: (workspaceId: string, metric: string) => 
    `workspace:${workspaceId}:override:${metric}`,
}

// Counter operations with error handling
export class UsageCounter {
  /**
   * Increment a counter
   */
  static async increment(key: string, amount = 1): Promise<number | null> {
    if (!redis) {
      console.warn('Redis not configured, falling back to database')
      return null
    }

    try {
      const newValue = await redis.incrby(key, amount)
      return newValue
    } catch (error) {
      console.error('Redis increment error:', error)
      return null
    }
  }

  /**
   * Decrement a counter
   */
  static async decrement(key: string, amount = 1): Promise<number | null> {
    if (!redis) {
      console.warn('Redis not configured, falling back to database')
      return null
    }

    try {
      const newValue = await redis.decrby(key, amount)
      // Don't allow negative values
      if (newValue < 0) {
        await redis.set(key, 0)
        return 0
      }
      return newValue
    } catch (error) {
      console.error('Redis decrement error:', error)
      return null
    }
  }

  /**
   * Get current counter value
   */
  static async get(key: string): Promise<number | null> {
    if (!redis) {
      console.warn('Redis not configured, falling back to database')
      return null
    }

    try {
      const value = await redis.get(key)
      return value ? Number(value) : 0
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  /**
   * Set counter value with optional TTL
   */
  static async set(key: string, value: number, ttl?: number): Promise<boolean> {
    if (!redis) {
      console.warn('Redis not configured, falling back to database')
      return false
    }

    try {
      if (ttl) {
        await redis.setex(key, ttl, value)
      } else {
        await redis.set(key, value)
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  /**
   * Set TTL for monthly reset
   */
  static async setMonthlyExpiry(key: string): Promise<boolean> {
    if (!redis) {
      return false
    }

    try {
      // Calculate seconds until end of month
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      const ttlSeconds = Math.floor((endOfMonth.getTime() - now.getTime()) / 1000)
      
      await redis.expire(key, ttlSeconds)
      return true
    } catch (error) {
      console.error('Redis expire error:', error)
      return false
    }
  }

  /**
   * Batch get multiple counters
   */
  static async getMultiple(keys: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>()
    
    if (!redis) {
      console.warn('Redis not configured, falling back to database')
      return results
    }

    try {
      // Use pipeline for efficient batch operations
      const pipeline = redis.pipeline()
      keys.forEach(key => pipeline.get(key))
      
      const values = await pipeline.exec()
      keys.forEach((key, index) => {
        const value = values?.[index]
        results.set(key, value ? Number(value) : 0)
      })
    } catch (error) {
      console.error('Redis batch get error:', error)
    }

    return results
  }

  /**
   * Atomic check and increment (for enforcing hard limits)
   */
  static async checkAndIncrement(
    key: string, 
    limit: number, 
    amount = 1
  ): Promise<{ success: boolean; current: number }> {
    if (!redis) {
      console.warn('Redis not configured, falling back to database')
      return { success: false, current: 0 }
    }

    try {
      // Use Lua script for atomic operation
      const luaScript = `
        local current = redis.call('GET', KEYS[1])
        current = current and tonumber(current) or 0
        
        if current + tonumber(ARGV[1]) <= tonumber(ARGV[2]) then
          local new_value = redis.call('INCRBY', KEYS[1], ARGV[1])
          return {1, new_value}
        else
          return {0, current}
        end
      `
      
      const result = await redis.eval(
        luaScript, 
        [key], 
        [amount.toString(), limit.toString()]
      ) as [number, number]
      
      return {
        success: result[0] === 1,
        current: result[1]
      }
    } catch (error) {
      console.error('Redis checkAndIncrement error:', error)
      return { success: false, current: 0 }
    }
  }
}

// Connection health check
export async function isRedisConnected(): Promise<boolean> {
  if (!redis) {
    return false
  }

  try {
    await redis.ping()
    return true
  } catch {
    return false
  }
}