import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { hashIP } from '@/lib/utils/click-tracking';
import { parseUserAgentEnhanced, isBot } from '@/lib/utils/user-agent-parser';
import { parseReferrer } from '@/lib/utils/referrer-parser';
import { extractGeoLocation } from '@/lib/utils/geo-location';
import { getPrivacySettings, sanitizeClickEvent, shouldBlockTracking } from '@/lib/analytics/privacy';
import { z } from 'zod';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const upstashRedisUrl = process.env.UPSTASH_REDIS_REST_URL!;
const upstashRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

const redis = new Redis({
  url: upstashRedisUrl,
  token: upstashRedisToken,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '60 s'),
  analytics: true,
  prefix: 'redirect',
});

const slugSchema = z.string()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z0-9_-]+$/);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = performance.now();

  try {
    const { slug } = await params;

    const validationResult = slugSchema.safeParse(slug);
    if (!validationResult.success) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const cacheKey = `link:${slug}`;
    let linkData = await redis.get(cacheKey) as {
      id: string;
      url: string;
      workspaceId: string;
      expiresAt: string | null;
      ios_url: string | null;
      android_url: string | null;
      geo_targeting: { locations: Array<{ code: string; url: string }> } | null;
      password: string | null;
      expiration_url: string | null;
      link_cloaking: boolean;
      seo_indexing: boolean;
    } | null;

    if (!linkData) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase
        .from('links')
        .select('id, url, workspaceId, expiresAt, ios_url, android_url, geo_targeting, password, expiration_url, link_cloaking, seo_indexing')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        return NextResponse.redirect(new URL('/404', request.url));
      }

      linkData = data;

      await redis.setex(cacheKey, 300, JSON.stringify(linkData));
    }

    // Check if link has expired
    if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
      // Redirect to expiration URL if provided, otherwise 404
      if (linkData.expiration_url) {
        return NextResponse.redirect(linkData.expiration_url);
      }
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // Check if password protection is enabled
    if (linkData.password) {
      // Check for password in cookie
      const cookieName = `link-auth-${slug}`;
      const cookies = request.headers.get('cookie');
      const hasValidAuth = cookies?.includes(`${cookieName}=`);

      if (!hasValidAuth) {
        // Redirect to password verification page
        return NextResponse.redirect(new URL(`/protected/${slug}`, request.url));
      }
    }

    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || null;

    // Enhanced user agent parsing for device detection
    const deviceInfo = parseUserAgentEnhanced(userAgent);

    // Extract geo-location from Vercel headers
    const geoLocation = extractGeoLocation(request);

    // Determine target URL based on targeting rules
    let targetUrl = linkData.url;

    // Apply device targeting
    if (linkData.ios_url && deviceInfo.os === 'iOS') {
      targetUrl = linkData.ios_url;
    } else if (linkData.android_url && deviceInfo.os === 'Android') {
      targetUrl = linkData.android_url;
    }
    // Apply geo-targeting (overrides device targeting if matched)
    else if (linkData.geo_targeting?.locations && geoLocation.country) {
      const matchedLocation = linkData.geo_targeting.locations.find(
        loc => loc.code === geoLocation.country
      );
      if (matchedLocation?.url) {
        targetUrl = matchedLocation.url;
      }
    }

    // Check if it's a bot
    if (isBot(userAgent)) {
      // Still redirect bots but skip detailed tracking
      return NextResponse.redirect(targetUrl, {
        status: 301,
        headers: new Headers({
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }),
      });
    }

    // Get privacy settings based on location
    const privacySettings = getPrivacySettings(request, geoLocation.country, geoLocation.region);

    // Check if tracking should be blocked
    if (shouldBlockTracking(privacySettings)) {
      // Redirect without tracking
      return NextResponse.redirect(targetUrl, {
        status: 301,
        headers: new Headers({
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Privacy': 'DNT-Respected',
        }),
      });
    }

    // Enhanced referrer parsing
    const parsedReferrer = parseReferrer(referrer, linkData.url);

    // Hash IP for privacy
    const hashedIP = await hashIP(ip);

    request.signal.addEventListener('abort', () => {
      console.log('Request aborted, skipping analytics');
    });

    // Build enhanced click event
    let clickEvent: Record<string, unknown> = {
      linkId: linkData.id,
      timestamp: new Date().toISOString(),
      ipAddress: hashedIP,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      referer: referrer,
      referrerType: parsedReferrer.type,
      userAgent,
      country: geoLocation.country,
      region: geoLocation.region,
      city: geoLocation.city,
      latitude: geoLocation.latitude,
      longitude: geoLocation.longitude,
    };

    // Add UTM parameters if present
    if (parsedReferrer.utmParams) {
      clickEvent.utmSource = parsedReferrer.utmParams.source;
      clickEvent.utmMedium = parsedReferrer.utmParams.medium;
      clickEvent.utmCampaign = parsedReferrer.utmParams.campaign;
      clickEvent.utmTerm = parsedReferrer.utmParams.term;
      clickEvent.utmContent = parsedReferrer.utmParams.content;
    }

    // Sanitize click event for privacy compliance
    clickEvent = sanitizeClickEvent(clickEvent, privacySettings);

    const ctx = {
      waitUntil: (promise: Promise<void>) => promise,
    };

    if (typeof (globalThis as Record<string, unknown>).waitUntil === 'function') {
      ((globalThis as Record<string, unknown>).waitUntil as (promise: Promise<void>) => void)(
        trackClickEvent(linkData.id, clickEvent)
      );
    } else {
      ctx.waitUntil(trackClickEvent(linkData.id, clickEvent));
    }

    const responseTime = performance.now() - startTime;

    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${responseTime}ms`,
    });

    // Add SEO headers based on seo_indexing setting
    if (!linkData.seo_indexing) {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    }

    if (responseTime > 50) {
      console.warn(`Slow redirect: ${responseTime}ms for slug: ${slug}`);
    }

    // Handle link cloaking
    if (linkData.link_cloaking) {
      // For link cloaking, we return an HTML page that performs client-side redirect
      // This hides the destination URL from being visible in the status bar
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  ${!linkData.seo_indexing ? '<meta name="robots" content="noindex, nofollow">' : ''}
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .loader { border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader"></div>
  <script>window.location.replace("${targetUrl}");</script>
</body>
</html>`;

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          ...Object.fromEntries(headers.entries()),
        },
      });
    }

    // Regular redirect without cloaking
    return NextResponse.redirect(targetUrl, {
      status: 301,
      headers,
    });

  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.redirect(new URL('/404', request.url));
  }
}

async function trackClickEvent(linkId: string, clickEvent: Record<string, unknown>) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const [clickResult, updateResult] = await Promise.all([
      supabase.from('click_events').insert(clickEvent),
      supabase.rpc('increment_click_count', { link_id: linkId })
    ]);

    if (clickResult.error) {
      console.error('Failed to track click event:', clickResult.error);
    }

    if (updateResult.error) {
      console.error('Failed to increment click count:', updateResult.error);
    }
  } catch (error) {
    console.error('Click tracking error:', error);
  }
}