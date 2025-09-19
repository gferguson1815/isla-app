import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  extractGeoLocation,
  getCountryName,
  isPrivateIP,
  shouldBlockGeoTracking,
  getTimezoneFromGeo,
  getGeoLocationFromIP
} from '../geo-location';

describe('extractGeoLocation', () => {
  it('should extract geo-location from Vercel headers', () => {
    const headers = new Headers({
      'x-vercel-ip-country': 'US',
      'x-vercel-ip-country-region': 'CA',
      'x-vercel-ip-city': 'San%20Francisco',
      'x-vercel-ip-latitude': '37.7749',
      'x-vercel-ip-longitude': '-122.4194',
    });

    const request = new NextRequest('https://example.com', { headers });
    const geo = extractGeoLocation(request);

    expect(geo).toEqual({
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
    });
  });

  it('should handle missing headers gracefully', () => {
    const request = new NextRequest('https://example.com');
    const geo = extractGeoLocation(request);

    expect(geo).toEqual({
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  });

  it('should filter out XX (unknown) values', () => {
    const headers = new Headers({
      'x-vercel-ip-country': 'XX',
      'x-vercel-ip-country-region': 'XX',
      'x-vercel-ip-city': 'XX',
    });

    const request = new NextRequest('https://example.com', { headers });
    const geo = extractGeoLocation(request);

    expect(geo).toEqual({
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  });

  it('should decode URL-encoded city names', () => {
    const headers = new Headers({
      'x-vercel-ip-country': 'FR',
      'x-vercel-ip-city': 'Chalon-sur-Sa%C3%B4ne',
    });

    const request = new NextRequest('https://example.com', { headers });
    const geo = extractGeoLocation(request);

    expect(geo.city).toBe('Chalon-sur-Saône');
  });
});

describe('getCountryName', () => {
  it('should return full country names for common codes', () => {
    expect(getCountryName('US')).toBe('United States');
    expect(getCountryName('GB')).toBe('United Kingdom');
    expect(getCountryName('DE')).toBe('Germany');
    expect(getCountryName('FR')).toBe('France');
    expect(getCountryName('JP')).toBe('Japan');
    expect(getCountryName('CN')).toBe('China');
    expect(getCountryName('AU')).toBe('Australia');
    expect(getCountryName('CA')).toBe('Canada');
  });

  it('should handle lowercase country codes', () => {
    expect(getCountryName('us')).toBe('United States');
    expect(getCountryName('gb')).toBe('United Kingdom');
  });

  it('should return the code itself for unknown countries', () => {
    expect(getCountryName('XY')).toBe('XY');
    expect(getCountryName('ZZ')).toBe('ZZ');
  });

  it('should handle null input', () => {
    expect(getCountryName(null)).toBe(null);
  });
});

describe('isPrivateIP', () => {
  it('should identify loopback addresses', () => {
    expect(isPrivateIP('127.0.0.1')).toBe(true);
    expect(isPrivateIP('127.0.0.100')).toBe(true);
    expect(isPrivateIP('::1')).toBe(true);
  });

  it('should identify private network addresses', () => {
    expect(isPrivateIP('10.0.0.1')).toBe(true);
    expect(isPrivateIP('10.255.255.255')).toBe(true);
    expect(isPrivateIP('172.16.0.1')).toBe(true);
    expect(isPrivateIP('172.31.255.255')).toBe(true);
    expect(isPrivateIP('192.168.0.1')).toBe(true);
    expect(isPrivateIP('192.168.255.255')).toBe(true);
  });

  it('should identify link-local addresses', () => {
    expect(isPrivateIP('169.254.0.1')).toBe(true);
    expect(isPrivateIP('169.254.255.255')).toBe(true);
    expect(isPrivateIP('fe80::1')).toBe(true);
  });

  it('should not identify public IPs as private', () => {
    expect(isPrivateIP('8.8.8.8')).toBe(false);
    expect(isPrivateIP('1.1.1.1')).toBe(false);
    expect(isPrivateIP('172.15.0.1')).toBe(false); // Outside private range
    expect(isPrivateIP('172.32.0.1')).toBe(false); // Outside private range
  });
});

describe('shouldBlockGeoTracking', () => {
  it('should block when Do Not Track is enabled', () => {
    expect(shouldBlockGeoTracking('US', true)).toBe(true);
    expect(shouldBlockGeoTracking('GB', true)).toBe(true);
    expect(shouldBlockGeoTracking(null, true)).toBe(true);
  });

  it('should not block when Do Not Track is disabled', () => {
    expect(shouldBlockGeoTracking('US', false)).toBe(false);
    expect(shouldBlockGeoTracking('GB', false)).toBe(false);
  });

  it('should handle GDPR countries appropriately', () => {
    // For now, we don't block GDPR countries but ensure data is anonymized
    expect(shouldBlockGeoTracking('DE', false)).toBe(false);
    expect(shouldBlockGeoTracking('FR', false)).toBe(false);
  });
});

describe('getTimezoneFromGeo', () => {
  it('should return timezone for country and region', () => {
    expect(getTimezoneFromGeo('US', 'CA')).toBe('America/Los_Angeles');
    expect(getTimezoneFromGeo('US', 'NY')).toBe('America/New_York');
    expect(getTimezoneFromGeo('US', 'TX')).toBe('America/Chicago');
  });

  it('should return timezone for country only', () => {
    expect(getTimezoneFromGeo('GB', null)).toBe('Europe/London');
    expect(getTimezoneFromGeo('FR', null)).toBe('Europe/Paris');
    expect(getTimezoneFromGeo('JP', null)).toBe('Asia/Tokyo');
  });

  it('should return null for unknown locations', () => {
    expect(getTimezoneFromGeo('XX', null)).toBe(null);
    expect(getTimezoneFromGeo(null, null)).toBe(null);
  });
});

describe('getGeoLocationFromIP', () => {
  it('should return empty geo for private IPs', async () => {
    const geo = await getGeoLocationFromIP('192.168.1.1');
    expect(geo).toEqual({
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  });

  it('should return empty geo for loopback IPs', async () => {
    const geo = await getGeoLocationFromIP('127.0.0.1');
    expect(geo).toEqual({
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  });

  it('should handle API failures gracefully', async () => {
    // Mock fetch to simulate failure
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const geo = await getGeoLocationFromIP('8.8.8.8');
    expect(geo).toEqual({
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    });

    global.fetch = originalFetch;
  });
});