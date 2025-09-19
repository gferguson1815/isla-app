'use client';

import { useEffect, useMemo } from 'react';
import { trpc } from '@/app/providers/trpc-provider';
import { useQueryClient } from '@tanstack/react-query';

interface UseAnalyticsDataProps {
  linkId: string;
  dateRange: '24h' | '7d' | '30d' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export function useAnalyticsData({
  linkId,
  dateRange,
  startDate,
  endDate
}: UseAnalyticsDataProps) {
  const queryClient = useQueryClient();

  const timeSeriesQuery = trpc.analytics.getTimeSeriesData.useQuery(
    {
      linkId,
      dateRange,
      startDate,
      endDate
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000
    }
  );

  const geoQuery = trpc.analytics.getGeoData.useQuery(
    {
      linkId,
      dateRange: dateRange === '24h' ? '24h' : dateRange === '7d' ? '7d' : '30d'
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  );

  const referrerQuery = trpc.analytics.getReferrerData.useQuery(
    {
      linkId,
      page: 1,
      limit: 100
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  );

  const deviceBrowserQuery = trpc.analytics.getDeviceBrowserData.useQuery(
    {
      linkId,
      dateRange
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  );

  const clickEventsQuery = trpc.analytics.getClickEvents.useQuery(
    {
      linkId,
      limit: 500
    },
    {
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000
    }
  );

  useEffect(() => {
    const interval = setInterval(() => {
      // Only invalidate analytics queries for this specific link
      queryClient.invalidateQueries({
        queryKey: ['analytics', linkId]
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [queryClient, linkId]);

  const aggregateMetrics = useMemo(() => {
    if (!timeSeriesQuery.data) return null;

    const totalClicks = timeSeriesQuery.data.reduce(
      (sum, item) => sum + item.totalClicks,
      0
    );
    const uniqueVisitors = timeSeriesQuery.data.reduce(
      (sum, item) => sum + item.uniqueVisitors,
      0
    );
    const uniqueVisitorPercentage = totalClicks > 0 ? (uniqueVisitors / totalClicks) * 100 : 0;

    const topCountry = geoQuery.data?.[0]?.country || null;

    return {
      totalClicks,
      uniqueVisitors,
      uniqueVisitorPercentage,
      topCountry
    };
  }, [timeSeriesQuery.data, geoQuery.data]);

  const isLoading =
    timeSeriesQuery.isLoading ||
    geoQuery.isLoading ||
    referrerQuery.isLoading ||
    deviceBrowserQuery.isLoading ||
    clickEventsQuery.isLoading;

  const error =
    timeSeriesQuery.error ||
    geoQuery.error ||
    referrerQuery.error ||
    deviceBrowserQuery.error ||
    clickEventsQuery.error;

  return {
    timeSeriesData: timeSeriesQuery.data,
    geoData: geoQuery.data,
    referrerData: referrerQuery.data?.referrers,
    deviceData: deviceBrowserQuery.data?.devices,
    browserData: deviceBrowserQuery.data?.browsers,
    clickEvents: clickEventsQuery.data?.events,
    aggregateMetrics,
    isLoading,
    error,
    refetch: () => {
      timeSeriesQuery.refetch();
      geoQuery.refetch();
      referrerQuery.refetch();
      deviceBrowserQuery.refetch();
      clickEventsQuery.refetch();
    }
  };
}