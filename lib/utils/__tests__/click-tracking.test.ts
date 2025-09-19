import { describe, it, expect, vi } from 'vitest';
import { hashIP, parseUserAgent } from '../click-tracking';

describe('Click Tracking Utilities', () => {
  describe('hashIP', () => {
    it('should hash IP addresses consistently', async () => {
      const ip = '192.168.1.1';
      const hash1 = await hashIP(ip);
      const hash2 = await hashIP(ip);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });

    it('should produce different hashes for different IPs', async () => {
      const hash1 = await hashIP('192.168.1.1');
      const hash2 = await hashIP('192.168.1.2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return a 16-character hex string', async () => {
      const hash = await hashIP('10.0.0.1');

      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe('parseUserAgent', () => {
    it('should detect Chrome on Windows desktop', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const result = parseUserAgent(ua);

      expect(result).toEqual({
        device: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
      });
    });

    it('should detect Safari on iPhone', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(ua);

      expect(result).toEqual({
        device: 'mobile',
        browser: 'Safari',
        os: 'iOS',
      });
    });

    it('should detect Firefox on Linux desktop', () => {
      const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0';
      const result = parseUserAgent(ua);

      expect(result).toEqual({
        device: 'desktop',
        browser: 'Firefox',
        os: 'Linux',
      });
    });

    it('should detect Chrome on Android mobile', () => {
      const ua = 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
      const result = parseUserAgent(ua);

      expect(result).toEqual({
        device: 'mobile',
        browser: 'Chrome',
        os: 'Android',
      });
    });

    it('should detect Safari on iPad', () => {
      const ua = 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(ua);

      expect(result).toEqual({
        device: 'tablet',
        browser: 'Safari',
        os: 'iOS',
      });
    });

    it('should detect Edge browser', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
      const result = parseUserAgent(ua);

      expect(result).toEqual({
        device: 'desktop',
        browser: 'Edge',
        os: 'Windows',
      });
    });

    it('should handle unknown user agent', () => {
      const ua = 'Unknown Bot/1.0';
      const result = parseUserAgent(ua);

      expect(result).toEqual({
        device: 'desktop',
        browser: 'Unknown',
        os: 'Unknown',
      });
    });

    it('should detect macOS', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      const result = parseUserAgent(ua);

      expect(result).toEqual({
        device: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
      });
    });
  });
});