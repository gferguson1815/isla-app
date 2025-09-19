# Technical Assumptions

## Repository Structure: Monorepo
A monorepo approach using Turborepo or Nx to manage the web application, Chrome extension, and future mobile apps in a single repository. This enables code sharing for types, utilities, and UI components while maintaining separate deployment pipelines for each application.

## Service Architecture
**Serverless functions within a Monorepo** - The application uses Next.js API routes and Vercel Edge Functions for all backend logic, with Supabase providing database, authentication, and real-time capabilities. This serverless approach eliminates server management overhead and scales automatically. The architecture separates concerns into:
- Core web application (Next.js)
- High-performance redirect service (Vercel Edge Function)
- Analytics pipeline (Supabase real-time + triggers)
- Background jobs (Supabase Edge Functions with pg_cron)

## Testing Requirements
**Unit + Integration testing** with a focus on critical paths. Unit tests for utility functions and React components using Jest and React Testing Library. Integration tests for API routes and database operations. E2E testing for critical user journeys (signup, link creation, analytics viewing) using Playwright. Manual testing convenience methods in development environment for rapid iteration.

## Testing Strategy & Automation

**Test Coverage Goals**:
- Unit tests: 80% coverage for utilities and components
- Integration tests: 100% coverage for API endpoints
- E2E tests: Critical user journeys only (to minimize maintenance)

**E2E Automation Approach**:
1. **Framework**: Playwright for cross-browser testing
2. **Critical Paths to Automate**:
   - User signup → workspace creation → first link
   - Link creation → redirect → analytics tracking
   - Team invitation → acceptance → collaboration
   - Payment flow → plan upgrade → feature access
3. **Test Environment**:
   - Dedicated Supabase test project with seed data
   - Test data cleanup after each run
   - Parallel test execution for speed
4. **CI/CD Integration**:
   - Run E2E tests on PR merges to main
   - Smoke tests on production after deployment
   - Visual regression testing for UI changes
5. **Local Testing**:
   - `pnpm test:unit` - Fast unit test execution
   - `pnpm test:e2e:local` - E2E against local environment
   - `pnpm test:e2e:staging` - E2E against staging
   - Test data generators for local development

## Additional Technical Assumptions and Requests
- **Frontend Stack**: Next.js 14+ with App Router, TypeScript for type safety, Tailwind CSS for styling, shadcn/ui for component library
- **Database**: Supabase PostgreSQL with Row Level Security for multi-tenancy, optimized indexes for analytics queries
- **Authentication**: Supabase Auth with magic links (passwordless email) and Google OAuth for social login
- **State Management**: React Context + Zustand for client state, React Query for server state
- **Payment Processing**: Stripe for subscriptions with webhook handling for plan changes
- **Email Service**: Resend for transactional emails (welcome, magic links, receipts)
- **Error Tracking**: Sentry for production error monitoring and performance tracking
- **Analytics**: Plausible for privacy-focused product analytics, Vercel Analytics for performance monitoring
- **Feature Flags**: Vercel Edge Config for gradual rollouts and A/B testing
- **Development Tools**: Prettier, ESLint, Husky for code quality, GitHub Actions for CI/CD
- **Performance Budget**: Initial bundle size <100KB, Time to Interactive <3s on 3G
- **Data Retention**: 90 days of analytics data on free tier, unlimited on paid plans

## Data Migration & Schema Evolution Strategy

**Migration Principles**:
1. **Zero-downtime migrations** - All changes must be backwards compatible
2. **Reversible migrations** - Every migration includes rollback plan
3. **Data integrity first** - Never lose user data during migrations

**Migration Approach**:
1. **Versioned Migrations**:
   - Use Supabase CLI for migration management
   - Sequential migration files (001_initial.sql, 002_add_campaigns.sql)
   - Each migration atomic and tested independently

2. **Schema Evolution Pattern**:
   - **Add-only for new features**: New columns nullable or with defaults
   - **Deprecate before delete**: Mark columns deprecated, remove in next major version
   - **Expand-contract for changes**: Add new column, migrate data, remove old column

3. **Post-MVP Migration Examples**:
   ```sql
   -- Adding custom domains (Epic 6)
   ALTER TABLE links ADD COLUMN custom_domain_id UUID REFERENCES custom_domains(id);

   -- Adding conversion tracking (Epic 10)
   ALTER TABLE click_events ADD COLUMN conversion_value DECIMAL;
   ALTER TABLE click_events ADD COLUMN conversion_timestamp TIMESTAMPTZ;
   ```

4. **Migration Testing**:
   - Test migrations on copy of production data
   - Automated migration tests in CI pipeline
   - Rollback procedures tested before production

5. **Data Backups**:
   - Automatic daily backups via Supabase
   - Pre-migration snapshots for major changes
   - Point-in-time recovery capability

## Monitoring & Observability

**Redirect Service Monitoring**:
1. **Performance Metrics**:
   - P50, P95, P99 latency per region
   - Request volume per second
   - Cache hit rates
   - Cold start frequency
   - Error rates by type (404, 500, timeout)

2. **Monitoring Stack**:
   - **Vercel Analytics**: Edge function performance
   - **Sentry**: Error tracking with performance monitoring
   - **Custom Metrics**: Via Vercel KV for business metrics
   - **Uptime Monitoring**: BetterUptime or similar for redirect availability

3. **Alert Thresholds**:
   - P95 latency > 100ms (warning), > 200ms (critical)
   - Error rate > 0.1% (warning), > 1% (critical)
   - Redirect service downtime > 30 seconds (page immediately)
   - Database connection pool exhaustion

4. **Dashboard Requirements**:
   - Real-time redirect performance by region
   - Link creation and click trends
   - Error distribution and patterns
   - System health indicators
   - User activity heatmaps

5. **Logging Strategy**:
   - Structured JSON logging
   - Log levels: ERROR (always), WARN (production), INFO (staging), DEBUG (development)
   - Log retention: 30 days for production, 7 days for staging
   - Searchable logs via Vercel/Sentry integration
