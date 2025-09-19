import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyticsRouter } from '../analytics';
import { TRPCError } from '@trpc/server';

vi.mock('@/lib/rate-limiter', () => ({
  analyticsRateLimiter: {
    checkLimit: vi.fn(),
  },
  exportRateLimiter: {
    checkLimit: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockTimeSeriesData,
                error: null,
              })),
            })),
          })),
          not: vi.fn(() => ({
            gte: vi.fn(() => ({
              data: mockClickEvents,
              error: null,
            })),
          })),
        })),
        not: vi.fn(() => ({
          data: mockClickEvents,
          error: null,
        })),
      })),
    })),
  })),
}));

const mockTimeSeriesData = [
  {
    period_start: '2024-01-01T00:00:00Z',
    total_clicks: 100,
    unique_visitors: 50,
  },
  {
    period_start: '2024-01-01T01:00:00Z',
    total_clicks: 150,
    unique_visitors: 75,
  },
];

const mockClickEvents = [
  {
    id: '1',
    link_id: 'test-link',
    timestamp: '2024-01-01T10:00:00Z',
    country: 'United States',
    city: 'New York',
    region: 'NY',
    device: 'desktop',
    browser: 'Chrome',
    browser_version: '120',
    os: 'Windows',
    os_version: '11',
    referrer: 'google.com',
    referrer_type: 'search',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'test',
  },
  {
    id: '2',
    link_id: 'test-link',
    timestamp: '2024-01-01T11:00:00Z',
    country: 'Canada',
    city: 'Toronto',
    region: 'ON',
    device: 'mobile',
    browser: 'Safari',
    browser_version: '17',
    os: 'iOS',
    os_version: '17',
    referrer: null,
    referrer_type: 'direct',
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
  },
];

