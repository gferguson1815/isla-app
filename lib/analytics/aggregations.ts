import { format, startOfDay, startOfHour, startOfWeek, startOfMonth, subHours, eachDayOfInterval, eachHourOfInterval } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

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
}

export interface ClickMetrics {
  totalClicks: number;
  uniqueClicks: number;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  topReferrers: Array<{ referrer: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  clicks: number;
  uniqueClicks: number;
}

export function aggregateClickMetrics(events: ClickEvent[]): ClickMetrics {
  const uniqueIps = new Set<string>();
  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  const browserCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};
  const referrerCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};

  events.forEach((event) => {
    uniqueIps.add(event.ip_hash);

    // Count devices
    deviceCounts[event.device]++;

    // Count browsers
    browserCounts[event.browser] = (browserCounts[event.browser] || 0) + 1;

    // Count OS
    osCounts[event.os] = (osCounts[event.os] || 0) + 1;

    // Count referrers
    if (event.referrer) {
      referrerCounts[event.referrer] = (referrerCounts[event.referrer] || 0) + 1;
    }

    // Count countries
    if (event.country) {
      countryCounts[event.country] = (countryCounts[event.country] || 0) + 1;
    }
  });

  // Get top referrers
  const topReferrers = Object.entries(referrerCounts)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get top countries
  const topCountries = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalClicks: events.length,
    uniqueClicks: uniqueIps.size,
    deviceBreakdown: deviceCounts,
    browserBreakdown: browserCounts,
    osBreakdown: osCounts,
    topReferrers,
    topCountries,
  };
}

export function getTimeSeriesData(
  events: ClickEvent[],
  days: number
): TimeSeriesDataPoint[] {
  if (!events.length) return [];

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Determine granularity based on time range
  const useHourly = days <= 2;

  const intervals = useHourly
    ? eachHourOfInterval({ start: startDate, end: now })
    : eachDayOfInterval({ start: startDate, end: now });

  const dataMap = new Map<string, { clicks: number; uniqueIps: Set<string> }>();

  // Initialize all intervals with zero values
  intervals.forEach((interval) => {
    const key = useHourly
      ? format(interval, 'yyyy-MM-dd HH:00')
      : format(interval, 'yyyy-MM-dd');
    dataMap.set(key, { clicks: 0, uniqueIps: new Set() });
  });

  // Aggregate events
  events.forEach((event) => {
    const eventDate = new Date(event.timestamp);
    const key = useHourly
      ? format(startOfHour(eventDate), 'yyyy-MM-dd HH:00')
      : format(startOfDay(eventDate), 'yyyy-MM-dd');

    const data = dataMap.get(key);
    if (data) {
      data.clicks++;
      data.uniqueIps.add(event.ip_hash);
    }
  });

  // Convert to array
  return Array.from(dataMap.entries()).map(([timestamp, data]) => ({
    timestamp,
    clicks: data.clicks,
    uniqueClicks: data.uniqueIps.size,
  }));
}

export function calculateClickRate(
  totalClicks: number,
  startDate: Date,
  endDate: Date
): { rate: number; period: string } {
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const days = hours / 24;

  if (days < 1) {
    return {
      rate: totalClicks / Math.max(hours, 1),
      period: 'per hour',
    };
  } else if (days < 30) {
    return {
      rate: totalClicks / days,
      period: 'per day',
    };
  } else {
    return {
      rate: (totalClicks / days) * 30,
      period: 'per month',
    };
  }
}

// Enhanced aggregation functions for Story 3.1

export type AggregationPeriod = 'hour' | 'day' | 'week' | 'month';

interface EnhancedAggregationData {
  linkId: string;
  period: AggregationPeriod;
  periodStart: Date;
  totalClicks: number;
  uniqueVisitors: number;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  referrerTypeBreakdown: Record<string, number>;
}

/**
 * Get the start of a period based on the aggregation type
 */
export function getPeriodStart(date: Date, period: AggregationPeriod): Date {
  switch (period) {
    case 'hour':
      return startOfHour(date);
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case 'month':
      return startOfMonth(date);
    default:
      throw new Error(`Invalid period: ${period}`);
  }
}

/**
 * Process aggregations for all links in a time range
 */
