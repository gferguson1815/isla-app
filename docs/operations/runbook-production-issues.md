# Production Issues Runbook

## Purpose
This runbook provides step-by-step procedures for diagnosing and resolving common production issues with the Isla platform.

## Critical Contacts

| Role | Contact | When to Contact |
|------|---------|-----------------|
| On-Call Engineer | PagerDuty | All incidents |
| Platform Lead | @platform-lead | P0/P1 incidents |
| Supabase Support | support@supabase.com | Database issues |
| Vercel Support | support@vercel.com | Deployment/CDN issues |
| Stripe Support | support@stripe.com | Payment issues |

## Incident Severity Levels

- **P0 (Critical)**: Complete outage, data loss risk, security breach
- **P1 (High)**: Major feature broken, >30% users affected
- **P2 (Medium)**: Minor feature broken, <30% users affected
- **P3 (Low)**: Cosmetic issues, workarounds available

## Common Issues & Solutions

### 1. Redirect Service Down

**Symptoms:**
- Links return 404 or timeout
- Monitoring shows redirect latency > 1s
- Users report "link not working"

**Diagnosis:**
```bash
# Check Vercel Edge Function status
curl -I https://app.isla.link/api/health

# Check specific redirect
curl -I https://isla.link/test-slug

# View Vercel function logs
vercel logs app.isla.link --follow
```

**Resolution:**
1. Check Vercel status page: https://vercel-status.com
2. Verify Edge Function deployment:
   ```bash
   vercel ls app.isla.link
   vercel inspect [deployment-id]
   ```
3. If function error, check recent deployments:
   ```bash
   vercel rollback app.isla.link
   ```
4. If database connection issue, see "Database Connection Issues"

**Post-Incident:**
- Add monitoring for specific failure
- Review Edge Function error handling

### 2. Database Connection Issues

**Symptoms:**
- "Too many connections" errors
- Slow queries or timeouts
- Analytics not updating

**Diagnosis:**
```sql
-- Check connection count (run in Supabase SQL Editor)
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Check database size
SELECT pg_database_size('postgres') / 1024 / 1024 as size_mb;
```

**Resolution:**
1. **Too many connections:**
   ```sql
   -- Kill idle connections
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle' AND state_change < now() - interval '10 minutes';
   ```

2. **Connection pool exhausted:**
   - Restart Vercel deployment to reset pools
   - Check for connection leaks in code

3. **Database performance:**
   ```sql
   -- Run vacuum
   VACUUM ANALYZE;

   -- Check missing indexes
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE schemaname = 'public' AND n_distinct > 100
   ORDER BY n_distinct DESC;
   ```

### 3. Authentication Failures

**Symptoms:**
- Users can't sign in
- Magic links not working
- OAuth errors

**Diagnosis:**
```bash
# Check Supabase Auth logs
supabase logs --service auth --tail

# Test magic link
curl -X POST https://[project].supabase.co/auth/v1/magiclink \
  -H "apikey: [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Check Google OAuth
curl https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=[token]
```

**Resolution:**
1. **Magic links not sending:**
   - Check email service (Supabase Auth settings)
   - Verify SMTP configuration
   - Check rate limits (10/hour per email)

2. **OAuth failing:**
   - Verify Google Cloud Console credentials
   - Check redirect URIs match
   - Ensure quota not exceeded

3. **Session issues:**
   - Clear Redis cache if using
   - Check JWT expiration settings

### 4. Payment Processing Failures

**Symptoms:**
- Subscription creation fails
- Payment declined errors
- Webhooks not processing

**Diagnosis:**
```bash
# Check Stripe webhook events
stripe events list --limit 10

# Test webhook endpoint
stripe trigger payment_intent.succeeded

# View failed payments
stripe payments list --limit 10 --status failed
```

**Resolution:**
1. **Webhook failures:**
   ```bash
   # Replay failed webhooks
   stripe events resend [event-id]

   # Verify webhook secret
   stripe listen --print-secret
   ```

2. **Subscription issues:**
   - Check customer exists in Stripe
   - Verify price IDs match
   - Check subscription status

3. **Database sync:**
   ```sql
   -- Check subscription status
   SELECT * FROM subscriptions
   WHERE updated_at < now() - interval '1 hour'
   AND status = 'active';
   ```

### 5. High Memory/CPU Usage

**Symptoms:**
- Slow page loads
- Function timeouts
- High Vercel usage alerts

