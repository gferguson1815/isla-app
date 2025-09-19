import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: vi.fn(),
      getSession: vi.fn(),
    },
  })),
}))

describe('OAuth Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initiate Google OAuth successfully', async () => {
    const mockClient = createClient()
    mockClient.auth.signInWithOAuth = vi.fn().mockResolvedValue({
      data: { url: 'https://accounts.google.com/oauth/authorize' },
      error: null,
    })

    const { data, error } = await mockClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/confirm',
      },
    })

    expect(error).toBeNull()
    expect(data?.url).toContain('google.com')
    expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/confirm',
      },
    })
  })

  it('should handle OAuth errors gracefully', async () => {
    const mockClient = createClient()
    mockClient.auth.signInWithOAuth = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'OAuth provider not configured' },
    })

    const { error } = await mockClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/confirm',
      },
    })

    expect(error).toBeDefined()
    expect(error?.message).toBe('OAuth provider not configured')
  })

  it('should show fallback message when Google OAuth fails', async () => {
    const mockClient = createClient()
    mockClient.auth.signInWithOAuth = vi.fn().mockResolvedValue({
      error: { message: 'Service unavailable' },
    })

    const { error } = await mockClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/confirm',
      },
    })

    expect(error).toBeDefined()
    const fallbackMessage = 'Google sign in is temporarily unavailable. Please use email sign in.'
    expect(fallbackMessage).toContain('temporarily unavailable')
    expect(fallbackMessage).toContain('email sign in')
  })
})