import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/src/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeClicksOptions {
  linkId?: string;
  workspaceId?: string;
  enabled?: boolean;
}

interface ClickEvent {
  id: string;
  link_id: string;
  timestamp: string;
  ip_hash: string;
  country?: string | null;
  city?: string | null;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  referrer?: string | null;
  user_agent: string;
}

export function useRealtimeClicks({
  linkId,
  workspaceId,
  enabled = true,
}: UseRealtimeClicksOptions) {
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient<Database>();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const handleNewClick = useCallback((payload: { new: ClickEvent }) => {
    try {
      const clickEvent = payload.new;

      if (!clickEvent || !clickEvent.link_id) {
        console.error('Invalid click event received:', payload);
        return;
      }

      // Update relevant query caches
      if (linkId && clickEvent.link_id === linkId) {
        queryClient.invalidateQueries({ queryKey: ['analytics', 'clicks', linkId] });
        queryClient.invalidateQueries({ queryKey: ['analytics', 'metrics', linkId] });
      }

      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['analytics', 'workspace', workspaceId] });
      }

      // Invalidate time series data
      queryClient.invalidateQueries({ queryKey: ['analytics', 'timeseries'] });
    } catch (error) {
      console.error('Error handling new click event:', error);
    }
  }, [linkId, workspaceId, queryClient]);

  const connect = useCallback(() => {
    if (!enabled || channelRef.current) return;

    const channel = supabase
      .channel('click-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'click_events',
          ...(linkId && { filter: `link_id=eq.${linkId}` }),
        },
        handleNewClick
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to realtime clicks');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log('Realtime connection lost, attempting reconnect...');
          reconnectTimeoutRef.current = setTimeout(() => {
            channelRef.current = null;
            connect();
          }, 5000);
        }
      });

    channelRef.current = channel;
  }, [enabled, linkId, supabase, handleNewClick]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [supabase]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: channelRef.current !== null,
    reconnect: () => {
      disconnect();
      connect();
    },
  };
}