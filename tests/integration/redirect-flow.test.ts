import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';

describe('Redirect Flow Integration', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  let testLinkId: string;
  let testWorkspaceId: string;

  beforeAll(async () => {
    // Setup test workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name: 'Test Workspace' })
      .select()
      .single();

    if (wsError) throw wsError;
    testWorkspaceId = workspace.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testWorkspaceId) {
      await supabase
        .from('workspaces')
        .delete()
        .eq('id', testWorkspaceId);
    }
  });

  beforeEach(async () => {
    // Create a test link for each test
    const { data: link, error } = await supabase
      .from('links')
      .insert({
        workspaceId: testWorkspaceId,
        url: 'https://example.com',
        slug: `test-${Date.now()}`,
        clickCount: 0,
      })
      .select()
      .single();

    if (error) throw error;
    testLinkId = link.id;
  });

  it('should redirect to the correct URL', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/r/test-${Date.now()}`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://example.com');
  });

  it('should increment click count', async () => {
    const slug = `test-${Date.now()}`;

    // Get initial click count
    const { data: beforeLink } = await supabase
      .from('links')
      .select('clickCount')
      .eq('id', testLinkId)
      .single();

    // Make redirect request
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/r/${slug}`, {
      redirect: 'manual',
    });

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check updated click count
    const { data: afterLink } = await supabase
      .from('links')
      .select('clickCount')
      .eq('id', testLinkId)
      .single();

    expect(afterLink?.clickCount).toBe((beforeLink?.clickCount || 0) + 1);
  });

  it('should record click event', async () => {
    const slug = `test-${Date.now()}`;

    // Make redirect request
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/r/${slug}`, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
      },
    });

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check click event was recorded
    const { data: clickEvents } = await supabase
      .from('clickEvents')
      .select('*')
      .eq('linkId', testLinkId)
      .order('timestamp', { ascending: false })
      .limit(1);

    expect(clickEvents?.length).toBe(1);
    expect(clickEvents?.[0]).toMatchObject({
      linkId: testLinkId,
      device: expect.any(String),
      browser: expect.any(String),
      os: expect.any(String),
    });
  });

  it('should return 404 for non-existent slug', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/r/non-existent-slug`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/404');
  });

  it('should handle expired links', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    // Create expired link
    const { data: link } = await supabase
      .from('links')
      .insert({
        workspaceId: testWorkspaceId,
        url: 'https://expired.com',
        slug: `expired-${Date.now()}`,
        clickCount: 0,
        expiresAt: expiredDate.toISOString(),
      })
      .select()
      .single();

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/r/${link?.slug}`, {
      redirect: 'manual',
    });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/404');
  });

  it('should handle high concurrency', async () => {
    const slug = `concurrent-${Date.now()}`;

    // Create link for concurrent testing
    await supabase
      .from('links')
      .insert({
        workspaceId: testWorkspaceId,
        url: 'https://concurrent.com',
        slug,
        clickCount: 0,
      });

    // Make 10 concurrent requests
    const requests = Array(10).fill(null).map(() =>
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/r/${slug}`, {
        redirect: 'manual',
      })
    );

    const responses = await Promise.all(requests);

    // All should redirect successfully
    responses.forEach(response => {
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toBe('https://concurrent.com');
    });
  });

  it('should measure performance', async () => {
    const slug = `perf-${Date.now()}`;

    // Create link for performance testing
    await supabase
      .from('links')
      .insert({
        workspaceId: testWorkspaceId,
        url: 'https://performance.com',
        slug,
        clickCount: 0,
      });

    const startTime = performance.now();

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/r/${slug}`, {
      redirect: 'manual',
    });

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    expect(response.status).toBe(301);
    expect(responseTime).toBeLessThan(100); // Should be under 100ms

    // Check response time header
    const headerTime = response.headers.get('x-response-time');
    expect(headerTime).toMatch(/\d+ms/);
  });
});