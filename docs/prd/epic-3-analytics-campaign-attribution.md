# Epic 3: Analytics & Campaign Attribution

**Expanded Goal**: This epic delivers comprehensive analytics capabilities that transform raw click data into actionable marketing insights. Users gain visibility into link performance, audience behavior, and campaign effectiveness through beautiful visualizations and real-time updates. This positions the platform as a serious analytics tool beyond basic link shortening.

## Story 3.1: Enhanced Analytics Data Collection

**As a** marketer,
**I want** detailed visitor information captured,
**so that** I can understand my audience demographics and behavior.

**Acceptance Criteria:**
1. Capture browser type and version from user agent
2. Capture device type (desktop, mobile, tablet) and OS
3. Capture referrer source with proper attribution
4. Geo-location from IP (country, region, city) using edge function
5. Store raw and processed data efficiently in analytics tables
6. Privacy-compliant data collection (hash IPs, respect DNT)
7. Background job processes raw events into aggregated metrics

## Story 3.2: Analytics Dashboard UI

**As a** user,
**I want** comprehensive analytics visualizations,
**so that** I can understand link performance at a glance.

**Acceptance Criteria:**
1. Time-series chart with customizable date ranges (24h, 7d, 30d, custom)
2. Geographic heat map showing clicks by country
3. Top referrers list with click counts and percentages
4. Device and browser breakdown pie charts
5. Click timeline showing individual events with details
6. Dashboard loads in under 2 seconds with 10,000+ events
7. Export data as CSV for external analysis

## Story 3.3: UTM Parameter Management

**As a** marketer,
**I want** automatic UTM parameter handling,
**so that** I can track campaign attribution accurately.

**Acceptance Criteria:**
1. UTM builder interface in link creation form
2. Auto-populate UTM fields from pasted URLs
3. Save UTM templates for reuse across campaigns
4. Preserve existing UTMs when shortening URLs
5. UTM parameter validation and suggestions
6. Display UTM values in link details
7. Filter analytics by UTM parameters

## Story 3.4: Campaign Grouping and Reporting

**As a** marketer,
**I want** to group links into campaigns,
**so that** I can measure overall campaign performance.

**Acceptance Criteria:**
1. Create campaigns with name, date range, and goals
2. Assign multiple links to a single campaign
3. Campaign overview showing aggregate metrics
4. Compare performance across campaigns
5. Campaign tags for organization
6. Automated campaign detection from UTM parameters
7. Campaign performance email reports (weekly digest)

## Story 3.5: Real-time Analytics Updates

**As a** user,
**I want** analytics to update in real-time,
**so that** I can monitor active campaigns immediately.

**Acceptance Criteria:**
1. WebSocket connection for real-time updates
2. Click counter animates when new clicks arrive
3. Live activity feed shows clicks as they happen
4. Real-time chart updates without page refresh
5. Connection status indicator with auto-reconnect
6. Graceful fallback to polling if WebSocket fails
7. Performance maintained with 100+ concurrent users

## Story 3.6: Workspace Analytics Overview

**As a** team lead,
**I want** workspace-level analytics,
**so that** I can understand overall team performance.

**Acceptance Criteria:**
1. Workspace dashboard shows total clicks across all links
2. Top performing links leaderboard
3. Team member activity metrics (links created, clicks generated)
4. Growth trends over time (links, clicks, campaigns)
5. Workspace health score based on activity
6. Comparison periods (vs last week, month)
7. Role-based access to workspace analytics (admins only)
