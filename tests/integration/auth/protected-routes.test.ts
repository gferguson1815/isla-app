import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'

vi.mock('@/lib/supabase/middleware', () => ({
  createClient: vi.fn(() => ({
    supabase: {
      auth: {
        getSession: vi.fn(),
      },
    },
    response: NextResponse.next(),
  })),
}))

describe('Protected Route Middleware', () => {
  it('should redirect unauthenticated users to login', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    const { createClient } = await import('@/lib/supabase/middleware')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockReturnValue({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      },
      response: NextResponse.next(),
    })

    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
    expect(response.headers.get('location')).toContain('next=%2Fdashboard')
  })

  it('should allow authenticated users to access protected routes', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))

    const { createClient } = await import('@/lib/supabase/middleware')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockReturnValue({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: '123', email: 'test@example.com' },
              },
            },
          }),
        },
      },
      response: NextResponse.next(),
    })

    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('should redirect authenticated users away from auth pages', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/login'))

    const { createClient } = await import('@/lib/supabase/middleware')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockReturnValue({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: {
              session: {
                user: { id: '123', email: 'test@example.com' },
              },
            },
          }),
        },
      },
      response: NextResponse.next(),
    })

    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/dashboard')
  })

  it('should allow public routes without authentication', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/'))

    const { createClient } = await import('@/lib/supabase/middleware')
    const mockCreateClient = vi.mocked(createClient)

    mockCreateClient.mockReturnValue({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      },
      response: NextResponse.next(),
    })

    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })
})