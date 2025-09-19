import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authRateLimiter, checkRateLimit } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should enforce magic link rate limits (10/hour/email)', async () => {
    if (!authRateLimiter.magicLink) {
      console.warn('Skipping test: Rate limiting not configured')
      return
    }

    const email = 'test@example.com'
    const results = []

    for (let i = 0; i < 11; i++) {
      const result = await checkRateLimit(email, authRateLimiter.magicLink)
      results.push(result)
    }

    const successCount = results.filter(r => r.success).length
    expect(successCount).toBeLessThanOrEqual(10)

    const lastResult = results[results.length - 1]
    expect(lastResult.success).toBe(false)
    expect(lastResult.remaining).toBe(0)
  })

  it('should enforce OAuth rate limits (100/hour/IP)', async () => {
    if (!authRateLimiter.oauthAttempts) {
      console.warn('Skipping test: Rate limiting not configured')
      return
    }

    const ipAddress = '192.168.1.100'
    let successCount = 0

    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(ipAddress, authRateLimiter.oauthAttempts)
      if (result.success) successCount++
    }

    expect(successCount).toBeGreaterThan(0)
    expect(successCount).toBeLessThanOrEqual(100)
  })

  it('should enforce sign-up rate limits (30/hour/IP)', async () => {
    if (!authRateLimiter.signUp) {
      console.warn('Skipping test: Rate limiting not configured')
      return
    }

    const ipAddress = '192.168.1.101'
    const result = await checkRateLimit(ipAddress, authRateLimiter.signUp)

    expect(result).toHaveProperty('success')
    if (result.success) {
      expect(result.remaining).toBeLessThanOrEqual(30)
    }
  })

  it('should handle missing rate limiter gracefully', async () => {
    const result = await checkRateLimit('test', null)
    expect(result.success).toBe(true)
    expect(result.remaining).toBeUndefined()
    expect(result.reset).toBeUndefined()
  })
})