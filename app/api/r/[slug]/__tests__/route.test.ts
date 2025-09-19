import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import { Ratelimit } from '@upstash/ratelimit';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({ error: null })),
    })),
    rpc: vi.fn(() => ({ error: null })),
  })),
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({
    get: vi.fn(),
    setex: vi.fn(),
  })),
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: {
    slidingWindow: vi.fn(() => ({})),
  },
}));

interface MockRedis {
  get: ReturnType<typeof vi.fn>;
  setex: ReturnType<typeof vi.fn>;
}

interface MockSupabase {
  from: ReturnType<typeof vi.fn>;
}

interface MockRatelimit {
  limit: ReturnType<typeof vi.fn>;
}

describe('Redirect API Route', () => {
  let mockRedis: MockRedis;
  let mockSupabase: MockSupabase;
  let mockRatelimit: MockRatelimit;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRedis = {
      get: vi.fn(),
      setex: vi.fn(),
    };

    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'test-link-id',
                url: 'https://example.com',
                workspaceId: 'test-workspace-id',
                expiresAt: null,
              },
              error: null,
            })),
          })),
        })),
        insert: vi.fn(() => ({ error: null })),
      })),
      rpc: vi.fn(() => ({ error: null })),
    };

    mockRatelimit = {
      limit: vi.fn(() => ({ success: true })),
    };

    vi.mocked(Redis).mockReturnValue(mockRedis);
    vi.mocked(createClient).mockReturnValue(mockSupabase);
    vi.mocked(Ratelimit).mockImplementation(() => mockRatelimit);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should redirect to the correct URL for a valid slug', async () => {
    const request = new NextRequest('http://localhost:3000/api/r/test-slug', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        'x-forwarded-for': '192.168.1.1',
      },
    });

    const response = await GET(request, { params: Promise.resolve({ slug: 'test-slug' }) });

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://example.com');
  });

  it('should use cache when available', async () => {
    mockRedis.get.mockResolvedValue({
      id: 'cached-link-id',
      url: 'https://cached.example.com',
      workspaceId: 'cached-workspace-id',
      expiresAt: null,
    });

    const request = new NextRequest('http://localhost:3000/api/r/cached-slug', {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '192.168.1.1',
      },
    });

    const response = await GET(request, { params: Promise.resolve({ slug: 'cached-slug' }) });

    expect(mockRedis.get).toHaveBeenCalledWith('link:cached-slug');
    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://cached.example.com');
  });

  it('should return 404 for non-existent slug', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'Not found' },
          })),
        })),
      })),
    });

    const request = new NextRequest('http://localhost:3000/api/r/invalid-slug');

    const response = await GET(request, { params: Promise.resolve({ slug: 'invalid-slug' }) });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/404');
  });

  it('should handle rate limiting', async () => {
    mockRatelimit.limit.mockResolvedValue({ success: false });

    const request = new NextRequest('http://localhost:3000/api/r/test-slug');

    const response = await GET(request, { params: Promise.resolve({ slug: 'test-slug' }) });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe('Too many requests');
  });

  it('should reject invalid slug format', async () => {
    const request = new NextRequest('http://localhost:3000/api/r/invalid@slug');

    const response = await GET(request, { params: Promise.resolve({ slug: 'invalid@slug' }) });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/404');
  });

  it('should handle expired links', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    mockRedis.get.mockResolvedValue({
      id: 'expired-link-id',
      url: 'https://expired.example.com',
      workspaceId: 'workspace-id',
      expiresAt: expiredDate.toISOString(),
    });

    const request = new NextRequest('http://localhost:3000/api/r/expired-slug');

    const response = await GET(request, { params: Promise.resolve({ slug: 'expired-slug' }) });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/404');
  });

  it('should track response time in headers', async () => {
    const request = new NextRequest('http://localhost:3000/api/r/test-slug');

    const response = await GET(request, { params: Promise.resolve({ slug: 'test-slug' }) });

    expect(response.headers.get('x-response-time')).toMatch(/\d+ms/);
  });

  it('should set appropriate cache control headers', async () => {
    const request = new NextRequest('http://localhost:3000/api/r/test-slug');

    const response = await GET(request, { params: Promise.resolve({ slug: 'test-slug' }) });

    expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate');
  });
});