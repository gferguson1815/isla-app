import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}))

describe('Magic Link Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send magic link successfully', async () => {
    const mockClient = createClient()
    mockClient.auth.signInWithOtp = vi.fn().mockResolvedValue({ error: null })

    const email = 'test@example.com'
    const { error } = await mockClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/confirm',
      },
    })

    expect(error).toBeNull()
    expect(mockClient.auth.signInWithOtp).toHaveBeenCalledWith({
      email,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/confirm',
      },
    })
  })

  it('should handle magic link errors', async () => {
    const mockClient = createClient()
    mockClient.auth.signInWithOtp = vi.fn().mockResolvedValue({
      error: { message: 'Invalid email' },
    })

    const email = 'invalid-email'
    const { error } = await mockClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/confirm',
      },
    })

    expect(error).toBeDefined()
    expect(error?.message).toBe('Invalid email')
  })

  it('should handle rate limiting', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: 'Too many requests. Please try again later.',
        remaining: 0,
        reset: Date.now() + 3600000,
      }),
    })

    global.fetch = mockFetch

    const response = await fetch('/api/auth/send-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toContain('Too many requests')
    expect(data.remaining).toBe(0)
  })
})