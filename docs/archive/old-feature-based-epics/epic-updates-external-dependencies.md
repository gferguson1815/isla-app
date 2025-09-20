# Epic Updates - External Dependencies Integration

## Purpose
This document provides specific story updates to integrate the external dependency specifications into the existing epics, ensuring all third-party services are properly configured before use.

---

## Epic 1 Updates

### Story 1.2: Supabase Setup and Database Schema
**ADD to Acceptance Criteria:**
```markdown
7. Rate limiting configuration:
   - Configure Supabase Auth rate limits (30 signups/hour per IP)
   - Set up magic link limits (10/hour per email)
   - Implement rate limit tracking table
   - Add rate limit error messages

8. Service health monitoring:
   - Create health check endpoint for Supabase connectivity
   - Implement connection pool monitoring
   - Set up automatic reconnection logic
```

### Story 1.3: Authentication Flow
**ADD to Acceptance Criteria:**
```markdown
8. Fallback authentication mechanisms:
   - If Google OAuth fails, automatically show magic link option
   - Queue failed magic link emails for retry (max 3 attempts)
   - Display user-friendly error messages for rate limits
   - Implement exponential backoff for retries

9. Rate limit protection:
   - Client-side rate limit detection and UI feedback
   - Show countdown timer when rate limited
   - Suggest alternative auth method when limited
```

### NEW Story 1.7: External Service Configuration
**As a** developer,
**I want** to configure and validate all external service integrations,
**so that** the application handles service failures gracefully.

**Acceptance Criteria:**
1. Create environment variable validation script that checks:
   - All required API keys are present
   - URLs are properly formatted
   - Credentials have correct permissions
2. Implement service initialization order:
   - Load environment config
   - Initialize Supabase client
   - Set up rate limiters
   - Configure cache layer
   - Run health checks
3. Create fallback configuration for each service:
   - Geo-location: Vercel Edge → IP-API → "Unknown"
   - Email: Supabase → Queue for retry
   - OAuth: Google → Magic link
4. Add service status dashboard at `/api/health`:
   - Real-time status for all external services
   - Response time metrics
   - Error rate tracking
5. Implement circuit breaker pattern for external APIs:
   - Auto-disable failing services after 5 consecutive failures
   - Retry after 30 seconds with exponential backoff
6. Create monitoring alerts for:
   - Service degradation
   - Rate limit approaching (80% threshold)
   - Authentication failures spike

---

## Epic 3 Updates

### Story 3.1: Enhanced Analytics Data Collection
**REPLACE vague geo-location with specific implementation:**

**Original Acceptance Criteria #4:**
~~4. Geo-location from IP (country, region, city) using edge function~~

**NEW Acceptance Criteria #4:**
```markdown
4. Geo-location data collection using Vercel Edge:
   - Primary: Use Vercel's req.geo object (no API needed)
   - Capture: country (ISO 3166-1), region, city, lat/long
   - Fallback: Return "XX" country code if unavailable
   - Cache geo data for 24 hours to reduce lookups
   - Store in click_events: geo_country, geo_region, geo_city fields
   - Add geo_lookup_method field to track data source
```

**ADD to Acceptance Criteria:**
```markdown
8. Geo-location service configuration:
   - Enable Vercel Edge runtime for redirect function
   - Implement IP-to-geo caching strategy
   - Add geo data validation before storage
   - Handle missing/invalid geo data gracefully
   - Create geo analytics aggregation job
```

### NEW Story 3.7: Analytics Service Resilience
**As a** developer,
**I want** analytics to continue working even if external services fail,
**so that** we never lose click tracking data.

**Acceptance Criteria:**
1. Implement analytics event queue:
   - Store events locally if database is unavailable
   - Retry failed events with exponential backoff
   - Maximum queue size: 10,000 events
   - Persist queue to localStorage/Redis
2. Graceful degradation for geo-location:
   - If Vercel geo unavailable, mark as "Unknown"
   - Continue tracking all other metrics
   - Log geo service failures for monitoring
3. Implement analytics batch processing:
   - Batch insert events every 100ms or 50 events
   - Reduce database write pressure
   - Improve performance during traffic spikes
4. Add analytics service health metrics:
   - Track event processing latency
   - Monitor queue depth
   - Alert on processing delays > 5 seconds

---

## Epic 4 Updates

