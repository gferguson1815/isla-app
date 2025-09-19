import { format, startOfDay, startOfHour, eachDayOfInterval, eachHourOfInterval } from 'date-fns';

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