describe('analyticsRouter', () => {
  const mockContext = {
    userId: 'test-user',
    user: { id: 'test-user' },
    session: { user: { id: 'test-user' } },
    prisma: {
      link: {
        findUnique: vi.fn().mockResolvedValue({
          workspaceId: 'workspace-123',
        }),
      },
      workspaceMembership: {
        findFirst: vi.fn().mockResolvedValue({
          userId: 'test-user',
          workspaceId: 'workspace-123',
        }),
      },
    },
  };

  describe('getTimeSeriesData', () => {
    it('fetches time series data for 24h range', async () => {
      const caller = analyticsRouter.createCaller(mockContext as any);

      const result = await caller.getTimeSeriesData({
        linkId: 'test-link',
        dateRange: '24h',
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        periodStart: '2024-01-01T00:00:00Z',
        totalClicks: 100,
        uniqueVisitors: 50,
      });
    });

    it('throws error for custom range without dates', async () => {
      const caller = analyticsRouter.createCaller(mockContext as any);

      await expect(
        caller.getTimeSeriesData({
          linkId: 'test-link',
          dateRange: 'custom',
        })
      ).rejects.toThrow('Start and end dates required for custom range');
    });
  });

  describe('getGeoData', () => {
    it('fetches and aggregates geographic data', async () => {
      const caller = analyticsRouter.createCaller(mockContext as any);

      const result = await caller.getGeoData({
        linkId: 'test-link',
        dateRange: '7d',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getReferrerData', () => {
    it('fetches referrer data with pagination', async () => {
      const caller = analyticsRouter.createCaller(mockContext as any);

      const result = await caller.getReferrerData({
        linkId: 'test-link',
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty('referrers');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });
  });

  describe('getDeviceBrowserData', () => {
    it('fetches device and browser breakdown', async () => {
      const caller = analyticsRouter.createCaller(mockContext as any);

      const result = await caller.getDeviceBrowserData({
        linkId: 'test-link',
        dateRange: '30d',
      });

      expect(result).toHaveProperty('devices');
      expect(result).toHaveProperty('browsers');
      expect(result.devices).toHaveProperty('mobile');
      expect(result.devices).toHaveProperty('desktop');
      expect(result.devices).toHaveProperty('tablet');
    });
  });

  describe('getClickEvents', () => {
    it('fetches click events with filters', async () => {
      const caller = analyticsRouter.createCaller(mockContext as any);

      const result = await caller.getClickEvents({
        linkId: 'test-link',
        filters: {
          device: 'desktop',
          browser: 'Chrome',
        },
        limit: 50,
      });

      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('nextCursor');
      expect(Array.isArray(result.events)).toBe(true);
    });

    it('supports cursor-based pagination', async () => {
      const caller = analyticsRouter.createCaller(mockContext as any);

      const result = await caller.getClickEvents({
        linkId: 'test-link',
        cursor: '2024-01-01T12:00:00Z',
        limit: 25,
      });

      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('nextCursor');
    });
  });

  describe('exportAnalytics', () => {
    it('exports analytics data as CSV', async () => {
      const caller = analyticsRouter.createCaller(mockContext as any);

      const result = await caller.exportAnalytics({
        linkId: 'test-link',
        format: 'csv',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      });

      expect(result).toHaveProperty('csv');
      expect(typeof result.csv).toBe('string');
      expect(result.csv).toContain('Timestamp');
      expect(result.csv).toContain('Country');
    });

    it('exports analytics data as JSON', async () => {
      const caller = analyticsRouter.createCaller(mockContext as any);

      const result = await caller.exportAnalytics({
        linkId: 'test-link',
        format: 'json',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      });

      expect(result).toHaveProperty('json');
      expect(typeof result.json).toBe('string');

      const parsed = JSON.parse(result.json!);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('Security and Permissions', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should reject access when link does not exist', async () => {
      mockContext.prisma.link.findUnique.mockResolvedValueOnce(null);

      const caller = analyticsRouter.createCaller(mockContext as any);

      await expect(
        caller.getTimeSeriesData({
          linkId: 'non-existent-link',
          dateRange: '7d',
        })
      ).rejects.toThrow('Link not found');
    });

    it('should reject access when user is not a workspace member', async () => {
      mockContext.prisma.link.findUnique.mockResolvedValueOnce({
        workspaceId: 'workspace-123',
      });
      mockContext.prisma.workspaceMembership.findFirst.mockResolvedValueOnce(null);

      const caller = analyticsRouter.createCaller(mockContext as any);

      await expect(
        caller.getTimeSeriesData({
          linkId: 'test-link',
          dateRange: '7d',
        })
      ).rejects.toThrow('You do not have permission to view analytics for this link');
    });

    it('should check permissions for all endpoints', async () => {
      mockContext.prisma.link.findUnique.mockResolvedValue(null);

      const caller = analyticsRouter.createCaller(mockContext as any);

      // Test getGeoData
      await expect(
        caller.getGeoData({
          linkId: 'non-existent-link',
          dateRange: '7d',
        })
      ).rejects.toThrow('Link not found');

      // Test getReferrerData
      await expect(
        caller.getReferrerData({
          linkId: 'non-existent-link',
        })
      ).rejects.toThrow('Link not found');

      // Test getDeviceBrowserData
      await expect(
        caller.getDeviceBrowserData({
          linkId: 'non-existent-link',
          dateRange: '7d',
        })
      ).rejects.toThrow('Link not found');

      // Test getClickEvents
      await expect(
        caller.getClickEvents({
          linkId: 'non-existent-link',
        })
      ).rejects.toThrow('Link not found');

      // Test exportAnalytics
      await expect(
        caller.exportAnalytics({
          linkId: 'non-existent-link',
          format: 'csv',
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
        })
      ).rejects.toThrow('Link not found');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockContext.prisma.link.findUnique.mockResolvedValue({
        workspaceId: 'workspace-123',
      });
      mockContext.prisma.workspaceMembership.findFirst.mockResolvedValue({
        userId: 'test-user',
        workspaceId: 'workspace-123',
      });
    });

    it('should apply rate limiting to analytics endpoints', async () => {
      const { analyticsRateLimiter } = await import('@/lib/rate-limiter');

      const caller = analyticsRouter.createCaller(mockContext as any);

      await caller.getTimeSeriesData({
        linkId: 'test-link',
        dateRange: '7d',
      });

      expect(analyticsRateLimiter.checkLimit).toHaveBeenCalledWith('test-user');
    });

    it('should apply stricter rate limiting to export endpoint', async () => {
      const { exportRateLimiter } = await import('@/lib/rate-limiter');

      const caller = analyticsRouter.createCaller(mockContext as any);

      await caller.exportAnalytics({
        linkId: 'test-link',
        format: 'csv',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      });

      expect(exportRateLimiter.checkLimit).toHaveBeenCalledWith('test-user');
    });
  });
});