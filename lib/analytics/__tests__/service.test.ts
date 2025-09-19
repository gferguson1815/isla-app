import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from '../service';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(),
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    (createClientComponentClient as any).mockReturnValue(mockSupabase);
    service = new AnalyticsService();
  });

  describe('getClicksByLink', () => {
    it('should fetch clicks for a specific link', async () => {
      const mockClicks = [
        {
          id: '1',
          link_id: 'link-1',
          timestamp: '2024-01-15T10:00:00Z',
          ip_hash: 'hash1',
          device: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
        },
      ];

      mockSupabase.limit.mockResolvedValue({
        data: mockClicks,
        error: null,
      });

      const result = await service.getClicksByLink('link-1', 7);

      expect(mockSupabase.from).toHaveBeenCalledWith('click_events');
      expect(mockSupabase.eq).toHaveBeenCalledWith('link_id', 'link-1');
      expect(result).toEqual(mockClicks);
    });

    it('should throw error if query fails', async () => {
      mockSupabase.limit.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(service.getClicksByLink('link-1')).rejects.toThrow('Database error');
    });
  });

  describe('getAggregatedMetrics', () => {
    it('should return aggregated metrics for a link', async () => {
      const mockClicks = [
        {
          id: '1',
          link_id: 'link-1',
          timestamp: '2024-01-15T10:00:00Z',
          ip_hash: 'hash1',
          device: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer: 'google.com',
          country: 'US',
        },
        {
          id: '2',
          link_id: 'link-1',
          timestamp: '2024-01-15T11:00:00Z',
          ip_hash: 'hash2',
          device: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          referrer: 'twitter.com',
          country: 'US',
        },
      ];

      mockSupabase.limit.mockResolvedValue({
        data: mockClicks,
        error: null,
      });

      const metrics = await service.getAggregatedMetrics('link-1');

      expect(metrics.totalClicks).toBe(2);
      expect(metrics.uniqueClicks).toBe(2);
      expect(metrics.deviceBreakdown.desktop).toBe(1);
      expect(metrics.deviceBreakdown.mobile).toBe(1);
      expect(metrics.browserBreakdown['Chrome']).toBe(1);
      expect(metrics.browserBreakdown['Safari']).toBe(1);
    });
  });

  describe('getLinkClickRate', () => {
    it('should calculate click rate for a link', async () => {
      const mockLink = {
        created_at: '2024-01-01T00:00:00Z',
        click_count: 100,
      };

      mockSupabase.single.mockResolvedValue({
        data: mockLink,
        error: null,
      });

      const clickRate = await service.getLinkClickRate('link-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('links');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'link-1');
      expect(clickRate).toHaveProperty('rate');
      expect(clickRate).toHaveProperty('period');
    });

    it('should throw error if link not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Link not found'),
      });

      await expect(service.getLinkClickRate('link-1')).rejects.toThrow('Link not found');
    });
  });

  describe('getTopLinks', () => {
    it('should return top links by click count', async () => {
      const mockLinks = [
        { id: '1', slug: 'link1', title: 'Link 1', url: 'https://example.com', click_count: 100 },
        { id: '2', slug: 'link2', title: 'Link 2', url: 'https://test.com', click_count: 50 },
      ];

      mockSupabase.limit.mockResolvedValue({
        data: mockLinks,
        error: null,
      });

      const result = await service.getTopLinks('workspace-1', 10);

      expect(mockSupabase.from).toHaveBeenCalledWith('links');
      expect(mockSupabase.eq).toHaveBeenCalledWith('workspace_id', 'workspace-1');
      expect(mockSupabase.order).toHaveBeenCalledWith('click_count', { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockLinks);
    });
  });
});