# Epic 5: Platform Administration

**Expanded Goal**: This epic provides super admin capabilities for platform operators to manage the entire system. Administrators can monitor platform health, manage users and workspaces, configure features, and handle support issues. This creates the operational foundation for running the platform as a business.

## Story 5.1: Admin Authentication and Access Control

**As a** platform operator,
**I want** secure admin access separate from regular users,
**so that** administrative functions are protected.

**Acceptance Criteria:**
1. Separate admin login route (/admin) with enhanced security
2. Admin accounts flagged in database with is_super_admin field
3. Two-factor authentication required for admin accounts
4. Admin sessions timeout after 30 minutes of inactivity
5. Audit log entry for every admin login
6. IP allowlist option for admin access
7. Separate admin JWT tokens with admin-specific claims

## Story 5.2: User Management Interface

**As a** platform admin,
**I want** to view and manage all platform users,
**so that** I can provide support and enforce policies.

**Acceptance Criteria:**
1. Searchable user list with filters (date joined, plan, status)
2. User detail view showing workspaces, links created, usage stats
3. Ability to impersonate users for debugging (with audit log)
4. Suspend/unsuspend user accounts with reason
5. Manual plan override for special cases
6. Password reset and email verification triggers
7. Export user data for GDPR compliance

## Story 5.3: Workspace Administration

**As a** platform admin,
**I want** to manage all workspaces across the platform,
**so that** I can monitor usage and handle violations.

**Acceptance Criteria:**
1. List all workspaces with member counts and activity metrics
2. View workspace details including all links and analytics
3. Suspend workspaces for terms violations
4. Override workspace limits for special customers
5. Transfer workspace ownership between users
6. Delete workspaces with full data purge option
7. Workspace activity timeline showing key events

## Story 5.4: Platform Configuration Management

**As a** platform admin,
**I want** to configure platform settings dynamically,
**so that** I can adjust features without deployments.

**Acceptance Criteria:**
1. Feature flags interface for enabling/disabling features
2. Configure rate limits per tier (free, paid)
3. Set platform-wide limits (max links, workspaces, team members)
4. Customize email templates for system notifications
5. Configure pricing tiers and features
6. Maintenance mode toggle with custom message
7. Save configuration changes with version history

## Story 5.5: Platform Analytics Dashboard

**As a** platform admin,
**I want** to monitor platform health and growth metrics,
**so that** I can make informed business decisions.

**Acceptance Criteria:**
1. Real-time metrics: active users, links created, clicks processed
2. Growth charts: users, revenue, usage over time
3. System health: API latency, error rates, database performance
4. Top users and workspaces by usage
5. Conversion funnel: signup → activation → payment
6. Churn analysis and cohort retention
7. Export reports for investor updates

## Story 5.6: Support Tools

**As a** platform admin,
**I want** tools to handle support requests efficiently,
**so that** I can maintain user satisfaction.

**Acceptance Criteria:**
1. Link inspection tool to debug redirect issues
2. Bulk email interface for announcements
3. Coupon/credit system for promotions and refunds
4. User communication log to track support interactions
5. Automated alerts for suspicious activity (spam, abuse)
6. Database query interface for ad-hoc investigations (read-only)
7. Backup and restore tools for user data recovery
