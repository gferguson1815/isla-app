import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { 
  getWorkspaceUsage, 
  checkUsageAlerts, 
  syncUsageToDatabase,
  recalculateUsage,
  trackClick,
  resetMonthlyCounters
} from '../usage-tracking'
import { prisma } from '@/lib/prisma'
import * as redis from '@/lib/redis'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workspaces: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
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
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/redis', () => ({
  redis: {},
  RedisKeys: {
    workspaceLinks: vi.fn((id) => `workspace:${id}:links`),
    workspaceClicks: vi.fn((id) => `workspace:${id}:clicks:2025-09`),
    workspaceMembers: vi.fn((id) => `workspace:${id}:members`),
    usageSyncLock: vi.fn((id) => `workspace:${id}:sync:lock`),
  },
  UsageCounter: {
    get: vi.fn(),
    set: vi.fn(),
    increment: vi.fn(),
    setMonthlyExpiry: vi.fn(),
  },
}))

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn(),
  },
}))

describe('Usage Tracking Service', () => {
  const mockWorkspaceId = 'workspace-123'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWorkspaceUsage', () => {
    it('should return complete usage metrics', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        plan: 'pro',
        max_links: 5000,
        max_clicks: 500000,
        max_users: 10,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get)
        .mockResolvedValueOnce(2500)  // links
        .mockResolvedValueOnce(250000) // clicks
        .mockResolvedValueOnce(5)      // users
      
      const usage = await getWorkspaceUsage(mockWorkspaceId)
      
      expect(usage.links).toBe(2500)
      expect(usage.clicks).toBe(250000)
      expect(usage.users).toBe(5)
      expect(usage.linkLimit).toBe(5000)
      expect(usage.clickLimit).toBe(500000)
      expect(usage.userLimit).toBe(10)
      expect(usage.linkPercentage).toBe(50)
      expect(usage.clickPercentage).toBe(50)
      expect(usage.userPercentage).toBe(50)
      expect(usage.plan).toBe('pro')
    })

    it('should handle unlimited plans correctly', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        plan: 'business',
        max_links: -1,
        max_clicks: -1,
        max_users: -1,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get)
        .mockResolvedValueOnce(10000)  // links
        .mockResolvedValueOnce(1000000) // clicks
        .mockResolvedValueOnce(50)      // users
      
      const usage = await getWorkspaceUsage(mockWorkspaceId)
      
      expect(usage.linkLimit).toBe(-1)
      expect(usage.clickLimit).toBe(-1)
      expect(usage.userLimit).toBe(-1)
      expect(usage.linkPercentage).toBe(0)
      expect(usage.clickPercentage).toBe(0)
      expect(usage.userPercentage).toBe(0)
    })

    it('should respect beta user unlimited access', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        plan: 'free',
        max_links: 50,
        max_clicks: 5000,
        max_users: 1,
        custom_limits: { beta_user: true },
      } as any)
      
      vi.mocked(redis.UsageCounter.get)
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(100000)
        .mockResolvedValueOnce(20)
      
      const usage = await getWorkspaceUsage(mockWorkspaceId)
      
      expect(usage.linkLimit).toBe(-1)
      expect(usage.clickLimit).toBe(-1)
      expect(usage.userLimit).toBe(-1)
    })

    it('should fallback to database when Redis unavailable', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        plan: 'free',
        max_links: 50,
        max_clicks: 5000,
        max_users: 1,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get).mockResolvedValue(null)
      vi.mocked(prisma.links.count).mockResolvedValue(25)
      vi.mocked(prisma.click_events.count).mockResolvedValue(2500)
      vi.mocked(prisma.workspace_memberships.count).mockResolvedValue(1)
      
      const usage = await getWorkspaceUsage(mockWorkspaceId)
      
      expect(usage.links).toBe(25)
      expect(usage.clicks).toBe(2500)
      expect(usage.users).toBe(1)
      expect(prisma.links.count).toHaveBeenCalled()
      expect(prisma.click_events.count).toHaveBeenCalled()
      expect(prisma.workspace_memberships.count).toHaveBeenCalled()
    })
  })

  describe('checkUsageAlerts', () => {
    it('should return no alerts when under 80%', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        plan: 'free',
        max_links: 50,
        max_clicks: 5000,
        max_users: 1,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get)
        .mockResolvedValueOnce(30)  // 60% links
        .mockResolvedValueOnce(3000) // 60% clicks
        .mockResolvedValueOnce(0)    // 0% users
      
      const alerts = await checkUsageAlerts(mockWorkspaceId)
      
      expect(alerts).toHaveLength(0)
    })

    it('should return warning alert at 80%', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        plan: 'free',
        max_links: 50,
        max_clicks: 5000,
        max_users: 1,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get)
        .mockResolvedValueOnce(40)  // 80% links
        .mockResolvedValueOnce(3000) // 60% clicks
        .mockResolvedValueOnce(0)    // 0% users
      
      const alerts = await checkUsageAlerts(mockWorkspaceId)
      
      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('warning')
      expect(alerts[0].metric).toBe('links')
      expect(alerts[0].percentage).toBe(80)
    })

    it('should return limit reached alert at 100%', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        plan: 'free',
        max_links: 50,
        max_clicks: 5000,
        max_users: 1,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get)
        .mockResolvedValueOnce(50)  // 100% links
        .mockResolvedValueOnce(5000) // 100% clicks
        .mockResolvedValueOnce(1)    // 100% users
      
      const alerts = await checkUsageAlerts(mockWorkspaceId)
      
      expect(alerts).toHaveLength(3)
      expect(alerts.every(a => a.type === 'limit_reached')).toBe(true)
      expect(alerts.every(a => a.action === 'upgrade')).toBe(true)
    })

    it('should not return alerts for unlimited plans', async () => {
      vi.mocked(prisma.workspaces.findUnique).mockResolvedValue({
        plan: 'business',
        max_links: -1,
        max_clicks: -1,
        max_users: -1,
        custom_limits: null,
      } as any)
      
      vi.mocked(redis.UsageCounter.get)
        .mockResolvedValueOnce(10000)
        .mockResolvedValueOnce(1000000)
        .mockResolvedValueOnce(100)
      
      const alerts = await checkUsageAlerts(mockWorkspaceId)
      
      expect(alerts).toHaveLength(0)
    })
  })

  describe('syncUsageToDatabase', () => {
    it('should sync Redis counters to database', async () => {
      vi.mocked(redis.UsageCounter.set).mockResolvedValue(true) // Lock acquired
      vi.mocked(redis.UsageCounter.get)
        .mockResolvedValueOnce(100) // links
        .mockResolvedValueOnce(5000) // clicks
        .mockResolvedValueOnce(5)   // users
      
      vi.mocked(prisma.$transaction).mockResolvedValue([])
      
      await syncUsageToDatabase(mockWorkspaceId)
      
      expect(redis.UsageCounter.set).toHaveBeenCalledWith(
        `workspace:${mockWorkspaceId}:sync:lock`,
        1,
        60
      )
      expect(prisma.usage_metrics.upsert).toHaveBeenCalledTimes(3)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should skip sync if lock already acquired', async () => {
      vi.mocked(redis.UsageCounter.set).mockResolvedValue(false) // Lock not acquired
      
      await syncUsageToDatabase(mockWorkspaceId)
      
      expect(redis.UsageCounter.get).not.toHaveBeenCalled()
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('recalculateUsage', () => {
    it('should recalculate usage from database', async () => {
      vi.mocked(prisma.links.count).mockResolvedValue(75)
      vi.mocked(prisma.click_events.count).mockResolvedValue(3000)
      vi.mocked(prisma.workspace_memberships.count).mockResolvedValue(3)
      vi.mocked(redis.UsageCounter.set).mockResolvedValue(true)
      vi.mocked(redis.UsageCounter.setMonthlyExpiry).mockResolvedValue(true)
      
      await recalculateUsage(mockWorkspaceId)
      
      expect(redis.UsageCounter.set).toHaveBeenCalledWith(
        `workspace:${mockWorkspaceId}:links`,
        75
      )
      expect(redis.UsageCounter.set).toHaveBeenCalledWith(
        `workspace:${mockWorkspaceId}:clicks:2025-09`,
        3000
      )
      expect(redis.UsageCounter.set).toHaveBeenCalledWith(
        `workspace:${mockWorkspaceId}:members`,
        3
      )
      expect(redis.UsageCounter.setMonthlyExpiry).toHaveBeenCalled()
    })
  })

  describe('trackClick', () => {
    it('should increment click counter', async () => {
      vi.mocked(redis.UsageCounter.increment).mockResolvedValue(101)
      vi.mocked(redis.UsageCounter.setMonthlyExpiry).mockResolvedValue(true)
      
      await trackClick('link-123', mockWorkspaceId)
      
      expect(redis.UsageCounter.increment).toHaveBeenCalledWith(
        `workspace:${mockWorkspaceId}:clicks:2025-09`,
        1
      )
      expect(redis.UsageCounter.setMonthlyExpiry).toHaveBeenCalled()
    })

    it('should not throw when Redis fails', async () => {
      vi.mocked(redis.UsageCounter.increment).mockRejectedValue(new Error('Redis error'))
      vi.mocked(prisma.usage_metrics.upsert).mockResolvedValue({} as any)
      
      await expect(trackClick('link-123', mockWorkspaceId)).resolves.not.toThrow()
      
      expect(prisma.usage_metrics.upsert).toHaveBeenCalled()
    })

    it('should not throw when both Redis and database fail', async () => {
      vi.mocked(redis.UsageCounter.increment).mockRejectedValue(new Error('Redis error'))
      vi.mocked(prisma.usage_metrics.upsert).mockRejectedValue(new Error('DB error'))
      
      await expect(trackClick('link-123', mockWorkspaceId)).resolves.not.toThrow()
    })
  })

  describe('resetMonthlyCounters', () => {
    it('should reset all workspace click counters', async () => {
      vi.mocked(prisma.workspaces.findMany).mockResolvedValue([
        { id: 'workspace-1' },
        { id: 'workspace-2' },
        { id: 'workspace-3' },
      ] as any)
      
      vi.mocked(redis.UsageCounter.set).mockResolvedValue(true)
      vi.mocked(redis.UsageCounter.setMonthlyExpiry).mockResolvedValue(true)
      
      await resetMonthlyCounters()
      
      expect(redis.UsageCounter.set).toHaveBeenCalledTimes(3)
      expect(redis.UsageCounter.set).toHaveBeenCalledWith(
        'workspace:workspace-1:clicks:2025-09',
        0
      )
      expect(redis.UsageCounter.setMonthlyExpiry).toHaveBeenCalledTimes(3)
    })
  })
})