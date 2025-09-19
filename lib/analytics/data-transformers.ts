import { startOfHour, startOfDay, format } from 'date-fns';

export interface TimeSeriesDataPoint {
  periodStart: string;
  totalClicks: number;
  uniqueVisitors: number;
}

export interface GeoDataPoint {
  country: string;
  countryCode: string;
  clicks: number;
  percentage: number;
}

export interface ReferrerDataPoint {
  referrer: string;
  referrerType: 'search' | 'social' | 'direct' | 'external' | null;
  count: number;
  percentage: number;
}

export interface DeviceBreakdown {
  mobile: number;
  desktop: number;
  tablet: number;
}

export function aggregateTimeSeriesData(
  data: TimeSeriesDataPoint[],
  granularity: 'hour' | 'day' | 'week'
): TimeSeriesDataPoint[] {
  const aggregated = new Map<string, { totalClicks: number; uniqueVisitors: number }>();

  data.forEach(point => {
    const date = new Date(point.periodStart);
    let key: string;

    switch (granularity) {
      case 'hour':
        key = format(startOfHour(date), 'yyyy-MM-dd HH:00');
        break;
      case 'day':
        key = format(startOfDay(date), 'yyyy-MM-dd');
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = format(weekStart, 'yyyy-MM-dd');
        break;
    }

    const existing = aggregated.get(key) || { totalClicks: 0, uniqueVisitors: 0 };
    aggregated.set(key, {
      totalClicks: existing.totalClicks + point.totalClicks,
      uniqueVisitors: existing.uniqueVisitors + point.uniqueVisitors,
    });
  });

  return Array.from(aggregated.entries())
    .map(([periodStart, metrics]) => ({
      periodStart,
      ...metrics,
    }))
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
}

export function fillMissingTimeSeriesData(
  data: TimeSeriesDataPoint[],
  startDate: Date,
  endDate: Date,
  granularity: 'hour' | 'day'
): TimeSeriesDataPoint[] {
  const filled: TimeSeriesDataPoint[] = [];
  const dataMap = new Map(data.map(d => [d.periodStart, d]));

  const current = new Date(startDate);
  while (current <= endDate) {
    const key = format(current, granularity === 'hour' ? "yyyy-MM-dd'T'HH:00:00" : 'yyyy-MM-dd');

    filled.push(
      dataMap.get(key) || {
        periodStart: key,
        totalClicks: 0,
        uniqueVisitors: 0,
      }
    );

    if (granularity === 'hour') {
      current.setHours(current.getHours() + 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
  }

  return filled;
}

export function calculatePercentages<T extends { count: number }>(
  data: T[]
): (T & { percentage: number })[] {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return data.map(item => ({
    ...item,
    percentage: total > 0 ? (item.count / total) * 100 : 0,
  }));
}

export function groupReferrersByType(
  referrers: ReferrerDataPoint[]
): Record<string, ReferrerDataPoint[]> {
  const grouped: Record<string, ReferrerDataPoint[]> = {
    search: [],
    social: [],
    direct: [],
    external: [],
    unknown: [],
  };

  referrers.forEach(referrer => {
    const type = referrer.referrerType || 'unknown';
    grouped[type].push(referrer);
  });

  return grouped;
}

export function getTopN<T>(items: T[], n: number, sortKey: keyof T): T[] {
  return [...items]
    .sort((a, b) => {
      const aVal = a[sortKey] as number;
      const bVal = b[sortKey] as number;
      return bVal - aVal;
    })
    .slice(0, n);
}

export function formatDeviceData(devices: DeviceBreakdown): Array<{ name: string; value: number }> {
  return Object.entries(devices).map(([device, count]) => ({
    name: device,
    value: count,
  }));
}

export function formatBrowserData(
  browsers: Record<string, number>,
  topN: number = 5
): Array<{ name: string; value: number }> {
  const sorted = Object.entries(browsers).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topN);
  const otherCount = sorted.slice(topN).reduce((sum, [, count]) => sum + count, 0);

  const result = top.map(([browser, count]) => ({
    name: browser,
    value: count,
  }));

  if (otherCount > 0) {
    result.push({ name: 'Other', value: otherCount });
  }

  return result;
}

export function calculateGrowthRate(
  current: number,
  previous: number
): { rate: number; isPositive: boolean } {
  if (previous === 0) {
    return { rate: current > 0 ? 100 : 0, isPositive: current > 0 };
  }

  const rate = ((current - previous) / previous) * 100;
  return { rate: Math.abs(rate), isPositive: rate >= 0 };
}