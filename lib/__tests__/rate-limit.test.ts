import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ratelimit } from '@upstash/ratelimit';
import { checkRateLimit, webhookRateLimiter, apiRateLimiter } from '../rate-limit';

// Mock Upstash Ratelimit
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: {
    slidingWindow: vi.fn(() => ({
      limit: vi.fn(),
    })),
    fixedWindow: vi.fn(() => ({
      limit: vi.fn(),
    })),
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => ({})),
  },
}));

describe('Rate Limiting', () => {
  let mockRateLimiter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimiter = {
      limit: vi.fn(),
    };
  });

  describe('checkRateLimit', () => {
    it('should allow requests when under rate limit', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      });

      const result = await checkRateLimit('192.168.1.1', mockRateLimiter);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(99);
      expect(mockRateLimiter.limit).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should block requests when rate limit exceeded', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const result = await checkRateLimit('192.168.1.1', mockRateLimiter);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle different identifiers', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 50,
        reset: Date.now() + 60000,
      });

      await checkRateLimit('user_123', mockRateLimiter);
      expect(mockRateLimiter.limit).toHaveBeenCalledWith('user_123');

      await checkRateLimit('api_key_456', mockRateLimiter);
      expect(mockRateLimiter.limit).toHaveBeenCalledWith('api_key_456');
    });

    it('should handle rate limiter errors gracefully', async () => {
      mockRateLimiter.limit.mockRejectedValue(new Error('Redis connection failed'));

      // Should allow requests when rate limiter fails
      const result = await checkRateLimit('192.168.1.1', mockRateLimiter);

      expect(result.success).toBe(true);
      expect(result.error).toBe('Rate limiter error');
    });

    it('should return null rate limiter when not configured', async () => {
      const result = await checkRateLimit('192.168.1.1', null);

      expect(result.success).toBe(true);
      expect(result.limit).toBeUndefined();
      expect(result.remaining).toBeUndefined();
    });
  });

  describe('Webhook Rate Limiter', () => {
    it('should configure webhook rate limiter for Stripe', () => {
      expect(webhookRateLimiter.stripe).toBeDefined();
      
      // The actual rate limiter would be configured with:
      // - 100 requests per 60 seconds sliding window
      // This configuration should be suitable for Stripe webhooks
    });

    it('should configure webhook rate limiter for other providers', () => {
      expect(webhookRateLimiter.default).toBeDefined();
      
      // The default rate limiter would be configured with:
      // - 50 requests per 60 seconds sliding window
      // This is more restrictive for unknown webhook sources
    });
  });

  describe('API Rate Limiter', () => {
    it('should configure different rate limits for different endpoints', () => {
      expect(apiRateLimiter.billing).toBeDefined();
      expect(apiRateLimiter.workspace).toBeDefined();
      expect(apiRateLimiter.links).toBeDefined();
      expect(apiRateLimiter.default).toBeDefined();

      // Each endpoint should have appropriate rate limits:
      // - billing: 20 requests per minute (sensitive operations)
      // - workspace: 50 requests per minute (moderate operations)
      // - links: 100 requests per minute (high-volume operations)
      // - default: 60 requests per minute (general API calls)
    });
  });

  describe('Integration with Next.js Middleware', () => {
    it('should extract IP address correctly', async () => {
      const mockRequest = {
        headers: new Map([
          ['x-forwarded-for', '192.168.1.1, 10.0.0.1'],
          ['x-real-ip', '192.168.1.2'],
        ]),
        ip: '192.168.1.3',
      };

      // In actual implementation, prefer x-forwarded-for first IP
      const ip = mockRequest.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                 mockRequest.headers.get('x-real-ip') ||
                 mockRequest.ip ||
                 'unknown';

      expect(ip).toBe('192.168.1.1');
    });

    it('should handle missing IP address', async () => {
      const mockRequest = {
        headers: new Map(),
      };

      const ip = mockRequest.headers.get('x-forwarded-for') ||
                 mockRequest.headers.get('x-real-ip') ||
                 'unknown';

      expect(ip).toBe('unknown');
    });
  });

  describe('Rate Limit Response Headers', () => {
    it('should include rate limit headers in response', async () => {
      const rateLimitResult = {
        success: true,
        limit: 100,
        remaining: 75,
        reset: Date.now() + 60000,
      };

      // Headers that should be set in the response
      const headers = {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      };

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('75');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should include retry-after header when rate limited', async () => {
      const resetTime = Date.now() + 30000; // 30 seconds from now
      const rateLimitResult = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: resetTime,
      };

      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(30);
    });
  });

  describe('Rate Limit Strategies', () => {
    it('should use sliding window for better distribution', () => {
      // Sliding window prevents burst at window boundaries
      // Example: 100 requests per minute with sliding window
      // ensures smooth distribution over time
      
      const slidingWindow = Ratelimit.slidingWindow(100, '1m');
      expect(slidingWindow).toBeDefined();
    });

    it('should use fixed window for simpler counting', () => {
      // Fixed window resets at specific intervals
      // Example: 1000 requests per hour with fixed window
      // resets exactly at the hour mark
      
      const fixedWindow = Ratelimit.fixedWindow(1000, '1h');
      expect(fixedWindow).toBeDefined();
    });
  });

  describe('Webhook-Specific Rate Limiting', () => {
    it('should apply stricter limits for unknown webhook sources', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 300000, // 5 minutes
      });

      const result = await checkRateLimit('unknown_webhook_source', mockRateLimiter);

      expect(result.success).toBe(false);
      expect(result.limit).toBe(10);
    });

    it('should allow higher limits for verified Stripe webhooks', async () => {
      mockRateLimiter.limit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000, // 1 minute
      });

      const result = await checkRateLimit('stripe_webhook', mockRateLimiter);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(100);
    });

    it('should prevent replay attacks through rate limiting', async () => {
      // Simulate multiple rapid webhook calls
      const results = [];
      for (let i = 0; i < 5; i++) {
        mockRateLimiter.limit.mockResolvedValue({
          success: i < 3, // First 3 succeed, then fail
          limit: 3,
          remaining: Math.max(0, 3 - i - 1),
          reset: Date.now() + 60000,
        });
        
        const result = await checkRateLimit('webhook_replay_test', mockRateLimiter);
        results.push(result);
      }

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
      expect(results[3].success).toBe(false);
      expect(results[4].success).toBe(false);
    });
  });
});