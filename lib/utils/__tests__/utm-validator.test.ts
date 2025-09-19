import { describe, it, expect } from 'vitest';
import {
  validateUtmParameter,
  validateAllUtmParameters,
  getSuggestionsForValue,
  getInconsistentParameterWarnings,
} from '../utm-validator';

describe('UTM Validator', () => {
  describe('validateUtmParameter', () => {
    it('should accept valid UTM parameters', () => {
      expect(validateUtmParameter('google', 'Source')).toEqual({ isValid: true });
      expect(validateUtmParameter('paid-social', 'Medium')).toEqual({ isValid: true });
      expect(validateUtmParameter('spring_sale_2024', 'Campaign')).toEqual({ isValid: true });
    });

    it('should reject parameters with spaces', () => {
      const result = validateUtmParameter('google ads', 'Source');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot contain spaces');
    });

    it('should reject parameters with invalid characters', () => {
      const result = validateUtmParameter('google@ads', 'Source');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('can only contain');
    });

    it('should accept empty parameters', () => {
      expect(validateUtmParameter('', 'Source')).toEqual({ isValid: true });
      expect(validateUtmParameter(null, 'Source')).toEqual({ isValid: true });
      expect(validateUtmParameter(undefined, 'Source')).toEqual({ isValid: true });
    });

    it('should reject parameters exceeding max length', () => {
      const longString = 'a'.repeat(256);
      const result = validateUtmParameter(longString, 'Source');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('255 characters or less');
    });
  });

  describe('validateAllUtmParameters', () => {
    it('should validate all parameters successfully', () => {
      const params = {
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring-sale',
        utmTerm: 'shoes',
        utmContent: 'banner-ad',
      };

      const result = validateAllUtmParameters(params);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors from invalid parameters', () => {
      const params = {
        utmSource: 'google ads',
        utmMedium: 'paid@social',
        utmCampaign: 'test',
      };

      const result = validateAllUtmParameters(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should warn about uppercase parameters', () => {
      const params = {
        utmSource: 'Google',
        utmMedium: 'CPC',
      };

      const result = validateAllUtmParameters(params);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Consider using lowercase for utm_source for consistency.');
      expect(result.warnings).toContain('Consider using lowercase for utm_medium for consistency.');
    });

    it('should require source when medium is present', () => {
      const params = {
        utmMedium: 'cpc',
      };

      const result = validateAllUtmParameters(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('utm_source is required when utm_medium is present.');
    });

    it('should warn about missing medium when source is present', () => {
      const params = {
        utmSource: 'google',
      };

      const result = validateAllUtmParameters(params);
      expect(result.warnings).toContain('Consider adding utm_medium when utm_source is present.');
    });

    it('should suggest similar known values', () => {
      const params = {
        utmSource: 'gogle',
        utmMedium: 'cpp',
      };

      const result = validateAllUtmParameters(params);
      expect(result.suggestions.some(s => s.includes('google'))).toBe(true);
      expect(result.suggestions.some(s => s.includes('cpc'))).toBe(true);
    });
  });

  describe('getSuggestionsForValue', () => {
    it('should suggest corrections for common source misspellings', () => {
      expect(getSuggestionsForValue('gogle', 'source')).toContain('google');
      expect(getSuggestionsForValue('fb', 'source')).toContain('facebook');
      expect(getSuggestionsForValue('linkdin', 'source')).toContain('linkedin');
    });

    it('should suggest corrections for common medium variations', () => {
      expect(getSuggestionsForValue('ppc', 'medium')).toContain('cpc');
      expect(getSuggestionsForValue('mail', 'medium')).toContain('email');
      expect(getSuggestionsForValue('paid_social', 'medium')).toContain('paid-social');
    });

    it('should return empty array for unknown values', () => {
      expect(getSuggestionsForValue('unknown', 'source')).toEqual([]);
      expect(getSuggestionsForValue('random', 'medium')).toEqual([]);
    });
  });

  describe('getInconsistentParameterWarnings', () => {
    it('should warn about unusual source/medium combinations', () => {
      const existingParams = [
        { utmSource: 'google', utmMedium: 'cpc' },
      ];
      const newParams = { utmSource: 'google', utmMedium: 'social' };

      const warnings = getInconsistentParameterWarnings(existingParams, newParams);
      expect(warnings).toContain('Unusual combination: Google is typically used with "cpc" or "organic" medium.');
    });

    it('should suggest better medium for Facebook', () => {
      const existingParams = [];
      const newParams = { utmSource: 'facebook', utmMedium: 'cpc' };

      const warnings = getInconsistentParameterWarnings(existingParams, newParams);
      expect(warnings).toContain('Consider using "paid-social" medium for Facebook instead of "cpc".');
    });

    it('should not warn for valid combinations', () => {
      const existingParams = [];
      const newParams = { utmSource: 'google', utmMedium: 'cpc' };

      const warnings = getInconsistentParameterWarnings(existingParams, newParams);
      expect(warnings).toHaveLength(0);
    });

    it('should handle empty parameters gracefully', () => {
      const existingParams = [];
      const newParams = {};

      const warnings = getInconsistentParameterWarnings(existingParams, newParams);
      expect(warnings).toHaveLength(0);
    });
  });
});