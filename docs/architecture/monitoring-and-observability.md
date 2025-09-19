# Monitoring and Observability

## Monitoring Stack by Environment

**Local Environment:**

- Console logging only
- No external monitoring

**Development Environment:**

- Sentry for error tracking
- Vercel Analytics for performance
- PostHog for user analytics
- Uptime monitoring (optional)

**Production Environment:**

- Sentry for error tracking and performance
- Vercel Analytics for Core Web Vitals
- PostHog for user analytics and session recording
- BetterUptime for availability monitoring
- Custom dashboards for business metrics

## Key Metrics

**Frontend Metrics:**

- Core Web Vitals (LCP, FID, CLS)
- JavaScript error rate
- API response times
- User interaction tracking

**Backend Metrics:**

- Request rate by endpoint
- Error rate by status code
- P50, P95, P99 latencies
- Database query performance

**Redirect Service Metrics:**

- Redirect latency by region
- Cache hit rate (target >95%)
- Click processing lag
- Geographic distribution
