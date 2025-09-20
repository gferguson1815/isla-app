# Epic 4: Chrome Extension & Viral Features

**Expanded Goal**: This epic delivers the Chrome extension that becomes a key differentiator and growth driver. Users can create links instantly from any webpage, access analytics on-the-go, and share links with built-in viral mechanics. The extension transforms link management from a destination activity to an embedded workflow tool.

## Story 4.1: Chrome Extension Foundation

**As a** developer,
**I want** to set up the Chrome extension infrastructure,
**so that** we can build browser-based functionality.

**Acceptance Criteria:**
1. Chrome extension project structure within monorepo
2. Manifest V3 configuration with appropriate permissions
3. Build pipeline for extension with TypeScript support
4. Shared types and utilities from main app packages
5. Hot reload during development for rapid iteration
6. Extension icon and branding assets in multiple sizes
7. ZIP package generation for Chrome Web Store submission

## Story 4.2: Extension Authentication

**As a** user,
**I want** to authenticate in the extension using my account,
**so that** links are saved to my workspace.

**Acceptance Criteria:**
1. Login button opens main app authentication in new tab
2. Successful auth passes token back to extension
3. Extension stores auth token securely
4. Auto-refresh token before expiration
5. Workspace selector for users with multiple workspaces
6. Sign out clears stored credentials
7. Graceful handling of expired sessions

## Story 4.3: Quick Link Creation

**As a** user,
**I want** to create links instantly from any webpage,
**so that** I can shorten URLs without leaving my workflow.

**Acceptance Criteria:**
1. Extension popup shows current page URL pre-filled
2. Create link with one click using auto-generated slug
3. Custom slug input with validation
4. Copy button for shortened URL with success feedback
5. Link creation completes in under 500ms
6. Option to add tags during creation
7. Recent links list in popup for quick access

## Story 4.4: Extension Analytics View

**As a** user,
**I want** to view link analytics in the extension,
**so that** I can check performance without opening the main app.

**Acceptance Criteria:**
1. Mini analytics view for last created link
2. Total clicks counter with trend indicator
3. Quick stats: clicks today, this week, total
4. Click to open full analytics in new tab
5. Analytics data caches for offline viewing
6. Refresh button to update stats
7. Performance graph for last 7 days

## Story 4.5: Social Sharing Integration

**As a** user,
**I want** built-in sharing options,
**so that** I can distribute links immediately after creation.

**Acceptance Criteria:**
1. Share buttons for major platforms (X/Twitter, LinkedIn, Facebook)
2. Pre-filled share text with shortened URL
3. Customizable share message templates
4. Copy formatted message for Slack/Discord
5. Email share option with mailto link
6. Track shares as events in analytics
7. QR code generation for in-person sharing

## Story 4.6: Viral Mechanics and Branding

**As a** platform operator,
**I want** viral growth features in shared links,
**so that** the platform grows organically through usage.

**Acceptance Criteria:**
1. Optional branded frame on shared links (like Loom)
2. "Powered by [Platform]" footer with signup CTA
3. Referral tracking for users who join via shared links
4. Custom preview metadata for social platforms
5. Link preview shows destination domain for trust
6. Option for users to disable branding (paid feature)
7. A/B test different viral mechanic approaches