export async function processAggregations(
  period: AggregationPeriod,
  startDate: Date,
  endDate: Date
): Promise<{ processed: number; errors: string[] }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const errors: string[] = [];
  let processed = 0;

  // Get all links that have click events in the period
  const { data: links, error: linksError } = await supabase
    .from('click_events')
    .select('linkId')
    .gte('timestamp', startDate.toISOString())
    .lt('timestamp', endDate.toISOString());

  if (linksError) {
    throw new Error(`Failed to fetch links: ${linksError.message}`);
  }

  if (!links || links.length === 0) {
    return { processed: 0, errors: [] };
  }

  // Get unique link IDs
  const uniqueLinkIds = [...new Set(links.map(l => l.linkId))];

  // Process each link
  for (const linkId of uniqueLinkIds) {
    try {
      const aggregation = await aggregateEnhancedClickEvents(linkId, period, startDate, endDate);
      await saveEnhancedAggregation(aggregation);
      processed++;
    } catch (error) {
      const errorMsg = `Failed to process link ${linkId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  return { processed, errors };
}

/**
 * Aggregate click events with enhanced data for a specific link and period
 */
async function aggregateEnhancedClickEvents(
  linkId: string,
  period: AggregationPeriod,
  startDate: Date,
  endDate: Date
): Promise<EnhancedAggregationData> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch click events for the period
  const { data: clickEvents, error } = await supabase
    .from('click_events')
    .select('*')
    .eq('linkId', linkId)
    .gte('timestamp', startDate.toISOString())
    .lt('timestamp', endDate.toISOString());

  if (error) {
    throw new Error(`Failed to fetch click events: ${error.message}`);
  }

  if (!clickEvents || clickEvents.length === 0) {
    return {
      linkId,
      period,
      periodStart: getPeriodStart(startDate, period),
      totalClicks: 0,
      uniqueVisitors: 0,
      deviceBreakdown: {},
      browserBreakdown: {},
      osBreakdown: {},
      countryBreakdown: {},
      referrerTypeBreakdown: {},
    };
  }

  // Calculate aggregations
  const uniqueIPs = new Set<string>();
  const deviceBreakdown: Record<string, number> = {};
  const browserBreakdown: Record<string, number> = {};
  const osBreakdown: Record<string, number> = {};
  const countryBreakdown: Record<string, number> = {};
  const referrerTypeBreakdown: Record<string, number> = {};

  for (const event of clickEvents) {
    // Count unique visitors by hashed IP
    if (event.ipAddress) {
      uniqueIPs.add(event.ipAddress);
    }

    // Device breakdown
    if (event.device) {
      deviceBreakdown[event.device] = (deviceBreakdown[event.device] || 0) + 1;
    }

    // Browser breakdown (include version if available)
    if (event.browser) {
      const browserKey = event.browserVersion
        ? `${event.browser} ${event.browserVersion.split('.')[0]}`
        : event.browser;
      browserBreakdown[browserKey] = (browserBreakdown[browserKey] || 0) + 1;
    }

    // OS breakdown (include version if available)
    if (event.os) {
      const osKey = event.osVersion
        ? `${event.os} ${event.osVersion}`
        : event.os;
      osBreakdown[osKey] = (osBreakdown[osKey] || 0) + 1;
    }

    // Country breakdown
    if (event.country) {
      countryBreakdown[event.country] = (countryBreakdown[event.country] || 0) + 1;
    }

    // Referrer type breakdown
    if (event.referrerType) {
      referrerTypeBreakdown[event.referrerType] = (referrerTypeBreakdown[event.referrerType] || 0) + 1;
    } else {
      // Count as direct if no referrer type
      referrerTypeBreakdown['direct'] = (referrerTypeBreakdown['direct'] || 0) + 1;
    }
  }

  return {
    linkId,
    period,
    periodStart: getPeriodStart(startDate, period),
    totalClicks: clickEvents.length,
    uniqueVisitors: uniqueIPs.size,
    deviceBreakdown,
    browserBreakdown,
    osBreakdown,
    countryBreakdown,
    referrerTypeBreakdown,
  };
}

/**
 * Save enhanced aggregation data to the database (upsert)
 */
async function saveEnhancedAggregation(data: EnhancedAggregationData): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('analytics_aggregates')
    .upsert({
      link_id: data.linkId,
      period: data.period,
      period_start: data.periodStart.toISOString(),
      total_clicks: data.totalClicks,
      unique_visitors: data.uniqueVisitors,
      device_breakdown: data.deviceBreakdown,
      browser_breakdown: data.browserBreakdown,
      os_breakdown: data.osBreakdown,
      country_breakdown: data.countryBreakdown,
      referrer_type_breakdown: data.referrerTypeBreakdown,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'link_id,period,period_start',
    });

  if (error) {
    throw new Error(`Failed to save aggregation: ${error.message}`);
  }
}

/**
 * Run hourly aggregation (called by cron job)
 */
export async function runHourlyAggregation(): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}> {
  try {
    const now = new Date();
    // Process last 2 hours for overlap/reliability
    const startDate = subHours(startOfHour(now), 2);
    const endDate = startOfHour(now);

    // Process hourly aggregations
    const hourlyResult = await processAggregations('hour', startDate, endDate);

    // Also update daily aggregation for today
    const dailyStart = startOfDay(now);
    const dailyEnd = new Date(now);
    const dailyResult = await processAggregations('day', dailyStart, dailyEnd);

    return {
      success: true,
      message: 'Aggregations completed successfully',
      details: {
        hourly: hourlyResult,
        daily: dailyResult,
        processedAt: now.toISOString(),
      },
    };
  } catch (error) {
    console.error('Aggregation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clean up old raw click events (data retention)
 */
export async function cleanupOldClickEvents(retentionDays: number = 90): Promise<{
  success: boolean;
  deleted: number;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data, error } = await supabase
    .from('click_events')
    .delete()
    .lt('timestamp', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('Cleanup error:', error);
    return { success: false, deleted: 0 };
  }

  return {
    success: true,
    deleted: data?.length || 0,
  };
}