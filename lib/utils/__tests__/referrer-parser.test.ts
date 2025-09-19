import { describe, it, expect } from 'vitest';
import {
  parseReferrer,
  extractReferrerDomain,
  categorizeReferrer,
  isInternalReferrer
} from '../referrer-parser';

describe('parseReferrer', () => {
  describe('Search engines', () => {
    it('should identify Google search with keywords', () => {
      const result = parseReferrer('https://www.google.com/search?q=link+shortener&oq=link+shortener');
      expect(result.type).toBe('search');
      expect(result.source).toBe('google');
      expect(result.searchKeywords).toBe('link shortener');
    });

    it('should identify Bing search with keywords', () => {
      const result = parseReferrer('https://www.bing.com/search?q=url+shortener');
      expect(result.type).toBe('search');
      expect(result.source).toBe('bing');
      expect(result.searchKeywords).toBe('url shortener');
    });

    it('should identify DuckDuckGo search', () => {
      const result = parseReferrer('https://duckduckgo.com/?q=privacy+tools');
      expect(result.type).toBe('search');
      expect(result.source).toBe('duckduckgo');
      expect(result.searchKeywords).toBe('privacy tools');
    });

    it('should identify Yahoo search', () => {
      const result = parseReferrer('https://search.yahoo.com/search?p=analytics');
      expect(result.type).toBe('search');
      expect(result.source).toBe('yahoo');
      expect(result.searchKeywords).toBe('analytics');
    });

    it('should handle search engines without keywords', () => {
      const result = parseReferrer('https://www.google.com/');
      expect(result.type).toBe('search');
      expect(result.source).toBe('google');
      expect(result.searchKeywords).toBe(null);
    });

    it('should handle international Google domains', () => {
      const result = parseReferrer('https://www.google.co.uk/search?q=test');
      expect(result.type).toBe('search');
      expect(result.source).toBe('google');
      expect(result.searchKeywords).toBe('test');
    });
  });

  describe('Social media', () => {
    it('should identify Facebook', () => {
      const result = parseReferrer('https://www.facebook.com/');
      expect(result.type).toBe('social');
      expect(result.source).toBe('facebook');
    });

    it('should identify Facebook mobile', () => {
      const result = parseReferrer('https://m.facebook.com/');
      expect(result.type).toBe('social');
      expect(result.source).toBe('facebook');
    });

    it('should identify Facebook link shim', () => {
      const result = parseReferrer('https://l.facebook.com/');
      expect(result.type).toBe('social');
      expect(result.source).toBe('facebook');
    });

    it('should identify Twitter/X', () => {
      const result1 = parseReferrer('https://twitter.com/');
      expect(result1.type).toBe('social');
      expect(result1.source).toBe('twitter');

      const result2 = parseReferrer('https://x.com/');
      expect(result2.type).toBe('social');
      expect(result2.source).toBe('twitter');

      const result3 = parseReferrer('https://t.co/abc123');
      expect(result3.type).toBe('social');
      expect(result3.source).toBe('twitter');
    });

    it('should identify Instagram', () => {
      const result = parseReferrer('https://www.instagram.com/');
      expect(result.type).toBe('social');
      expect(result.source).toBe('instagram');
    });

    it('should identify LinkedIn', () => {
      const result1 = parseReferrer('https://www.linkedin.com/');
      expect(result1.type).toBe('social');
      expect(result1.source).toBe('linkedin');

      const result2 = parseReferrer('https://lnkd.in/abc');
      expect(result2.type).toBe('social');
      expect(result2.source).toBe('linkedin');
    });

    it('should identify YouTube', () => {
      const result1 = parseReferrer('https://www.youtube.com/watch?v=abc123');
      expect(result1.type).toBe('social');
      expect(result1.source).toBe('youtube');

      const result2 = parseReferrer('https://youtu.be/abc123');
      expect(result2.type).toBe('social');
      expect(result2.source).toBe('youtube');
    });

    it('should identify Reddit', () => {
      const result1 = parseReferrer('https://www.reddit.com/r/programming');
      expect(result1.type).toBe('social');
      expect(result1.source).toBe('reddit');

      const result2 = parseReferrer('https://old.reddit.com/');
      expect(result2.type).toBe('social');
      expect(result2.source).toBe('reddit');
    });

    it('should identify TikTok', () => {
      const result = parseReferrer('https://www.tiktok.com/@user');
      expect(result.type).toBe('social');
      expect(result.source).toBe('tiktok');
    });

    it('should identify Discord', () => {
      const result1 = parseReferrer('https://discord.com/');
      expect(result1.type).toBe('social');
      expect(result1.source).toBe('discord');

      const result2 = parseReferrer('https://discord.gg/invite');
      expect(result2.type).toBe('social');
      expect(result2.source).toBe('discord');
    });

    it('should identify newer social platforms', () => {
      const threads = parseReferrer('https://threads.net/');
      expect(threads.type).toBe('social');
      expect(threads.source).toBe('threads');

      const bluesky = parseReferrer('https://bsky.app/');
      expect(bluesky.type).toBe('social');
      expect(bluesky.source).toBe('bluesky');

      const mastodon = parseReferrer('https://mastodon.social/');
      expect(mastodon.type).toBe('social');
      expect(mastodon.source).toBe('mastodon');
    });
  });

  describe('Direct traffic', () => {
    it('should identify direct traffic (no referrer)', () => {
      const result1 = parseReferrer(null);
      expect(result1.type).toBe('direct');
      expect(result1.source).toBe(null);

      const result2 = parseReferrer(undefined);
      expect(result2.type).toBe('direct');
      expect(result2.source).toBe(null);

      const result3 = parseReferrer('');
      expect(result3.type).toBe('direct');
      expect(result3.source).toBe(null);
    });
  });

  describe('External referrals', () => {
    it('should identify external websites', () => {
      const result = parseReferrer('https://example.com/page');
      expect(result.type).toBe('external');
      expect(result.source).toBe('example.com');
    });

    it('should strip www from external domains', () => {
      const result = parseReferrer('https://www.example.com/');
      expect(result.type).toBe('external');
      expect(result.source).toBe('example.com');
    });

    it('should handle subdomains', () => {
      const result = parseReferrer('https://blog.example.com/');
      expect(result.type).toBe('external');
      expect(result.source).toBe('blog.example.com');
    });
  });

  describe('UTM parameters', () => {
    it('should extract UTM parameters from target URL', () => {
      const result = parseReferrer(
        'https://example.com/',
        'https://mysite.com/?utm_source=newsletter&utm_medium=email&utm_campaign=summer2024'
      );
      expect(result.utmParams).toEqual({
        source: 'newsletter',
        medium: 'email',
        campaign: 'summer2024',
        term: null,
        content: null,
      });
    });

    it('should extract all UTM parameters', () => {
      const result = parseReferrer(
        'https://google.com/',
        'https://mysite.com/?utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_term=keyword&utm_content=ad1'
      );
      expect(result.utmParams).toEqual({
        source: 'google',
        medium: 'cpc',
        campaign: 'brand',
        term: 'keyword',
        content: 'ad1',
      });
    });

    it('should handle missing UTM parameters', () => {
      const result = parseReferrer('https://example.com/', 'https://mysite.com/page');
      expect(result.utmParams).toBeUndefined();
    });
  });

  describe('Invalid URLs', () => {
    it('should handle invalid referrer URLs', () => {
      const result = parseReferrer('not-a-valid-url');
      expect(result.type).toBe('direct');
      expect(result.source).toBe(null);
    });

    it('should handle malformed URLs', () => {
      const result = parseReferrer('http://[invalid');
      expect(result.type).toBe('direct');
      expect(result.source).toBe(null);
    });
  });
});

