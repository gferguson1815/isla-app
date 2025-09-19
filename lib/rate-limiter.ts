import { TRPCError } from '@trpc/server';

interface RateLimitStore {
  attempts: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitStore> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 100, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;

    // Clean up old entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  async checkLimit(identifier: string): Promise<void> {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || record.resetTime < now) {
      // Create new record
      this.store.set(identifier, {
        attempts: 1,
        resetTime: now + this.windowMs
      });
      return;
    }

    if (record.attempts >= this.maxAttempts) {
      const remainingTime = Math.ceil((record.resetTime - now) / 1000);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Please try again in ${remainingTime} seconds.`
      });
    }

    // Increment attempts
    record.attempts++;
    this.store.set(identifier, record);
  }

  reset(identifier: string): void {
    this.store.delete(identifier);
  }
}

// Create singleton instances for different rate limit tiers
export const analyticsRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
export const exportRateLimiter = new RateLimiter(10, 300000); // 10 exports per 5 minutes

// Helper function to create rate limit middleware
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (ctx: any) => {
    const userId = ctx.userId || ctx.session?.user?.id;
    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
    }

    await limiter.checkLimit(userId);
  };
}