**Diagnosis:**
```bash
# Check Vercel metrics
vercel inspect [deployment-id] --metrics

# Monitor function execution
vercel logs app.isla.link --follow | grep "Duration"

# Check bundle size
npm run analyze
```

**Resolution:**
1. **Memory leaks:**
   - Redeploy to fresh containers
   - Check for infinite loops in code
   - Review recent code changes

2. **High CPU:**
   - Check for N+1 queries
   - Review analytics aggregation queries
   - Enable caching for expensive operations

3. **Bundle size:**
   - Run production build analysis
   - Check for accidental dev dependencies
   - Review dynamic imports

### 6. Analytics Data Inconsistencies

**Symptoms:**
- Click counts don't match
- Missing geographic data
- Delayed analytics updates

**Diagnosis:**
```sql
-- Check click event processing lag
SELECT MAX(created_at) as last_event FROM click_events;

-- Verify aggregation jobs
SELECT * FROM pg_cron_job_status WHERE status != 'succeeded';

-- Check for duplicate events
SELECT slug, COUNT(*) as count
FROM click_events
WHERE created_at > now() - interval '1 hour'
GROUP BY slug, visitor_id, created_at
HAVING COUNT(*) > 1;
```

**Resolution:**
1. **Processing delays:**
   - Check background job queue
   - Verify cron jobs running
   - Manual aggregation trigger if needed

2. **Missing data:**
   ```sql
   -- Rebuild analytics for date range
   INSERT INTO analytics_daily
   SELECT date_trunc('day', created_at), slug, COUNT(*)
   FROM click_events
   WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31'
   GROUP BY 1, 2
   ON CONFLICT (date, slug) DO UPDATE
   SET clicks = EXCLUDED.clicks;
   ```

## Monitoring & Alerts

### Health Check Endpoints
```bash
# Main application
curl https://app.isla.link/api/health

# Redirect service
curl https://isla.link/health

# Database
curl https://[project].supabase.co/rest/v1/

# Payment webhook
curl https://app.isla.link/api/webhooks/stripe/health
```

### Key Metrics to Monitor

| Metric | Normal Range | Alert Threshold |
|--------|-------------|-----------------|
| Redirect Latency | < 50ms p95 | > 200ms |
| API Response Time | < 200ms p95 | > 500ms |
| Error Rate | < 0.1% | > 1% |
| Database Connections | < 50 | > 80 |
| Click Processing Lag | < 1s | > 5s |
| Payment Success Rate | > 95% | < 90% |

## Emergency Procedures

### Full Outage Response
1. Acknowledge incident in PagerDuty
2. Create incident channel in Slack: #incident-YYYY-MM-DD
3. Assign roles: Incident Commander, Investigator, Communicator
4. Begin investigation using runbook
5. Update status page every 30 minutes
6. Implement fix or rollback
7. Verify resolution
8. Write post-mortem within 48 hours

### Data Recovery
```bash
# Supabase automatic backups (Point-in-Time Recovery)
# Available for Pro plan - 7 day retention

# Manual backup
pg_dump [connection-string] > backup-$(date +%Y%m%d).sql

# Restore from backup
psql [connection-string] < backup-20240101.sql
```

### Emergency Rollback
```bash
# Vercel instant rollback
vercel rollback app.isla.link

# Database migration rollback
supabase migration revert

# DNS rollback (if needed)
# Update Vercel domain settings to point to previous deployment
```

## Communication Templates

### Status Page Update
```
We are currently investigating an issue affecting [service].
Impact: [description of impact]
Next update in 30 minutes.
```

### Customer Communication
```
Subject: [Service] Disruption - [Date]

We experienced a service disruption affecting [feature] from [start] to [end].

Impact: [what users experienced]
Root cause: [brief explanation]
Resolution: [what we did]
Prevention: [what we're doing to prevent recurrence]

We apologize for any inconvenience.
```

## Post-Incident Checklist

- [ ] Incident resolved and verified
- [ ] Status page updated to "Resolved"
- [ ] Customer communications sent if needed
- [ ] Metrics and monitoring verified normal
- [ ] Post-mortem scheduled
- [ ] Action items documented
- [ ] Runbook updated with learnings

## Escalation Path

1. **Level 1** (0-15 min): On-call engineer
2. **Level 2** (15-30 min): Platform lead + Senior engineer
3. **Level 3** (30+ min): CTO + External support (Vercel/Supabase)
4. **Level 4** (1hr+): CEO (for customer communication)

---

**Last Updated**: [Date]
**Next Review**: [Quarterly]
**Owner**: Platform Team