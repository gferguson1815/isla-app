import { useQuery } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/src/types/database';
import { aggregateClickMetrics, calculateClickRate, getTimeSeriesData } from '@/lib/analytics/aggregations';

interface UseAnalyticsOptions {
  linkId?: string;
  workspaceId?: string;
  timeRange?: number; // days
  enabled?: boolean;
}

export function useAnalytics({
  linkId,
  workspaceId,
  timeRange = 7,
  enabled = true,
}: UseAnalyticsOptions) {
  const supabase = createClientComponentClient<Database>();

  // Fetch click events
  const clicksQuery = useQuery({
    queryKey: ['analytics', 'clicks', linkId, workspaceId, timeRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      let query = supabase
        .from('click_events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });

      if (linkId) {
        query = query.eq('link_id', linkId);
      }

      if (workspaceId) {
        // Join with links table to filter by workspace
        query = supabase
          .from('click_events')
          .select(`
            *,
            links!inner (
              workspace_id
            )
          `)
          .eq('links.workspace_id', workspaceId)
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Calculate metrics
  const metricsQuery = useQuery({
    queryKey: ['analytics', 'metrics', linkId, workspaceId],
    queryFn: async () => {
      if (!clicksQuery.data) return null;

      return aggregateClickMetrics(clicksQuery.data);
    },
    enabled: enabled && !!clicksQuery.data,
    staleTime: 5 * 60 * 1000,
  });

  // Get time series data for charts
  const timeSeriesQuery = useQuery({
    queryKey: ['analytics', 'timeseries', linkId, workspaceId, timeRange],
    queryFn: async () => {
      if (!clicksQuery.data) return null;

      return getTimeSeriesData(clicksQuery.data, timeRange);
    },
    enabled: enabled && !!clicksQuery.data,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate click rate
  const clickRate = useQuery({
    queryKey: ['analytics', 'clickrate', linkId],
    queryFn: async () => {
      if (!linkId || !metricsQuery.data) return null;

      // Fetch link creation date
      const { data: link } = await supabase
        .from('links')
        .select('created_at')
        .eq('id', linkId)
        .single();

      if (!link) return null;

      return calculateClickRate(
        metricsQuery.data.totalClicks,
        new Date(link.created_at),
        new Date()
      );
    },
    enabled: enabled && !!linkId && !!metricsQuery.data,
    staleTime: 5 * 60 * 1000,
  });

  return {
    clicks: clicksQuery.data || [],
    metrics: metricsQuery.data,
    timeSeries: timeSeriesQuery.data,
    clickRate: clickRate.data,
    isLoading: clicksQuery.isLoading || metricsQuery.isLoading,
    error: clicksQuery.error || metricsQuery.error,
    refetch: () => {
      clicksQuery.refetch();
      metricsQuery.refetch();
      timeSeriesQuery.refetch();
      clickRate.refetch();
    },
  };
}