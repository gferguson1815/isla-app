import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  checkDoNotTrack,
  isGDPRRegion,
  isCCPARegion,
  getPrivacySettings,
  sanitizeClickEvent,
  generatePrivacyCompliantId,
  shouldBlockTracking,
  createPrivacySafeLog,
  getPrivacyHeaders
} from '../privacy';

describe('Privacy Compliance', () => {
  describe('checkDoNotTrack', () => {
    it('should detect Do Not Track header', () => {
      const headers = new Headers({ 'dnt': '1' });
      const request = new NextRequest('https://example.com', { headers });
      expect(checkDoNotTrack(request)).toBe(true);
    });

    it('should detect alternative DNT header', () => {
      const headers = new Headers({ 'donottrack': '1' });
      const request = new NextRequest('https://example.com', { headers });
      expect(checkDoNotTrack(request)).toBe(true);
    });

    it('should return false when DNT is not set', () => {
      const request = new NextRequest('https://example.com');
      expect(checkDoNotTrack(request)).toBe(false);
    });

    it('should return false when DNT is set to 0', () => {
      const headers = new Headers({ 'dnt': '0' });
      const request = new NextRequest('https://example.com', { headers });
      expect(checkDoNotTrack(request)).toBe(false);
    });
  });

  describe('isGDPRRegion', () => {
    it('should identify EU countries', () => {
      expect(isGDPRRegion('DE')).toBe(true);
      expect(isGDPRRegion('FR')).toBe(true);
      expect(isGDPRRegion('IT')).toBe(true);
      expect(isGDPRRegion('ES')).toBe(true);
    });

    it('should identify EEA countries', () => {
      expect(isGDPRRegion('NO')).toBe(true); // Norway
      expect(isGDPRRegion('IS')).toBe(true); // Iceland
      expect(isGDPRRegion('LI')).toBe(true); // Liechtenstein
    });

    it('should identify UK as GDPR region', () => {
      expect(isGDPRRegion('GB')).toBe(true);
    });

    it('should handle lowercase country codes', () => {
      expect(isGDPRRegion('de')).toBe(true);
      expect(isGDPRRegion('fr')).toBe(true);
    });

    it('should return false for non-GDPR regions', () => {
      expect(isGDPRRegion('US')).toBe(false);
      expect(isGDPRRegion('CA')).toBe(false);
      expect(isGDPRRegion('AU')).toBe(false);
      expect(isGDPRRegion('JP')).toBe(false);
    });

    it('should handle null country', () => {
      expect(isGDPRRegion(null)).toBe(false);
    });
  });

  describe('isCCPARegion', () => {
    it('should identify California', () => {
      expect(isCCPARegion('US', 'CA')).toBe(true);
    });

    it('should return false for other US states', () => {
      expect(isCCPARegion('US', 'NY')).toBe(false);
      expect(isCCPARegion('US', 'TX')).toBe(false);
    });

    it('should return false for non-US countries', () => {
      expect(isCCPARegion('CA', 'ON')).toBe(false);
      expect(isCCPARegion('MX', 'CA')).toBe(false);
    });

    it('should handle null values', () => {
      expect(isCCPARegion(null, null)).toBe(false);
      expect(isCCPARegion('US', null)).toBe(false);
    });
  });

  describe('getPrivacySettings', () => {
    it('should respect Do Not Track', () => {
      const headers = new Headers({ 'dnt': '1' });
      const request = new NextRequest('https://example.com', { headers });
      const settings = getPrivacySettings(request, 'US', 'NY');

      expect(settings.respectDoNotTrack).toBe(true);
      expect(settings.skipDetailedTracking).toBe(true);
    });

    it('should require consent in GDPR regions', () => {
      const request = new NextRequest('https://example.com');
      const settings = getPrivacySettings(request, 'DE', null);

      expect(settings.requireConsent).toBe(true);
      expect(settings.dataRetentionDays).toBe(90);
    });

    it('should require consent in CCPA regions', () => {
      const request = new NextRequest('https://example.com');
      const settings = getPrivacySettings(request, 'US', 'CA');

      expect(settings.requireConsent).toBe(true);
    });

    it('should use longer retention for non-GDPR regions', () => {
      const request = new NextRequest('https://example.com');
      const settings = getPrivacySettings(request, 'US', 'NY');

      expect(settings.dataRetentionDays).toBe(365);
    });

    it('should always anonymize IP', () => {
      const request = new NextRequest('https://example.com');
      const settings = getPrivacySettings(request, 'US', 'NY');

      expect(settings.anonymizeIP).toBe(true);
    });

    it('should check for consent cookie', () => {
      const request = new NextRequest('https://example.com');
      request.cookies.set('analytics-consent', 'accepted');
      const settings = getPrivacySettings(request, 'DE', null);

      expect(settings.requireConsent).toBe(true);
      expect(settings.skipDetailedTracking).toBe(false);
    });
  });

  describe('sanitizeClickEvent', () => {
    it('should remove raw IP addresses', () => {
      const event = {
        linkId: '123',
        ipAddress: '192.168.1.1',
        device: 'desktop'
      };
      const settings = {
        respectDoNotTrack: false,
        anonymizeIP: true,
        dataRetentionDays: 90,
        requireConsent: false,
        skipDetailedTracking: false
      };

      const sanitized = sanitizeClickEvent(event, settings);
      expect(sanitized.ipAddress).toBeUndefined();
    });

    it('should keep only essential data when DNT is enabled', () => {
      const event = {
        linkId: '123',
        timestamp: '2024-01-01',
        country: 'US',
        device: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
        referrer: 'https://example.com',
        userAgent: 'Mozilla/5.0...',
        utmSource: 'google',
        utmCampaign: 'test'
      };
      const settings = {
        respectDoNotTrack: true,
        anonymizeIP: true,
        dataRetentionDays: 90,
        requireConsent: false,
        skipDetailedTracking: true
      };

      const sanitized = sanitizeClickEvent(event, settings);

      // Essential fields should be kept
      expect(sanitized.linkId).toBe('123');
      expect(sanitized.timestamp).toBe('2024-01-01');
      expect(sanitized.country).toBe('US');
      expect(sanitized.device).toBe('desktop');

      // Non-essential fields should be removed
      expect(sanitized.browser).toBeUndefined();
      expect(sanitized.os).toBeUndefined();
      expect(sanitized.referrer).toBeUndefined();
      expect(sanitized.userAgent).toBeUndefined();
      expect(sanitized.utmSource).toBeUndefined();
      expect(sanitized.utmCampaign).toBeUndefined();
    });

    it('should remove PII fields', () => {
      const event = {
        linkId: '123',
        device: 'desktop',
        email: 'user@example.com',
        name: 'John Doe',
        phone: '555-1234',
        userId: 'user-123',
        username: 'johndoe'
      };
      const settings = {
        respectDoNotTrack: false,
        anonymizeIP: true,
        dataRetentionDays: 90,
        requireConsent: false,
        skipDetailedTracking: false
      };

      const sanitized = sanitizeClickEvent(event, settings);

      expect(sanitized.linkId).toBe('123');
      expect(sanitized.device).toBe('desktop');
      expect(sanitized.email).toBeUndefined();
      expect(sanitized.name).toBeUndefined();
      expect(sanitized.phone).toBeUndefined();
      expect(sanitized.userId).toBeUndefined();
      expect(sanitized.username).toBeUndefined();
    });
  });

  describe('generatePrivacyCompliantId', () => {
    it('should generate consistent ID for same day', async () => {
      const ip = '192.168.1.1';
      const userAgent = 'Mozilla/5.0...';

      const id1 = await generatePrivacyCompliantId(ip, userAgent);
      const id2 = await generatePrivacyCompliantId(ip, userAgent);

      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different IPs', async () => {
      const userAgent = 'Mozilla/5.0...';

      const id1 = await generatePrivacyCompliantId('192.168.1.1', userAgent);
      const id2 = await generatePrivacyCompliantId('192.168.1.2', userAgent);

      expect(id1).not.toBe(id2);
    });

    it('should generate different IDs for different user agents', async () => {
      const ip = '192.168.1.1';

      const id1 = await generatePrivacyCompliantId(ip, 'Chrome');
      const id2 = await generatePrivacyCompliantId(ip, 'Firefox');

      expect(id1).not.toBe(id2);
    });

    it('should generate 32-character hex string', async () => {
      const id = await generatePrivacyCompliantId('192.168.1.1', 'Mozilla');

      expect(id).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('shouldBlockTracking', () => {
    it('should block when DNT is enabled', () => {
      const settings = {
        respectDoNotTrack: true,
        anonymizeIP: true,
        dataRetentionDays: 90,
        requireConsent: false,
        skipDetailedTracking: true
      };

      expect(shouldBlockTracking(settings)).toBe(true);
    });

    it('should block when consent is required but not given', () => {
      const settings = {
        respectDoNotTrack: false,
        anonymizeIP: true,
        dataRetentionDays: 90,
        requireConsent: true,
        skipDetailedTracking: false
      };

      expect(shouldBlockTracking(settings, false)).toBe(true);
    });

    it('should not block when consent is required and given', () => {
      const settings = {
        respectDoNotTrack: false,
        anonymizeIP: true,
        dataRetentionDays: 90,
        requireConsent: true,
        skipDetailedTracking: false
      };

      expect(shouldBlockTracking(settings, true)).toBe(false);
    });

    it('should not block when neither DNT nor consent requirements apply', () => {
      const settings = {
        respectDoNotTrack: false,
        anonymizeIP: true,
        dataRetentionDays: 365,
        requireConsent: false,
        skipDetailedTracking: false
      };

      expect(shouldBlockTracking(settings)).toBe(false);
    });
  });

  describe('createPrivacySafeLog', () => {
    it('should remove sensitive headers', () => {
      const log = createPrivacySafeLog('Test message', {
        headers: {
          'content-type': 'application/json',
          'cookie': 'session=abc123',
          'authorization': 'Bearer token123',
          'x-api-key': 'secret-key'
        }
      });

      const headers = log.context as Record<string, { [key: string]: unknown }>;
      expect(headers.headers['content-type']).toBe('application/json');
      expect(headers.headers.cookie).toBeUndefined();
      expect(headers.headers.authorization).toBeUndefined();
      expect(headers.headers['x-api-key']).toBeUndefined();
    });

    it('should remove IP-related fields', () => {
      const log = createPrivacySafeLog('Test message', {
        ip: '192.168.1.1',
        ipAddress: '192.168.1.1',
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.1',
        other: 'data'
      });

      const context = log.context as Record<string, unknown>;
      expect(context.ip).toBeUndefined();
      expect(context.ipAddress).toBeUndefined();
      expect(context['x-forwarded-for']).toBeUndefined();
      expect(context['x-real-ip']).toBeUndefined();
      expect(context.other).toBe('data');
    });

    it('should remove user agent', () => {
      const log = createPrivacySafeLog('Test message', {
        userAgent: 'Mozilla/5.0...',
        'user-agent': 'Mozilla/5.0...',
        browser: 'Chrome'
      });

      const context = log.context as Record<string, unknown>;
      expect(context.userAgent).toBeUndefined();
      expect(context['user-agent']).toBeUndefined();
      expect(context.browser).toBe('Chrome');
    });

    it('should include timestamp', () => {
      const log = createPrivacySafeLog('Test message', {});

      expect(log.message).toBe('Test message');
      expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getPrivacyHeaders', () => {
    it('should set DNT-Respected header when DNT is enabled', () => {
      const settings = {
        respectDoNotTrack: true,
        anonymizeIP: true,
        dataRetentionDays: 90,
        requireConsent: false,
        skipDetailedTracking: true
      };

      const headers = getPrivacyHeaders(settings);
      expect(headers.get('X-DNT-Respected')).toBe('true');
    });

    it('should set data retention header', () => {
      const settings = {
        respectDoNotTrack: false,
        anonymizeIP: true,
        dataRetentionDays: 90,
        requireConsent: false,
        skipDetailedTracking: false
      };

      const headers = getPrivacyHeaders(settings);
      expect(headers.get('X-Data-Retention-Days')).toBe('90');
    });

    it('should always set IP-Anonymized header', () => {
      const settings = {
        respectDoNotTrack: false,
        anonymizeIP: true,
        dataRetentionDays: 365,
        requireConsent: false,
        skipDetailedTracking: false
      };

      const headers = getPrivacyHeaders(settings);
      expect(headers.get('X-IP-Anonymized')).toBe('true');
    });

    it('should set consent required header when applicable', () => {
      const settings = {
        respectDoNotTrack: false,
        anonymizeIP: true,
        dataRetentionDays: 90,
        requireConsent: true,
        skipDetailedTracking: false
      };

      const headers = getPrivacyHeaders(settings);
      expect(headers.get('X-Consent-Required')).toBe('true');
    });
  });
});