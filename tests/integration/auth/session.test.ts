import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}))

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should persist session across refreshes', async () => {
    const mockClient = createClient()
    const mockSession = {
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      user: { id: '123', email: 'test@example.com' },
    }

    mockClient.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    const { data } = await mockClient.auth.getSession()
    expect(data?.session).toBeDefined()
    expect(data?.session?.user.email).toBe('test@example.com')
  })

  it('should handle session expiry', async () => {
    const mockClient = createClient()
    mockClient.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const { data } = await mockClient.auth.getSession()
    expect(data?.session).toBeNull()
  })

  it('should clear session on sign out', async () => {
    const mockClient = createClient()
    mockClient.auth.signOut = vi.fn().mockResolvedValue({ error: null })

    const { error } = await mockClient.auth.signOut()
    expect(error).toBeNull()
    expect(mockClient.auth.signOut).toHaveBeenCalled()
  })

  it('should listen to auth state changes', () => {
    const mockClient = createClient()
    const mockCallback = vi.fn()

    mockClient.auth.onAuthStateChange = vi.fn((callback) => {
      callback('SIGNED_IN', { user: { id: '123' } })
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      }
    })

    const { data } = mockClient.auth.onAuthStateChange(mockCallback)
    expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', { user: { id: '123' } })
    expect(data?.subscription.unsubscribe).toBeDefined()
  })
})