import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeClicks } from '../useRealtimeClicks';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(),
}));

describe('useRealtimeClicks', () => {
  let mockSupabase: any;
  let mockChannel: any;
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        // Simulate successful subscription
        setTimeout(() => callback('SUBSCRIBED'), 0);
        return mockChannel;
      }),
    };

    mockSupabase = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
    };

    (createClientComponentClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should establish realtime connection when enabled', async () => {
    const { result } = renderHook(
      () => useRealtimeClicks({ linkId: 'link-1', enabled: true }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith('click-events');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'click_events',
          filter: 'link_id=eq.link-1',
        }),
        expect.any(Function)
      );
    });
  });

  it('should not establish connection when disabled', () => {
    renderHook(
      () => useRealtimeClicks({ linkId: 'link-1', enabled: false }),
      { wrapper }
    );

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it('should handle new click events', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(
      () => useRealtimeClicks({ linkId: 'link-1', enabled: true }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalled();
    });

    // Get the handler function that was passed to channel.on
    const handler = mockChannel.on.mock.calls[0][2];

    // Simulate a new click event
    act(() => {
      handler({
        new: {
          id: 'click-1',
          link_id: 'link-1',
          timestamp: '2024-01-15T10:00:00Z',
          ip_hash: 'hash1',
          device: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
        },
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['analytics', 'clicks', 'link-1'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['analytics', 'metrics', 'link-1'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['analytics', 'timeseries'],
      });
    });
  });

  it('should clean up subscription on unmount', () => {
    const { unmount } = renderHook(
      () => useRealtimeClicks({ linkId: 'link-1', enabled: true }),
      { wrapper }
    );

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('should handle reconnection on connection loss', async () => {
    vi.useFakeTimers();

    try {
      const { result } = renderHook(
        () => useRealtimeClicks({ linkId: 'link-1', enabled: true }),
        { wrapper }
      );

      // Wait for initial connection
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Modify subscribe to simulate connection loss
      mockChannel.subscribe = vi.fn((callback) => {
        callback('CHANNEL_ERROR');
        return mockChannel;
      });

      // Clear previous calls
      mockSupabase.channel.mockClear();

      // Trigger reconnection and advance timers synchronously
      act(() => {
        if (result.current.reconnect) {
          result.current.reconnect();
        }
        vi.advanceTimersByTime(5000);
      });

      // Should attempt to reconnect
      expect(mockSupabase.channel).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  }, 10000);

  it('should filter by workspace when workspaceId is provided', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(
      () => useRealtimeClicks({ workspaceId: 'workspace-1', enabled: true }),
      { wrapper }
    );

    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalled();
    }, { timeout: 2000 });

    const handler = mockChannel.on.mock.calls[0][2];

    act(() => {
      handler({
        new: {
          id: 'click-1',
          link_id: 'link-1',
          timestamp: '2024-01-15T10:00:00Z',
          ip_hash: 'hash1',
        },
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['analytics', 'workspace', 'workspace-1'],
      });
    }, { timeout: 2000 });
  }, 10000);
});