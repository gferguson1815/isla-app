import { describe, it, expect } from 'vitest';
import {
  generateRandomSlug,
  isValidSlug,
  generateUniqueSlug,
  sanitizeSlug,
  needsSlug
} from '../slug';

describe('Slug Generation Utilities', () => {
  describe('generateRandomSlug', () => {
    it('should generate slug with default length (6-8 characters)', () => {
      const slug = generateRandomSlug();
      expect(slug.length).toBeGreaterThanOrEqual(6);
      expect(slug.length).toBeLessThanOrEqual(8);
    });

    it('should generate slug with specified length', () => {
      const slug = generateRandomSlug(10);
      expect(slug).toHaveLength(10);
    });

    it('should only contain alphanumeric characters', () => {
      const slug = generateRandomSlug();
      expect(slug).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should generate unique slugs', () => {
      const slugs = new Set();
      for (let i = 0; i < 100; i++) {
        slugs.add(generateRandomSlug());
      }
      expect(slugs.size).toBe(100);
    });
  });

  describe('isValidSlug', () => {
    it('should accept valid slugs', () => {
      expect(isValidSlug('abc123')).toBe(true);
      expect(isValidSlug('test-slug')).toBe(true);
      expect(isValidSlug('UPPERCASE')).toBe(true);
      expect(isValidSlug('123')).toBe(true);
    });

    it('should reject slugs that are too short', () => {
      expect(isValidSlug('ab')).toBe(false);
      expect(isValidSlug('12')).toBe(false);
      expect(isValidSlug('')).toBe(false);
    });

    it('should reject slugs that are too long', () => {
      const longSlug = 'a'.repeat(31);
      expect(isValidSlug(longSlug)).toBe(false);
    });

    it('should reject slugs with invalid characters', () => {
      expect(isValidSlug('test slug')).toBe(false);
      expect(isValidSlug('test@slug')).toBe(false);
      expect(isValidSlug('test.slug')).toBe(false);
      expect(isValidSlug('test/slug')).toBe(false);
    });
  });

  describe('generateUniqueSlug', () => {
    it('should generate unique slug on first try', async () => {
      const checkUniqueness = async () => true;
      const slug = await generateUniqueSlug(checkUniqueness);
      expect(slug).toBeDefined();
      expect(slug.length).toBeGreaterThanOrEqual(6);
      expect(slug.length).toBeLessThanOrEqual(8);
    });

    it('should retry when slug is not unique', async () => {
      let attempts = 0;
      const checkUniqueness = async () => {
        attempts++;
        return attempts === 3;
      };

      const slug = await generateUniqueSlug(checkUniqueness);
      expect(slug).toBeDefined();
      expect(attempts).toBe(3);
    });

    it('should throw error after max attempts', async () => {
      const checkUniqueness = async () => false;
      await expect(generateUniqueSlug(checkUniqueness, 3)).rejects.toThrow(
        'Failed to generate unique slug after maximum attempts'
      );
    });
  });

  describe('sanitizeSlug', () => {
    it('should sanitize valid input', () => {
      expect(sanitizeSlug('Test Slug')).toBe('test-slug');
      expect(sanitizeSlug('  spaces  ')).toBe('spaces');
      expect(sanitizeSlug('multiple   spaces')).toBe('multiple-spaces');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeSlug('test@slug!')).toBe('testslug');
      expect(sanitizeSlug('test.slug/123')).toBe('testslug123');
      expect(sanitizeSlug('test_slug')).toBe('testslug');
    });

    it('should handle multiple hyphens', () => {
      expect(sanitizeSlug('test---slug')).toBe('test-slug');
      expect(sanitizeSlug('--test--slug--')).toBe('test-slug');
    });

    it('should return null for invalid results', () => {
      expect(sanitizeSlug('ab')).toBe(null); // too short
      expect(sanitizeSlug('!@#')).toBe(null); // all invalid chars
      expect(sanitizeSlug('')).toBe(null);
    });
  });

  describe('needsSlug', () => {
    it('should return true for URLs that need shortening', () => {
      expect(needsSlug('https://example.com/long/path', 'isla.link')).toBe(true);
      expect(needsSlug('https://google.com', 'isla.link')).toBe(true);
    });

    it('should return false for already shortened URLs', () => {
      expect(needsSlug('https://isla.link/abc123', 'isla.link')).toBe(false);
      expect(needsSlug('http://isla.link/test', 'isla.link')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(needsSlug('not-a-url', 'isla.link')).toBe(true);
      expect(needsSlug('', 'isla.link')).toBe(true);
    });
  });
});