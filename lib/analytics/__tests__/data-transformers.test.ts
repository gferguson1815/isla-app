import { describe, it, expect } from 'vitest';
import {
  aggregateTimeSeriesData,
  fillMissingTimeSeriesData,
  calculatePercentages,
  groupReferrersByType,
  getTopN,
  formatDeviceData,
  formatBrowserData,
  calculateGrowthRate,
} from '../data-transformers';

describe('data-transformers', () => {
  describe('aggregateTimeSeriesData', () => {
    it('aggregates hourly data correctly', () => {
      const data = [
        { periodStart: '2024-01-01T10:15:00', totalClicks: 10, uniqueVisitors: 5 },
        { periodStart: '2024-01-01T10:45:00', totalClicks: 15, uniqueVisitors: 8 },
        { periodStart: '2024-01-01T11:30:00', totalClicks: 20, uniqueVisitors: 10 },
      ];

      const result = aggregateTimeSeriesData(data, 'hour');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        periodStart: '2024-01-01 10:00',
        totalClicks: 25,
        uniqueVisitors: 13,
      });
      expect(result[1]).toEqual({
        periodStart: '2024-01-01 11:00',
        totalClicks: 20,
        uniqueVisitors: 10,
      });
    });

    it('aggregates daily data correctly', () => {
      const data = [
        { periodStart: '2024-01-01T10:00:00', totalClicks: 10, uniqueVisitors: 5 },
        { periodStart: '2024-01-01T15:00:00', totalClicks: 15, uniqueVisitors: 8 },
        { periodStart: '2024-01-02T09:00:00', totalClicks: 20, uniqueVisitors: 10 },
      ];

      const result = aggregateTimeSeriesData(data, 'day');

      expect(result).toHaveLength(2);
      expect(result[0].totalClicks).toBe(25);
      expect(result[1].totalClicks).toBe(20);
    });
  });

  describe('fillMissingTimeSeriesData', () => {
    it('fills missing hourly data points', () => {
      const data = [
        { periodStart: '2024-01-01T10:00:00', totalClicks: 10, uniqueVisitors: 5 },
        { periodStart: '2024-01-01T12:00:00', totalClicks: 20, uniqueVisitors: 10 },
      ];

      const startDate = new Date('2024-01-01T10:00:00');
      const endDate = new Date('2024-01-01T12:00:00');

      const result = fillMissingTimeSeriesData(data, startDate, endDate, 'hour');

      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        periodStart: '2024-01-01T11:00:00',
        totalClicks: 0,
        uniqueVisitors: 0,
      });
    });
  });

  describe('calculatePercentages', () => {
    it('calculates percentages correctly', () => {
      const data = [
        { name: 'A', count: 30 },
        { name: 'B', count: 20 },
        { name: 'C', count: 50 },
      ];

      const result = calculatePercentages(data);

      expect(result[0].percentage).toBe(30);
      expect(result[1].percentage).toBe(20);
      expect(result[2].percentage).toBe(50);
    });

    it('handles zero total', () => {
      const data = [
        { name: 'A', count: 0 },
        { name: 'B', count: 0 },
      ];

      const result = calculatePercentages(data);

      expect(result[0].percentage).toBe(0);
      expect(result[1].percentage).toBe(0);
    });
  });

  describe('groupReferrersByType', () => {
    it('groups referrers correctly', () => {
      const referrers = [
        { referrer: 'google.com', referrerType: 'search' as const, count: 100, percentage: 40 },
        { referrer: 'twitter.com', referrerType: 'social' as const, count: 50, percentage: 20 },
        { referrer: 'direct', referrerType: 'direct' as const, count: 80, percentage: 32 },
        { referrer: 'unknown.com', referrerType: null, count: 20, percentage: 8 },
      ];

      const result = groupReferrersByType(referrers);

      expect(result.search).toHaveLength(1);
      expect(result.social).toHaveLength(1);
      expect(result.direct).toHaveLength(1);
      expect(result.unknown).toHaveLength(1);
    });
  });

  describe('getTopN', () => {
    it('returns top N items sorted by key', () => {
      const items = [
        { name: 'A', value: 10 },
        { name: 'B', value: 30 },
        { name: 'C', value: 20 },
        { name: 'D', value: 40 },
        { name: 'E', value: 15 },
      ];

      const result = getTopN(items, 3, 'value');

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('D');
      expect(result[1].name).toBe('B');
      expect(result[2].name).toBe('C');
    });
  });

  describe('formatDeviceData', () => {
    it('formats device breakdown correctly', () => {
      const devices = {
        mobile: 100,
        desktop: 200,
        tablet: 50,
      };

      const result = formatDeviceData(devices);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ name: 'mobile', value: 100 });
      expect(result).toContainEqual({ name: 'desktop', value: 200 });
      expect(result).toContainEqual({ name: 'tablet', value: 50 });
    });
  });

  describe('formatBrowserData', () => {
    it('formats browser data with Other category', () => {
      const browsers = {
        Chrome: 500,
        Safari: 300,
        Firefox: 200,
        Edge: 100,
        Opera: 50,
        Brave: 30,
        Other1: 10,
        Other2: 5,
      };

      const result = formatBrowserData(browsers, 5);

      expect(result).toHaveLength(6);
      expect(result[result.length - 1]).toEqual({ name: 'Other', value: 45 });
    });

    it('handles browsers without Other category', () => {
      const browsers = {
        Chrome: 500,
        Safari: 300,
      };

      const result = formatBrowserData(browsers, 5);

      expect(result).toHaveLength(2);
      expect(result.find(b => b.name === 'Other')).toBeUndefined();
    });
  });

  describe('calculateGrowthRate', () => {
    it('calculates positive growth', () => {
      const result = calculateGrowthRate(150, 100);

      expect(result.rate).toBe(50);
      expect(result.isPositive).toBe(true);
    });

    it('calculates negative growth', () => {
      const result = calculateGrowthRate(80, 100);

      expect(result.rate).toBe(20);
      expect(result.isPositive).toBe(false);
    });

    it('handles zero previous value', () => {
      const result = calculateGrowthRate(100, 0);

      expect(result.rate).toBe(100);
      expect(result.isPositive).toBe(true);
    });

    it('handles both zero values', () => {
      const result = calculateGrowthRate(0, 0);

      expect(result.rate).toBe(0);
      expect(result.isPositive).toBe(false);
    });
  });
});