### Story 4.1: Chrome Extension Foundation
**ADD to Acceptance Criteria:**
```markdown
8. Chrome Web Store preparation:
   - Generate all required icon sizes (16x16, 48x48, 128x128)
   - Create 5 screenshots (1280x800 and 640x400)
   - Write store listing description (< 16,384 chars)
   - Prepare privacy policy page at /privacy
   - Prepare terms of service page at /terms
9. Extension permissions optimization:
   - Use minimum required permissions
   - Implement optional permissions for advanced features
   - Add permission justification in description
10. Publishing automation:
   - Create build script for production package
   - Add version bumping automation
   - Implement ZIP packaging with correct structure
   - Add Chrome Web Store upload API integration
```

### NEW Story 4.7: Chrome Web Store Submission
**As a** product owner,
**I want** the extension published to Chrome Web Store,
**so that** users can easily install it.

**Acceptance Criteria:**
1. Developer account setup (User Responsibility):
   - Register at chrome.google.com/webstore/devconsole
   - Pay $5 one-time developer fee
   - Verify email and complete profile
2. Store listing preparation:
   - Title: "Isla - Smart Link Management" (45 chars max)
   - Summary: "Shorten, track, and manage links instantly" (132 chars)
   - Full description with features and benefits
   - Category: Productivity (primary), Developer Tools (secondary)
3. Compliance documents:
   - Privacy policy covering data collection and usage
   - Terms of service for extension usage
   - Data usage disclosure for Chrome Web Store
4. Asset preparation:
   - All icons in PNG format with transparency
   - Screenshots showing key features
   - Promotional images if featuring is desired
5. Initial submission:
   - Submit for review with auto-publish disabled
   - Expected review time: 1-3 business days
   - Monitor review status and respond to feedback
6. Post-approval:
   - Enable auto-publish for future updates
   - Set up automated deployment pipeline
   - Configure update notifications for users

---

## Epic 5 Updates

### Story 5.1: Admin Dashboard Foundation
**ADD External Service Monitoring:**
```markdown
7. External service monitoring panel:
   - Real-time status for all third-party services
   - API usage metrics vs. rate limits
   - Cost tracking for paid services
   - Alert configuration for service issues
8. Service override controls:
   - Temporarily disable failing services
   - Switch between primary/fallback providers
   - Adjust rate limiting thresholds
   - Force cache clearing for geo data
```

---

## Implementation Priority Matrix

| Priority | Stories | Reason |
|----------|---------|--------|
| **P0 - Critical** | 1.7 (External Service Config) | Blocks all external integrations |
| **P1 - High** | 1.2 & 1.3 updates (Rate limits) | Prevents service abuse |
| **P2 - Medium** | 3.1 updates (Geo-location) | Enhances analytics but not blocking |
| **P3 - Low** | 4.7 (Chrome Store) | Can be done in parallel |

---

## Success Criteria

### All External Dependencies Must:
- [ ] Have explicit service provider identified
- [ ] Include rate limits and quotas
- [ ] Define fallback strategies
- [ ] Implement health monitoring
- [ ] Include cost implications
- [ ] Have timeout controls
- [ ] Support offline development
- [ ] Include retry logic
- [ ] Generate meaningful error messages
- [ ] Log failures for debugging

### Before Moving to Development:
- [ ] All API keys and accounts documented
- [ ] Service initialization order defined
- [ ] Rate limiting strategy implemented
- [ ] Fallback chains tested
- [ ] Monitoring dashboards configured
- [ ] Cost alerts set up
- [ ] Recovery procedures documented

---

## Cost Summary

### Monthly Costs (MVP Scale):
| Service | Tier | Cost | Usage Limits |
|---------|------|------|--------------|
| Supabase | Pro | $25 | 100K auth requests |
| Vercel | Pro | $20 | 1M edge requests |
| Google OAuth | Free | $0 | 10K daily |
| IP-API | Free | $0 | 45 req/min |
| **Total** | | **$45** | Per month |

### One-Time Costs:
| Item | Cost | Paid By |
|------|------|---------|
| Chrome Developer Account | $5 | User/Company |
| Domain (isla.link) | ~$30/year | User/Company |

---

## Risk Mitigation

### High Risk - Service Outages
**Mitigation:** Every external service has a fallback or queue mechanism

### Medium Risk - Rate Limit Exceeded
**Mitigation:** Client-side throttling, caching, and user feedback

### Low Risk - Cost Overrun
**Mitigation:** Usage monitoring, alerts at 80% threshold, automatic scaling limits

---

## Developer Checklist

Before starting implementation:
- [ ] Read external-dependencies-specifications.md
- [ ] Verify all API accounts are created
- [ ] Test each service individually
- [ ] Confirm rate limits match documentation
- [ ] Implement health check endpoints
- [ ] Set up monitoring dashboards
- [ ] Test fallback scenarios
- [ ] Document any deviations

This completes the external dependency specifications and story updates.