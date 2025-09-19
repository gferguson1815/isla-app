# External Dependencies Specifications

## Overview

This document addresses the gaps identified in external service dependencies, providing specific implementation details, rate limits, and fallback strategies for all third-party integrations.

## 1. Geo-Location Service Specification

### Recommended Solution: Vercel Edge Geo-Location

**Rationale**: Zero additional cost, built into Vercel Edge Functions, no API keys required

#### Implementation for Story 3.1:

```typescript
// apps/web/app/api/redirect/[slug]/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge"; // Enable Edge runtime

export async function GET(req: NextRequest) {
  // Vercel automatically provides geo data in Edge Functions
  const geo = req.geo || {};

  const geoData = {
    country: geo.country || "XX", // ISO 3166-1 alpha-2
    region: geo.region || "Unknown", // State/Province
    city: geo.city || "Unknown",
    latitude: geo.latitude || null,
    longitude: geo.longitude || null,
  };

  // Store in click_events table
  await storeClickEvent({
    ...otherData,
    geo_country: geoData.country,
    geo_region: geoData.region,
    geo_city: geoData.city,
  });
}
```

### Fallback Solution: IP-API.com (Free Tier)

**Only if Vercel geo is insufficient**

```typescript
// packages/analytics/src/geo-lookup.ts
const GEO_LOOKUP_CONFIG = {
  primary: "vercel-edge",
  fallback: "ip-api",
  cache_ttl: 86400, // 24 hours
};

async function getGeoLocation(ip: string, req?: NextRequest) {
  try {
    // Primary: Vercel Edge (if available)
    if (req?.geo) {
      return formatVercelGeo(req.geo);
    }

    // Fallback: IP-API.com (free tier: 45 req/min)
    const cached = await redis.get(`geo:${ip}`);
    if (cached) return cached;

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`,
      { signal: AbortSignal.timeout(1000) } // 1 second timeout
    );

    if (!response.ok) throw new Error("Geo lookup failed");

    const data = await response.json();
    if (data.status === "success") {
      await redis.set(`geo:${ip}`, data, "EX", GEO_LOOKUP_CONFIG.cache_ttl);
      return data;
    }
  } catch (error) {
    // Return unknown location on any failure
    return {
      country: "XX",
      regionName: "Unknown",
      city: "Unknown",
      lat: null,
      lon: null,
    };
  }
}
```

## 2. API Rate Limits & Constraints

### Supabase Limits (Pro Tier - $25/month)

```typescript
// packages/config/src/rate-limits.ts
export const SUPABASE_LIMITS = {
  auth: {
    signups_per_hour: 30, // Per IP
    magic_links_per_hour: 10, // Per email
    oauth_attempts_per_hour: 100, // Per IP
  },
  database: {
    concurrent_connections: 60,
    max_rows_per_request: 1000,
    realtime_concurrent_users: 200,
  },
  storage: {
    upload_size_mb: 50,
    bandwidth_gb_per_month: 20,
  },
};

// Implement rate limiting middleware
export const authRateLimiter = {
  signup: new RateLimiter({
    points: 30,
    duration: 3600, // 1 hour
    blockDuration: 3600,
  }),
  magicLink: new RateLimiter({
    points: 10,
    duration: 3600,
    blockDuration: 600, // 10 min block
  }),
};
```

### Google OAuth Quotas

```typescript
export const GOOGLE_OAUTH_LIMITS = {
  daily_quota: 10000, // Free tier
  per_user_per_minute: 20,
  per_project_per_minute: 1000,

  // Implementation monitoring
  monitor: async () => {
    const usage = await getOAuthUsage();
    if (usage > GOOGLE_OAUTH_LIMITS.daily_quota * 0.8) {
      await notifyAdmin("Google OAuth approaching daily limit");
    }
  },
};
```

### External API Limits Summary

| Service       | Endpoint        | Rate Limit    | Fallback Strategy           |
| ------------- | --------------- | ------------- | --------------------------- |
| Supabase Auth | /auth/signup    | 30/hour/IP    | Show error, suggest wait    |
| Supabase Auth | /auth/magiclink | 10/hour/email | Suggest OAuth login         |
| Google OAuth  | /auth/google    | 1000/min      | Fall back to magic link     |
| IP-API        | /json/{ip}      | 45/min        | Use Vercel geo or "Unknown" |
| Vercel Edge   | Geo lookup      | Unlimited     | Return "Unknown" location   |

## 3. Fallback Strategies Implementation

### Email Service Fallback (Story 1.3)

```typescript
// apps/web/src/lib/email/email-service.ts
class EmailService {
  private providers = [
    { name: "supabase", send: this.sendViaSupabase },
    { name: "resend", send: this.sendViaResend }, // Backup
  ];

  async sendMagicLink(email: string, token: string) {
    for (const provider of this.providers) {
      try {
        await provider.send(email, token);
        await this.logSuccess(provider.name);
        return { success: true, provider: provider.name };
      } catch (error) {
        await this.logFailure(provider.name, error);
        continue; // Try next provider
      }
    }

    // All providers failed - queue for retry
    await this.queueForRetry({ email, token, attempts: 1 });
    throw new Error("Email service temporarily unavailable");
  }

