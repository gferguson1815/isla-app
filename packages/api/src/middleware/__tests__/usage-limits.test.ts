import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { checkUsageLimits, checkUsageLimitsMiddleware, incrementUsage, decrementUsage, PLAN_LIMITS } from '../usage-limits'
import { prisma } from '@/lib/prisma'
import * as redis from '@/lib/redis'
import { TRPCError } from '@trpc/server'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspaces: {
      findUnique: vi.fn(),
    },
    links: {
      count: vi.fn(),
    },
    click_events: {
      count: vi.fn(),
    },
    workspace_memberships: {
      count: vi.fn(),
    },
    usage_metrics: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

// Mock Redis
vi.mock('@/lib/redis', () => ({
  redis: {},
  RedisKeys: {
    workspaceLinks: vi.fn((id) => `workspace:${id}:links`),
    workspaceClicks: vi.fn((id) => `workspace:${id}:clicks:2025-09`),
    workspaceMembers: vi.fn((id) => `workspace:${id}:members`),
  },
  UsageCounter: {
    get: vi.fn(),
    set: vi.fn(),
    increment: vi.fn(),
    decrement: vi.fn(),
    setMonthlyExpiry: vi.fn(),
    checkAndIncrement: vi.fn(),
  },
}))

describe('Usage Limits Middleware', () => {
  const mockWorkspaceId = 'workspace-123'
  const mockUserId = 'user-456'
  
  const mockContext = {
    session: { user: { id: mockUserId } },
    workspaceId: mockWorkspaceId,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkUsageLimits', () => {
    it('should allow action when under limit', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_links: 50,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(10)
      
      const result = await checkUsageLimits(mockWorkspaceId, 'links', 1)
      
      expect(result.allowed).toBe(true)
      expect(result.current).toBe(10)
      expect(result.limit).toBe(50)
      expect(result.percentage).toBe(22) // (11/50)*100
      expect(result.shouldWarn).toBe(false)
      expect(result.upgradeRequired).toBe(false)
    })

    it('should warn at 80% usage', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_links: 50,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(40)
      
      const result = await checkUsageLimits(mockWorkspaceId, 'links', 1)
      
      expect(result.allowed).toBe(true)
      expect(result.shouldWarn).toBe(true)
      expect(result.percentage).toBe(82) // (41/50)*100
    })

    it('should block when at limit', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_links: 50,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(50)
      
      const result = await checkUsageLimits(mockWorkspaceId, 'links', 1)
      
      expect(result.allowed).toBe(false)
      expect(result.upgradeRequired).toBe(true)
      expect(result.suggestedPlan).toBe('starter')
    })

    it('should respect beta user unlimited access', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_links: 50,
        custom_limits: { beta_user: true },
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(1000)
      
      const result = await checkUsageLimits(mockWorkspaceId, 'links', 1)
      
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(-1) // Unlimited
      expect(result.percentage).toBe(0)
    })

    it('should respect VIP customer unlimited access', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_links: 50,
        custom_limits: { vip_customer: true },
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(2000)
      
      const result = await checkUsageLimits(mockWorkspaceId, 'links', 1)
      
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(-1) // Unlimited
    })

    it('should respect temporary increases', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)
      
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_links: 50,
        custom_limits: {
          temp_increases: {
            links: 100,
            expires: futureDate.toISOString(),
          },
        },
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(75)
      
      const result = await checkUsageLimits(mockWorkspaceId, 'links', 1)
      
      expect(result.allowed).toBe(true)
      expect(result.limit).toBe(100)
      expect(result.percentage).toBe(76) // (76/100)*100
    })

    it('should ignore expired temporary increases', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_links: 50,
        custom_limits: {
          temp_increases: {
            links: 100,
            expires: pastDate.toISOString(),
          },
        },
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(75)
      
      const result = await checkUsageLimits(mockWorkspaceId, 'links', 1)
      
      expect(result.allowed).toBe(false)
      expect(result.limit).toBe(50) // Back to base limit
      expect(result.upgradeRequired).toBe(true)
    })

    it('should fallback to database when Redis is unavailable', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_links: 50,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(null) // Redis unavailable
      vi.mocked(prisma.links.count).mockResolvedValue(25)
      
      const result = await checkUsageLimits(mockWorkspaceId, 'links', 1)
      
      expect(result.allowed).toBe(true)
      expect(result.current).toBe(25)
      expect(prisma.links.count).toHaveBeenCalledWith({
        where: { workspace_id: mockWorkspaceId },
      })
    })
  })

  describe('checkUsageLimitsMiddleware', () => {
    it('should throw error when not authenticated', async () => {
      const invalidContext = {
        session: null,
        workspaceId: mockWorkspaceId,
      }
      
      await expect(
        checkUsageLimitsMiddleware({
          ctx: invalidContext as any,
          metric: 'links',
        })
      ).rejects.toThrow(TRPCError)
    })

    it('should allow graceful degradation for analytics', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_clicks: 5000,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(5000)
      
      const result = await checkUsageLimitsMiddleware({
        ctx: mockContext as any,
        metric: 'clicks',
        gracefulDegradation: true,
      })
      
      expect(result.allowed).toBe(false)
      expect(result.readOnly).toBe(true)
    })

    it('should throw error with upgrade suggestion when limit exceeded', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'free',
        max_links: 50,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(50)
      
      try {
        await checkUsageLimitsMiddleware({
          ctx: mockContext as any,
          metric: 'links',
        })
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError)
        expect(error.code).toBe('FORBIDDEN')
        expect(error.cause.suggestedPlan).toBe('starter')
      }
    })
  })

  describe('incrementUsage', () => {
    it('should increment Redis counter', async () => {
      vi.mocked(redis.UsageCounter.increment).mockResolvedValue(11)
      
      await incrementUsage(mockWorkspaceId, 'links', 1)
      
      expect(redis.UsageCounter.increment).toHaveBeenCalledWith(
        'workspace:workspace-123:links',
        1
      )
    })

    it('should set monthly expiry for click counters', async () => {
      vi.mocked(redis.UsageCounter.increment).mockResolvedValue(100)
      
      await incrementUsage(mockWorkspaceId, 'clicks', 5)
      
      expect(redis.UsageCounter.setMonthlyExpiry).toHaveBeenCalledWith(
        'workspace:workspace-123:clicks:2025-09'
      )
    })

    it('should fallback to database when Redis fails', async () => {
      vi.mocked(redis.UsageCounter.increment).mockResolvedValue(null)
      
      await incrementUsage(mockWorkspaceId, 'links', 1)
      
      expect(prisma.usage_metrics.upsert).toHaveBeenCalled()
    })
  })

  describe('decrementUsage', () => {
    it('should not decrement clicks', async () => {
      await decrementUsage(mockWorkspaceId, 'clicks', 1)
      
      expect(redis.UsageCounter.decrement).not.toHaveBeenCalled()
    })

    it('should decrement links counter', async () => {
      vi.mocked(redis.UsageCounter.decrement).mockResolvedValue(9)
      
      await decrementUsage(mockWorkspaceId, 'links', 1)
      
      expect(redis.UsageCounter.decrement).toHaveBeenCalledWith(
        'workspace:workspace-123:links',
        1
      )
    })

    it('should decrement users counter', async () => {
      vi.mocked(redis.UsageCounter.decrement).mockResolvedValue(2)
      
      await decrementUsage(mockWorkspaceId, 'users', 1)
      
      expect(redis.UsageCounter.decrement).toHaveBeenCalledWith(
        'workspace:workspace-123:members',
        1
      )
    })
  })

  describe('Plan Limits', () => {
    it('should have correct free plan limits', () => {
      expect(PLAN_LIMITS.free.maxLinks).toBe(50)
      expect(PLAN_LIMITS.free.maxClicks).toBe(5000)
      expect(PLAN_LIMITS.free.maxUsers).toBe(1)
      expect(PLAN_LIMITS.free.customDomains).toBe(false)
    })

    it('should have correct starter plan limits', () => {
      expect(PLAN_LIMITS.starter.maxLinks).toBe(500)
      expect(PLAN_LIMITS.starter.maxClicks).toBe(50000)
      expect(PLAN_LIMITS.starter.maxUsers).toBe(3)
      expect(PLAN_LIMITS.starter.customDomains).toBe(false)
    })

    it('should have correct pro plan limits', () => {
      expect(PLAN_LIMITS.pro.maxLinks).toBe(5000)
      expect(PLAN_LIMITS.pro.maxClicks).toBe(500000)
      expect(PLAN_LIMITS.pro.maxUsers).toBe(10)
      expect(PLAN_LIMITS.pro.customDomains).toBe(true)
    })

    it('should have unlimited business plan', () => {
      expect(PLAN_LIMITS.business.maxLinks).toBe(-1)
      expect(PLAN_LIMITS.business.maxClicks).toBe(-1)
      expect(PLAN_LIMITS.business.maxUsers).toBe(-1)
      expect(PLAN_LIMITS.business.customDomains).toBe(true)
    })
  })
})