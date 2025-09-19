# Security and Performance

## Security Requirements

**Frontend Security:**

- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; style-src 'self' 'unsafe-inline';`
- XSS Prevention: React's automatic escaping + DOMPurify for user content
- Secure Storage: httpOnly cookies for sessions, no sensitive data in localStorage

**Backend Security:**

- Input Validation: Zod schemas on all API inputs
- Rate Limiting: 100 req/min per IP for APIs, 1000 req/min for redirects
- CORS Policy: Strict origin checking, credentials required

**Authentication Security:**

- Token Storage: httpOnly cookies with SameSite=strict
- Session Management: 24hr access tokens, 7 day refresh tokens
- Password Policy: Magic links preferred, OAuth for social

**Environment-Specific Security:**

- Local: Relaxed CORS for development
- Development: Test SSL certificates, basic auth for admin
- Production: Full SSL, IP allowlisting, 2FA required for admin

## Performance Optimization

**Frontend Performance:**

- Bundle Size Target: <100KB initial JS (achieved via code splitting)
- Loading Strategy: Progressive enhancement, critical CSS inlined
- Caching Strategy:
  - Local: No caching
  - Dev: 5 minute CDN cache
  - Prod: 1 hour CDN cache, stale-while-revalidate

**Backend Performance:**

- Response Time Target: <50ms for redirects, <200ms for API calls
- Database Optimization: Indexes on all foreign keys, materialized views for analytics
- Caching Strategy:
  - Local: In-memory cache (no Redis needed)
  - Dev: Upstash Redis with 5min TTL
  - Prod: Upstash Redis with 24hr TTL