  private async queueForRetry(job: EmailJob) {
    await redis.lpush(
      "email:retry:queue",
      JSON.stringify({
        ...job,
        nextAttempt: Date.now() + 60000, // Retry in 1 minute
      })
    );
  }
}
```

### OAuth Fallback (Story 1.3)

```typescript
// apps/web/src/components/auth/login-form.tsx
export function LoginForm() {
  const [googleError, setGoogleError] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      setGoogleError(true);
      toast.error('Google login unavailable. Please use email login.');
    }
  };

  return (
    <>
      {!googleError && (
        <Button onClick={handleGoogleLogin}>
          Continue with Google
        </Button>
      )}

      <Separator>or</Separator>

      <EmailLoginForm />

      {googleError && (
        <Alert variant="warning">
          Google login is temporarily unavailable.
          Please use email login instead.
        </Alert>
      )}
    </>
  );
}
```

## 4. Chrome Web Store Requirements (Epic 4)

### Developer Account Setup

```markdown
## Chrome Web Store Developer Account

### Prerequisites (User Responsibility):

1. Google account for developer registration
2. One-time $5 registration fee (credit card required)
3. Privacy policy URL (we'll provide template)
4. Terms of service URL (we'll provide template)

### Account Setup Steps:

1. Navigate to https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay $5 developer registration fee
4. Verify email address
5. Complete developer profile
```

### Extension Publishing Checklist

```yaml
# .github/chrome-extension-publish.yaml
chrome_extension_requirements:
  manifest:
    - version: "3" # Manifest V3 required
    - permissions:
        - "storage"
        - "activeTab"
        - "https://app.isla.link/*"
    - host_permissions: [] # Minimize permissions

  store_listing:
    required_assets:
      - icon_16x16.png
      - icon_48x48.png
      - icon_128x128.png
      - screenshot_1280x800.png # At least 1, max 5
      - screenshot_640x400.png

    required_text:
      - title: "Isla - Smart Link Management" # Max 45 chars
      - summary: "Shorten, track, and manage links instantly" # Max 132 chars
      - description: | # Max 16,384 chars
          Transform any URL into a trackable short link...
      - privacy_policy_url: "https://isla.link/privacy"
      - terms_of_service_url: "https://isla.link/terms"

    categories:
      primary: "Productivity"
      secondary: "Developer Tools"

  review_process:
    typical_duration: "1-3 business days"
    common_rejections:
      - Missing privacy policy
      - Excessive permissions
      - Misleading description
      - Low quality screenshots
```

### Build & Submission Script

```json
// apps/extension/package.json
{
  "scripts": {
    "build:prod": "vite build --mode production",
    "package": "npm run build:prod && zip -r dist.zip dist/",
    "validate": "web-ext lint",
    "submit:test": "chrome-webstore-upload upload --source dist.zip --auto-publish=false",
    "submit:prod": "chrome-webstore-upload upload --source dist.zip --auto-publish=true"
  }
}
```

## 5. Service Initialization Order

To ensure proper dependency management, services must be initialized in this order:

```typescript
// apps/web/src/lib/services/init.ts
export async function initializeServices() {
  // 1. Environment variables & config
  await loadEnvironmentConfig();

  // 2. Supabase client (required for everything)
  const supabase = await initSupabaseClient();

  // 3. Rate limiters (before any API calls)
  await initRateLimiters();

  // 4. Cache layer (Redis/Memory)
  await initCacheLayer();

  // 5. External service health checks
  const health = await checkExternalServices({
    supabase: true, // Critical
    google_oauth: false, // Non-critical
    geo_lookup: false, // Non-critical
    email: true, // Critical
  });

  if (!health.critical_services_ok) {
    throw new Error("Critical services unavailable");
  }

  // 6. Start background jobs
  await startBackgroundJobs();

  return { supabase, health };
}
```

## 6. Monitoring & Alerts

### Service Health Dashboard

```typescript
// apps/web/app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkSupabase(),
    checkGoogleOAuth(),
    checkGeoService(),
    checkEmailService(),
    checkRedisCache(),
  ]);

  const status = {
    timestamp: new Date().toISOString(),
    services: {
      supabase: checks[0].status === "fulfilled" ? "operational" : "degraded",
      google_oauth: checks[1].status === "fulfilled" ? "operational" : "degraded",
      geo_lookup: checks[2].status === "fulfilled" ? "operational" : "degraded",
      email: checks[3].status === "fulfilled" ? "operational" : "degraded",
      cache: checks[4].status === "fulfilled" ? "operational" : "degraded",
    },
    overall: checks.every((c) => c.status === "fulfilled") ? "operational" : "degraded",
  };

  return Response.json(status);
}
```

## Implementation Timeline

| Task                     | Story | Priority | Effort  |
| ------------------------ | ----- | -------- | ------- |
| Vercel Edge Geo setup    | 3.1   | High     | 2 hours |
| Rate limiting middleware | 1.3   | High     | 3 hours |
| Email fallback queue     | 1.3   | Medium   | 2 hours |
| OAuth fallback UI        | 1.3   | Medium   | 1 hour  |
| Chrome Store prep        | 4.1   | Low      | 2 hours |
| Health monitoring        | 1.2   | Medium   | 2 hours |

**Total Additional Effort: ~12 hours**

## Verification Checklist

- [ ] Geo-location works offline (returns "Unknown")
- [ ] Rate limits prevent abuse without blocking legitimate users
- [ ] Email sending falls back gracefully
- [ ] OAuth failures don't block authentication
- [ ] Chrome extension can be packaged for store
- [ ] All external services have timeout controls
- [ ] Health endpoint accurately reports service status
- [ ] Critical services marked vs non-critical
- [ ] Retry queues implemented for transient failures
- [ ] API usage stays within free/paid tiers