describe('extractReferrerDomain', () => {
  it('should extract domain from URL', () => {
    expect(extractReferrerDomain('https://www.example.com/page')).toBe('example.com');
    expect(extractReferrerDomain('https://subdomain.example.com/')).toBe('subdomain.example.com');
    expect(extractReferrerDomain('http://example.co.uk/')).toBe('example.co.uk');
  });

  it('should handle null input', () => {
    expect(extractReferrerDomain(null)).toBe(null);
  });

  it('should handle invalid URLs', () => {
    expect(extractReferrerDomain('not-a-url')).toBe(null);
  });
});

describe('categorizeReferrer', () => {
  it('should categorize search engines', () => {
    const parsed = { type: 'search' as const, source: 'google', searchKeywords: 'test' };
    const result = categorizeReferrer(parsed);
    expect(result.category).toBe('Search Engines');
    expect(result.subcategory).toBe('google');
  });

  it('should categorize social media', () => {
    const parsed = { type: 'social' as const, source: 'facebook' };
    const result = categorizeReferrer(parsed);
    expect(result.category).toBe('Social Media');
    expect(result.subcategory).toBe('facebook');
  });

  it('should categorize direct traffic', () => {
    const parsed = { type: 'direct' as const, source: null };
    const result = categorizeReferrer(parsed);
    expect(result.category).toBe('Direct Traffic');
    expect(result.subcategory).toBeUndefined();
  });

  it('should categorize referral sites', () => {
    const parsed = { type: 'external' as const, source: 'example.com' };
    const result = categorizeReferrer(parsed);
    expect(result.category).toBe('Referral Sites');
    expect(result.subcategory).toBe('example.com');
  });
});

describe('isInternalReferrer', () => {
  it('should identify internal referrers', () => {
    expect(isInternalReferrer('https://example.com/page1', 'example.com')).toBe(true);
    expect(isInternalReferrer('https://www.example.com/page1', 'example.com')).toBe(true);
    expect(isInternalReferrer('https://example.com/page1', 'www.example.com')).toBe(true);
  });

  it('should identify external referrers', () => {
    expect(isInternalReferrer('https://other.com/', 'example.com')).toBe(false);
    expect(isInternalReferrer('https://subdomain.example.com/', 'example.com')).toBe(false);
  });

  it('should handle null referrer', () => {
    expect(isInternalReferrer(null, 'example.com')).toBe(false);
  });

  it('should handle invalid URLs', () => {
    expect(isInternalReferrer('not-a-url', 'example.com')).toBe(false);
  });
});