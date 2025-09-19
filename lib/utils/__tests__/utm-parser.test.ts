import { describe, it, expect } from 'vitest';
import {
  parseUtmParameters,
  buildUrlWithUtm,
  extractUtmFromPastedUrl,
  validateUtmParameter,
  sanitizeUtmParameter,
} from '../utm-parser';

describe('UTM Parser Utilities', () => {
  describe('parseUtmParameters', () => {
    it('should extract UTM parameters from a URL', () => {
      const url = 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale';
      const result = parseUtmParameters(url);

      expect(result.utmParams).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'spring_sale',
      });
      expect(result.cleanUrl).toBe('https://example.com/');
      expect(result.otherParams).toEqual({});
    });

    it('should preserve non-UTM parameters', () => {
      const url = 'https://example.com?page=2&utm_source=facebook&sort=date';
      const result = parseUtmParameters(url);

      expect(result.utmParams).toEqual({
        utm_source: 'facebook',
      });
      expect(result.cleanUrl).toBe('https://example.com/?page=2&sort=date');
      expect(result.otherParams).toEqual({
        page: '2',
        sort: 'date',
      });
    });

    it('should handle URLs without UTM parameters', () => {
      const url = 'https://example.com?page=1';
      const result = parseUtmParameters(url);

      expect(result.utmParams).toEqual({});
      expect(result.cleanUrl).toBe('https://example.com/?page=1');
    });

    it('should handle malformed URLs gracefully', () => {
      const url = 'not-a-valid-url';
      const result = parseUtmParameters(url);

      expect(result.utmParams).toEqual({});
      expect(result.cleanUrl).toBe('not-a-valid-url');
      expect(result.otherParams).toEqual({});
    });

    it('should handle all five UTM parameters', () => {
      const url = 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=test&utm_term=keyword&utm_content=ad1';
      const result = parseUtmParameters(url);

      expect(result.utmParams).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test',
        utm_term: 'keyword',
        utm_content: 'ad1',
      });
    });
  });

  describe('buildUrlWithUtm', () => {
    it('should add UTM parameters to a clean URL', () => {
      const baseUrl = 'https://example.com';
      const utmParams = {
        utm_source: 'twitter',
        utm_medium: 'social',
        utm_campaign: 'launch',
      };

      const result = buildUrlWithUtm(baseUrl, utmParams);
      expect(result).toBe('https://example.com/?utm_source=twitter&utm_medium=social&utm_campaign=launch');
    });

    it('should merge UTM parameters with existing query params', () => {
      const baseUrl = 'https://example.com?page=1';
      const utmParams = {
        utm_source: 'email',
        utm_medium: 'newsletter',
      };

      const result = buildUrlWithUtm(baseUrl, utmParams);
      expect(result).toContain('page=1');
      expect(result).toContain('utm_source=email');
      expect(result).toContain('utm_medium=newsletter');
    });

    it('should respect preserveExisting flag', () => {
      const baseUrl = 'https://example.com?utm_source=google';
      const utmParams = {
        utm_source: 'facebook',
        utm_medium: 'social',
      };

      const resultPreserve = buildUrlWithUtm(baseUrl, utmParams, true);
      expect(resultPreserve).toContain('utm_source=google');
      expect(resultPreserve).toContain('utm_medium=social');

      const resultOverwrite = buildUrlWithUtm(baseUrl, utmParams, false);
      expect(resultOverwrite).toContain('utm_source=facebook');
      expect(resultOverwrite).toContain('utm_medium=social');
    });

    it('should handle malformed URLs gracefully', () => {
      const baseUrl = 'not-a-valid-url';
      const utmParams = { utm_source: 'test' };

      const result = buildUrlWithUtm(baseUrl, utmParams);
      expect(result).toBe('not-a-valid-url');
    });
  });

  describe('extractUtmFromPastedUrl', () => {
    it('should extract UTM parameters in camelCase format', () => {
      const url = 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=test';
      const result = extractUtmFromPastedUrl(url);

      expect(result).toEqual({
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'test',
        utmTerm: undefined,
        utmContent: undefined,
      });
    });

    it('should return undefined for missing parameters', () => {
      const url = 'https://example.com?utm_source=google';
      const result = extractUtmFromPastedUrl(url);

      expect(result).toEqual({
        utmSource: 'google',
        utmMedium: undefined,
        utmCampaign: undefined,
        utmTerm: undefined,
        utmContent: undefined,
      });
    });
  });

  describe('validateUtmParameter', () => {
    it('should accept valid UTM parameters', () => {
      expect(validateUtmParameter('google')).toBe(true);
      expect(validateUtmParameter('paid-social')).toBe(true);
      expect(validateUtmParameter('spring_sale_2024')).toBe(true);
      expect(validateUtmParameter('Test123')).toBe(true);
    });

    it('should reject parameters with spaces', () => {
      expect(validateUtmParameter('google ads')).toBe(false);
      expect(validateUtmParameter('spring sale')).toBe(false);
    });

    it('should reject parameters with invalid characters', () => {
      expect(validateUtmParameter('google@ads')).toBe(false);
      expect(validateUtmParameter('sale!')).toBe(false);
      expect(validateUtmParameter('test#123')).toBe(false);
    });

    it('should accept empty parameters', () => {
      expect(validateUtmParameter('')).toBe(true);
      expect(validateUtmParameter(null)).toBe(true);
      expect(validateUtmParameter(undefined)).toBe(true);
    });

    it('should reject parameters exceeding max length', () => {
      const longString = 'a'.repeat(256);
      expect(validateUtmParameter(longString)).toBe(false);
    });
  });

  describe('sanitizeUtmParameter', () => {
    it('should replace spaces with underscores', () => {
      expect(sanitizeUtmParameter('google ads')).toBe('google_ads');
      expect(sanitizeUtmParameter('spring sale 2024')).toBe('spring_sale_2024');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeUtmParameter('google@ads!')).toBe('googleads');
      expect(sanitizeUtmParameter('test#123$')).toBe('test123');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeUtmParameter('Google')).toBe('google');
      expect(sanitizeUtmParameter('FACEBOOK')).toBe('facebook');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(300);
      const result = sanitizeUtmParameter(longString);
      expect(result.length).toBe(255);
    });

    it('should handle empty values', () => {
      expect(sanitizeUtmParameter('')).toBe('');
      expect(sanitizeUtmParameter(null)).toBe('');
      expect(sanitizeUtmParameter(undefined)).toBe('');
    });
  });
});