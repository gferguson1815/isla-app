import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAnalytics } from '../useAnalytics';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(),
}));

vi.mock('@/lib/analytics/aggregations', () => ({
  aggregateClickMetrics: vi.fn((events) => ({
    totalClicks: events.length,
    uniqueClicks: new Set(events.map((e: any) => e.ip_hash)).size,
    deviceBreakdown: { desktop: 1, mobile: 0, tablet: 0 },
    browserBreakdown: { Chrome: 1 },
    osBreakdown: { Windows: 1 },
    topReferrers: [],
    topCountries: [],
  })),
  getTimeSeriesData: vi.fn((events, days) => [
    { timestamp: '2024-01-14', clicks: 1, uniqueClicks: 1 },
    { timestamp: '2024-01-15', clicks: 2, uniqueClicks: 2 },
  ]),
  calculateClickRate: vi.fn((totalClicks, startDate, endDate) => ({
    rate: 10,
    period: 'per day',
  })),
}));

describe('useAnalytics', () => {
  let mockSupabase: any;
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };

    (createClientComponentClient as any).mockReturnValue(mockSupabase);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch click events for a link', async () => {
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

    mockSupabase.order.mockResolvedValue({
      data: mockClicks,
      error: null,
    });

    const { result } = renderHook(
      () => useAnalytics({ linkId: 'link-1', timeRange: 7 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.clicks).toEqual(mockClicks);
    expect(mockSupabase.from).toHaveBeenCalledWith('click_events');
    expect(mockSupabase.eq).toHaveBeenCalledWith('link_id', 'link-1');
  });

  it('should calculate metrics from click events', async () => {
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
      {
        id: '2',
        link_id: 'link-1',
        timestamp: '2024-01-15T11:00:00Z',
        ip_hash: 'hash2',
        device: 'mobile',
        browser: 'Safari',
        os: 'iOS',
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockClicks,
      error: null,
    });

    const { result } = renderHook(
      () => useAnalytics({ linkId: 'link-1' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.metrics).toBeDefined();
    });

    expect(result.current.metrics?.totalClicks).toBe(2);
    expect(result.current.metrics?.uniqueClicks).toBe(2);
  });

  it('should generate time series data', async () => {
    const mockClicks = [
      {
        id: '1',
        link_id: 'link-1',
        timestamp: '2024-01-14T10:00:00Z',
        ip_hash: 'hash1',
      },
      {
        id: '2',
        link_id: 'link-1',
        timestamp: '2024-01-15T10:00:00Z',
        ip_hash: 'hash2',
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockClicks,
      error: null,
    });

    const { result } = renderHook(
      () => useAnalytics({ linkId: 'link-1', timeRange: 7 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.timeSeries).toBeDefined();
    });

    expect(result.current.timeSeries).toHaveLength(2);
    expect(result.current.timeSeries?.[0].timestamp).toBe('2024-01-14');
  });

  it('should calculate click rate for a link', async () => {
    const mockClicks = [
      { id: '1', link_id: 'link-1', timestamp: '2024-01-15T10:00:00Z', ip_hash: 'hash1' },
    ];

    const mockLink = {
      created_at: '2024-01-01T00:00:00Z',
    };

    mockSupabase.order.mockResolvedValue({
      data: mockClicks,
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: mockLink,
      error: null,
    });

    const { result } = renderHook(
      () => useAnalytics({ linkId: 'link-1' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.clickRate).toBeDefined();
    });

    expect(result.current.clickRate?.rate).toBe(10);
    expect(result.current.clickRate?.period).toBe('per day');
  });

  it('should handle workspace-based queries', async () => {
    const mockClicks = [
      {
        id: '1',
        link_id: 'link-1',
        timestamp: '2024-01-15T10:00:00Z',
        ip_hash: 'hash1',
        links: { workspace_id: 'workspace-1' },
      },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockClicks,
      error: null,
    });

    const { result } = renderHook(
      () => useAnalytics({ workspaceId: 'workspace-1' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSupabase.eq).toHaveBeenCalledWith('links.workspace_id', 'workspace-1');
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Database error');
    mockSupabase.order.mockResolvedValue({
      data: null,
      error,
    });

    const { result } = renderHook(
      () => useAnalytics({ linkId: 'link-1' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.clicks).toEqual([]);
  });

  it('should respect enabled flag', () => {
    renderHook(
      () => useAnalytics({ linkId: 'link-1', enabled: false }),
      { wrapper }
    );

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should refetch all queries when refetch is called', async () => {
    const mockClicks = [
      { id: '1', link_id: 'link-1', timestamp: '2024-01-15T10:00:00Z', ip_hash: 'hash1' },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockClicks,
      error: null,
    });

    const { result } = renderHook(
      () => useAnalytics({ linkId: 'link-1' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockSupabase.from.mockClear();

    result.current.refetch();

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});