import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { createClient } from '@/lib/supabase/server';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { analyticsRateLimiter, exportRateLimiter } from '@/lib/rate-limiter';

// Helper function to verify user has access to link analytics
async function verifyLinkAccess(ctx: any, linkId: string) {
  const link = await ctx.prisma.link.findUnique({
    where: { id: linkId },
    select: { workspaceId: true },
  });

  if (!link) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Link not found',
    });
  }

  const membership = await ctx.prisma.workspaceMembership.findFirst({
    where: {
      workspaceId: link.workspaceId,
      userId: ctx.userId,
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to view analytics for this link',
    });
  }

  return link;
}

export const analyticsRouter = router({
  getTimeSeriesData: protectedProcedure
    .input(
      z.object({
        linkId: z.string(),
        dateRange: z.enum(['24h', '7d', '30d', 'custom']),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Apply rate limiting
      await analyticsRateLimiter.checkLimit(ctx.userId);

      // Verify user has access to this link's analytics
      await verifyLinkAccess(ctx, input.linkId);

      const supabase = createClient();

      const now = new Date();
      let startDate: Date;
      let endDate = now;
      let period: 'hour' | 'day';

      switch (input.dateRange) {
        case '24h':
          startDate = subDays(now, 1);
          period = 'hour';
          break;
        case '7d':
          startDate = subDays(now, 7);
          period = input.dateRange === '7d' ? 'hour' : 'day';
          break;
        case '30d':
          startDate = subDays(now, 30);
          period = 'day';
          break;
        case 'custom':
          if (!input.startDate || !input.endDate) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Start and end dates required for custom range',
            });
          }
          startDate = input.startDate;
          endDate = input.endDate;
          period = 'day';
          break;
      }

      const { data, error } = await supabase
        .from('analytics_aggregates')
        .select('period_start, total_clicks, unique_visitors')
        .eq('link_id', input.linkId)
        .eq('period', period)
        .gte('period_start', startDate.toISOString())
        .lte('period_start', endDate.toISOString())
        .order('period_start', { ascending: true });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch time series data',
        });
      }

      return data.map(item => ({
        periodStart: item.period_start,
        totalClicks: item.total_clicks,
        uniqueVisitors: item.unique_visitors,
      }));
    }),

  getGeoData: protectedProcedure
    .input(
      z.object({
        linkId: z.string(),
        dateRange: z.enum(['24h', '7d', '30d', 'all']),
      })
    )
    .query(async ({ ctx, input }) => {
      // Apply rate limiting
      await analyticsRateLimiter.checkLimit(ctx.userId);

      // Verify user has access to this link's analytics
      await verifyLinkAccess(ctx, input.linkId);

      const supabase = createClient();

      const now = new Date();
      let startDate: Date | null = null;

      if (input.dateRange !== 'all') {
        const days = input.dateRange === '24h' ? 1 : input.dateRange === '7d' ? 7 : 30;
        startDate = subDays(now, days);
      }

      const query = supabase
        .from('click_events')
        .select('country')
        .eq('link_id', input.linkId)
        .not('country', 'is', null);

      if (startDate) {
        query.gte('timestamp', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch geographic data',
        });
      }

      const countryCounts = data.reduce((acc, item) => {
        const country = item.country as string;
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(countryCounts).reduce((sum, count) => sum + count, 0);

      const countryCodeMap: Record<string, string> = {
        'United States': 'US',
        'Canada': 'CA',
        'United Kingdom': 'GB',
        'Germany': 'DE',
        'France': 'FR',
        'Spain': 'ES',
        'Italy': 'IT',
        'Brazil': 'BR',
        'India': 'IN',
        'China': 'CN',
        'Japan': 'JP',
        'Australia': 'AU',
        'Russia': 'RU',
        'South Africa': 'ZA',
        'Mexico': 'MX',
        'South Korea': 'KR',
      };

      return Object.entries(countryCounts)
        .map(([country, clicks]) => ({
          country,
          countryCode: countryCodeMap[country] || country.slice(0, 2).toUpperCase(),
          clicks,
          percentage: (clicks / total) * 100,
        }))
        .sort((a, b) => b.clicks - a.clicks);
    }),

  getReferrerData: protectedProcedure
    .input(
      z.object({
        linkId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // Apply rate limiting
      await analyticsRateLimiter.checkLimit(ctx.userId);

      // Verify user has access to this link's analytics
      await verifyLinkAccess(ctx, input.linkId);

      const supabase = createClient();

      const { data, error } = await supabase
        .from('click_events')
        .select('referrer, referrer_type')
        .eq('link_id', input.linkId);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch referrer data',
        });
      }

      const referrerCounts = data.reduce((acc, item) => {
        const referrer = item.referrer || 'direct';
        if (!acc[referrer]) {
          acc[referrer] = {
            referrer,
            referrerType: item.referrer_type,
            count: 0,
          };
        }
        acc[referrer].count++;
        return acc;
      }, {} as Record<string, { referrer: string; referrerType: any; count: number }>);

      const total = Object.values(referrerCounts).reduce((sum, item) => sum + item.count, 0);

      const sortedReferrers = Object.values(referrerCounts)
        .map(item => ({
          ...item,
          percentage: (item.count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      const start = (input.page - 1) * input.limit;
      const end = start + input.limit;

      return {
        referrers: sortedReferrers.slice(start, end),
        total: sortedReferrers.length,
        page: input.page,
        limit: input.limit,
      };
    }),

  getDeviceBrowserData: protectedProcedure
    .input(
      z.object({
        linkId: z.string(),
        dateRange: z.enum(['24h', '7d', '30d', 'custom']),
      })
    )
    .query(async ({ ctx, input }) => {
      // Apply rate limiting
      await analyticsRateLimiter.checkLimit(ctx.userId);

      // Verify user has access to this link's analytics
      await verifyLinkAccess(ctx, input.linkId);

      const supabase = createClient();

      const now = new Date();
      let startDate: Date | null = null;

      if (input.dateRange !== 'custom') {
        const days = input.dateRange === '24h' ? 1 : input.dateRange === '7d' ? 7 : 30;
        startDate = subDays(now, days);
      }

      const query = supabase
        .from('click_events')
        .select('device, browser')
        .eq('link_id', input.linkId);

      if (startDate) {
        query.gte('timestamp', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch device and browser data',
        });
      }

      const devices = {
        mobile: 0,
        desktop: 0,
        tablet: 0,
      };

      const browsers: Record<string, number> = {};

      data.forEach(item => {
        devices[item.device as keyof typeof devices]++;
        browsers[item.browser] = (browsers[item.browser] || 0) + 1;
      });

      return {
        devices,
        browsers,
      };
    }),

  getClickEvents: protectedProcedure
    .input(
      z.object({
        linkId: z.string(),
        filters: z
          .object({
            device: z.enum(['mobile', 'desktop', 'tablet']).optional(),
            browser: z.string().optional(),
            country: z.string().optional(),
          })
          .optional(),
        cursor: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Apply rate limiting
      await analyticsRateLimiter.checkLimit(ctx.userId);

      // Verify user has access to this link's analytics
      await verifyLinkAccess(ctx, input.linkId);

      const supabase = createClient();

      let query = supabase
        .from('click_events')
        .select('*')
        .eq('link_id', input.linkId)
        .order('timestamp', { ascending: false })
        .limit(input.limit);

      if (input.filters?.device) {
        query = query.eq('device', input.filters.device);
      }

      if (input.filters?.browser) {
        query = query.eq('browser', input.filters.browser);
      }

      if (input.filters?.country) {
        query = query.eq('country', input.filters.country);
      }

      if (input.cursor) {
        query = query.lt('timestamp', input.cursor);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch click events',
        });
      }

      return {
        events: data.map(event => ({
          id: event.id,
          linkId: event.link_id,
          timestamp: event.timestamp,
          country: event.country,
          city: event.city,
          region: event.region,
          device: event.device,
          browser: event.browser,
          browserVersion: event.browser_version,
          os: event.os,
          osVersion: event.os_version,
          referrer: event.referrer,
          referrerType: event.referrer_type,
          utmSource: event.utm_source,
          utmMedium: event.utm_medium,
          utmCampaign: event.utm_campaign,
        })),
        nextCursor: data.length === input.limit ? data[data.length - 1].timestamp : null,
      };
    }),

  exportAnalytics: protectedProcedure
    .input(
      z.object({
        linkId: z.string(),
        format: z.enum(['csv', 'json']),
        dateRange: z.object({
          start: z.date(),
          end: z.date(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Apply stricter rate limiting for exports
      await exportRateLimiter.checkLimit(ctx.userId);

      // Verify user has access to this link's analytics
      await verifyLinkAccess(ctx, input.linkId);

      const supabase = createClient();

      const { data, error } = await supabase
        .from('click_events')
        .select('*')
        .eq('link_id', input.linkId)
        .gte('timestamp', input.dateRange.start.toISOString())
        .lte('timestamp', input.dateRange.end.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export analytics',
        });
      }

      if (input.format === 'json') {
        return {
          json: JSON.stringify(data, null, 2),
        };
      }

      const headers = [
        'Timestamp',
        'Country',
        'City',
        'Region',
        'Device',
        'Browser',
        'Browser Version',
        'OS',
        'OS Version',
        'Referrer',
        'Referrer Type',
        'UTM Source',
        'UTM Medium',
        'UTM Campaign',
      ];

      const csvRows = [
        headers.join(','),
        ...data.map(event =>
          [
            format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss'),
            event.country || '',
            event.city || '',
            event.region || '',
            event.device,
            event.browser,
            event.browser_version || '',
            event.os,
            event.os_version || '',
            event.referrer || '',
            event.referrer_type || '',
            event.utm_source || '',
            event.utm_medium || '',
            event.utm_campaign || '',
          ]
            .map(field => `"${String(field).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ];

      return {
        csv: csvRows.join('\n'),
      };
    }),
});