import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
  })
}

export const authRateLimiter = {
  magicLink: ratelimit
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        analytics: true,
        prefix: 'auth:magic-link',
      })
    : null,

  oauthAttempts: ratelimit
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(100, '1 h'),
        analytics: true,
        prefix: 'auth:oauth',
      })
    : null,

  signUp: ratelimit
    ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(30, '1 h'),
        analytics: true,
        prefix: 'auth:signup',
      })
    : null,
}

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  if (!limiter) {
    console.warn('Rate limiting not configured (missing Upstash Redis credentials)')
    return { success: true }
  }

  const { success, remaining, reset } = await limiter.limit(identifier)

  return { success, remaining, reset }
}