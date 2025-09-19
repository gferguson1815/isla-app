import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  aggregateClickMetrics,
  getTimeSeriesData,
  calculateClickRate,
} from '../aggregations';

describe('aggregateClickMetrics', () => {
  it('should aggregate click metrics correctly', () => {
    const events = [
      {
        id: '1',
        link_id: 'link-1',
        timestamp: '2024-01-15T10:00:00Z',
        ip_hash: 'hash1',
        device: 'desktop' as const,
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
        device: 'mobile' as const,
        browser: 'Safari',
        os: 'iOS',
        referrer: 'twitter.com',
        country: 'UK',
      },
      {
        id: '3',
        link_id: 'link-1',
        timestamp: '2024-01-15T12:00:00Z',
        ip_hash: 'hash1', // Same IP as first event
        device: 'desktop' as const,
        browser: 'Chrome',
        os: 'Windows',
        referrer: 'google.com',
        country: 'US',
      },
    ];

    const metrics = aggregateClickMetrics(events);

    expect(metrics.totalClicks).toBe(3);
    expect(metrics.uniqueClicks).toBe(2); // Only 2 unique IPs
    expect(metrics.deviceBreakdown.desktop).toBe(2);
    expect(metrics.deviceBreakdown.mobile).toBe(1);
    expect(metrics.deviceBreakdown.tablet).toBe(0);
    expect(metrics.browserBreakdown['Chrome']).toBe(2);
    expect(metrics.browserBreakdown['Safari']).toBe(1);
    expect(metrics.osBreakdown['Windows']).toBe(2);
    expect(metrics.osBreakdown['iOS']).toBe(1);
    expect(metrics.topReferrers).toHaveLength(2);
    expect(metrics.topReferrers[0]).toEqual({ referrer: 'google.com', count: 2 });
    expect(metrics.topCountries).toHaveLength(2);
    expect(metrics.topCountries[0]).toEqual({ country: 'US', count: 2 });
  });

  it('should handle empty events array', () => {
    const metrics = aggregateClickMetrics([]);

    expect(metrics.totalClicks).toBe(0);
    expect(metrics.uniqueClicks).toBe(0);
    expect(metrics.deviceBreakdown.desktop).toBe(0);
    expect(metrics.deviceBreakdown.mobile).toBe(0);
    expect(metrics.deviceBreakdown.tablet).toBe(0);
    expect(metrics.topReferrers).toEqual([]);
    expect(metrics.topCountries).toEqual([]);
  });

  it('should handle events without optional fields', () => {
    const events = [
      {
        id: '1',
        link_id: 'link-1',
        timestamp: '2024-01-15T10:00:00Z',
        ip_hash: 'hash1',
        device: 'desktop' as const,
        browser: 'Chrome',
        os: 'Windows',
        referrer: null,
        country: null,
      },
    ];

    const metrics = aggregateClickMetrics(events);

    expect(metrics.totalClicks).toBe(1);
    expect(metrics.topReferrers).toEqual([]);
    expect(metrics.topCountries).toEqual([]);
  });
});

describe('getTimeSeriesData', () => {
  it('should generate daily time series for 7 days', () => {
    const now = new Date('2024-01-15T15:00:00Z');
    const events = [
      {
        id: '1',
        link_id: 'link-1',
        timestamp: '2024-01-14T10:00:00Z',
        ip_hash: 'hash1',
        device: 'desktop' as const,
        browser: 'Chrome',
        os: 'Windows',
      },
      {
        id: '2',
        link_id: 'link-1',
        timestamp: '2024-01-14T11:00:00Z',
        ip_hash: 'hash2',
        device: 'mobile' as const,
        browser: 'Safari',
        os: 'iOS',
      },
      {
        id: '3',
        link_id: 'link-1',
        timestamp: '2024-01-15T10:00:00Z',
        ip_hash: 'hash1',
        device: 'desktop' as const,
        browser: 'Chrome',
        os: 'Windows',
      },
    ];

    const timeSeries = getTimeSeriesData(events, 7);

    expect(timeSeries.length).toBeGreaterThan(0);
    const jan14Data = timeSeries.find(d => d.timestamp === '2024-01-14');
    const jan15Data = timeSeries.find(d => d.timestamp === '2024-01-15');

    if (jan14Data) {
      expect(jan14Data.clicks).toBe(2);
      expect(jan14Data.uniqueClicks).toBe(2);
    }

    if (jan15Data) {
      expect(jan15Data.clicks).toBe(1);
      expect(jan15Data.uniqueClicks).toBe(1);
    }
  });

  it('should generate hourly time series for 2 days', () => {
    // Mock current date to ensure consistent test results
    const mockNow = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(mockNow);

    const events = [
      {
        id: '1',
        link_id: 'link-1',
        timestamp: '2024-01-15T10:00:00Z',
        ip_hash: 'hash1',
        device: 'desktop' as const,
        browser: 'Chrome',
        os: 'Windows',
      },
      {
        id: '2',
        link_id: 'link-1',
        timestamp: '2024-01-15T10:30:00Z',
        ip_hash: 'hash2',
        device: 'mobile' as const,
        browser: 'Safari',
        os: 'iOS',
      },
      {
        id: '3',
        link_id: 'link-1',
        timestamp: '2024-01-15T11:00:00Z',
        ip_hash: 'hash3',
        device: 'desktop' as const,
        browser: 'Firefox',
        os: 'Linux',
      },
    ];

    const timeSeries = getTimeSeriesData(events, 2);

    expect(timeSeries.length).toBeGreaterThan(0);
    const hour10Data = timeSeries.find(d => d.timestamp === '2024-01-15 10:00');
    const hour11Data = timeSeries.find(d => d.timestamp === '2024-01-15 11:00');

    expect(hour10Data).toBeDefined();
    expect(hour11Data).toBeDefined();

    if (hour10Data) {
      expect(hour10Data.clicks).toBe(2);
      expect(hour10Data.uniqueClicks).toBe(2);
    }

    if (hour11Data) {
      expect(hour11Data.clicks).toBe(1);
      expect(hour11Data.uniqueClicks).toBe(1);
    }

    vi.restoreAllMocks();
  });

  it('should return empty array for no events', () => {
    const timeSeries = getTimeSeriesData([], 7);
    expect(timeSeries).toEqual([]);
  });
});

describe('calculateClickRate', () => {
  it('should calculate hourly rate for recent links', () => {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 5);
    const endDate = new Date();

    const result = calculateClickRate(10, startDate, endDate);

    expect(result.rate).toBe(2); // 10 clicks / 5 hours
    expect(result.period).toBe('per hour');
  });

  it('should calculate daily rate for week-old links', () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const result = calculateClickRate(70, startDate, endDate);

    expect(result.rate).toBe(10); // 70 clicks / 7 days
    expect(result.period).toBe('per day');
  });

  it('should calculate monthly rate for old links', () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    const endDate = new Date();

    const result = calculateClickRate(120, startDate, endDate);

    expect(result.rate).toBe(60); // (120 clicks / 60 days) * 30
    expect(result.period).toBe('per month');
  });

  it('should handle zero clicks', () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const result = calculateClickRate(0, startDate, endDate);

    expect(result.rate).toBe(0);
    expect(result.period).toBe('per day');
  });
});