# MVP Missing Features - Critical Additions

## Executive Summary

This document addresses three critical gaps in the MVP scope that prevent achieving stated business goals:
1. **Payment System** - Required for "100+ paying customers by Month 3" goal
2. **Bulk CSV Upload** - Required by FR5, critical for spreadsheet migration
3. **QR Code Generation** - Partially mentioned, needs full specification

## Critical Addition 1: Payment & Billing System

### Why This Is Critical
- **Business Goal**: "100+ active paying customers by Month 3"
- **Current Gap**: No way to collect payment or manage subscriptions
- **Impact**: Cannot monetize without payment system
- **Timeline Impact**: Stripe integration takes 2-3 days minimum

### New Stories for Epic 2 (Team Workspaces)

#### Story 2.7: Billing Foundation & Stripe Integration

**As a** platform operator,
**I want** to integrate Stripe for payment processing,
**so that** we can collect payments and manage subscriptions.

**Acceptance Criteria:**
1. Stripe account created and configured (User responsibility)
2. Stripe Customer objects created for each workspace
3. Products and Price objects configured for tiers:
   - Free: $0 (3 users, 100 links, 1000 clicks/month)
   - Starter: $19/month (10 users, 1000 links, 10K clicks)
   - Growth: $49/month (unlimited users, 10K links, 100K clicks)
4. Webhook endpoint for Stripe events (subscription updates)
5. Database tables for subscriptions, invoices, usage tracking
6. Payment method management (add/update/remove cards)
7. PCI compliance via Stripe Elements (no card data stored)
8. Test mode for development with test cards

#### Story 2.8: Subscription Management UI

**As a** workspace admin,
**I want** to upgrade, downgrade, or cancel subscriptions,
**so that** I can control workspace costs.

**Acceptance Criteria:**
1. Billing page shows current plan and usage
2. Plan comparison table with feature matrix
3. Upgrade flow with payment collection
4. Downgrade flow with data retention warnings
5. Usage meters showing limits (links, clicks, users)
6. Billing history with downloadable invoices
7. Update payment method interface
8. Cancel subscription with retention period
9. Trial period: 14 days for new workspaces
10. Grace period: 7 days for failed payments

#### Story 2.9: Usage Limits & Enforcement

**As a** system,
**I want** to enforce plan limits,
**so that** users upgrade when they exceed free/starter tiers.

**Acceptance Criteria:**
1. Real-time usage tracking (links, clicks, team members)
2. Soft limits with warnings at 80% usage
3. Hard limits blocking actions when exceeded:
   - Cannot create links over limit
   - Cannot invite users over limit
   - Clicks still tracked but analytics limited
4. Upgrade prompts when limits reached
5. Daily usage reset for click limits
6. Monthly usage reset for link/user limits
7. Email notifications for limit warnings
8. Admin override capability for special cases

### Implementation Timeline
- Day 11-12: Stripe integration and database (alongside Epic 3B)
- Day 13: Subscription UI (parallel with Epic 4)
- Day 14: Usage limits and enforcement
- Total: 3-4 days additional work

## Critical Addition 2: Bulk CSV Upload

### Why This Is Critical
- **Requirement**: FR5 explicitly requires CSV upload (100 links)
- **User Need**: Migrate from spreadsheet tracking
- **Competitor Parity**: All competitors offer bulk import
- **Implementation**: Relatively simple, high value

### New Story for Epic 2

#### Story 2.10: Bulk Link Import via CSV

**As a** marketer,
**I want** to upload a CSV of URLs to create multiple links at once,
**so that** I can migrate from spreadsheet tracking quickly.

**Acceptance Criteria:**
1. CSV upload interface accepting .csv files up to 5MB
2. CSV format validation and preview:
   - Required: destination_url
   - Optional: custom_slug, title, tags, folder
   - Template CSV downloadable
3. Validation rules:
   - Valid URLs required
   - Duplicate slug detection
   - Maximum 100 links for MVP (1000 for paid)
4. Import preview showing:
   - Valid links (green)
   - Invalid links with errors (red)
   - Duplicates to skip (yellow)
5. Bulk creation process:
   - Progress bar during import
   - Partial success handling
   - Error report downloadable
6. Performance: 100 links imported in < 10 seconds
7. Import history log for workspace
8. Undo option within 5 minutes of import

### Implementation Timeline
- Day 9: Add to Epic 2 (Workspaces)
- Total: 0.5 days additional work

## Critical Addition 3: QR Code Generation

### Why This Is Important
- **Mentioned**: Epic 4, Story 4.5 references QR codes
- **Use Case**: Physical marketing materials, events
- **Differentiation**: Not all competitors offer this
- **Implementation**: Can use existing libraries

### New Story for Epic 3A

#### Story 3.7: QR Code Generation for Links

**As a** marketer,
**I want** to generate QR codes for my short links,
**so that** I can use them in print materials and physical locations.

**Acceptance Criteria:**
1. QR code generation button on link details
2. QR code options:
   - Size: Small (200px), Medium (400px), Large (800px)
   - Format: PNG, SVG
   - Error correction: Low, Medium, High
   - Custom colors (paid feature)
   - Logo embedding (paid feature)
3. Download QR code with filename: `{slug}-qr.png`
4. QR code preview in link table (hover state)
5. Bulk QR export for multiple links (ZIP file)
6. QR codes cached for performance
7. Analytics track QR code scans separately
8. QR code page with all codes for workspace

### Implementation Timeline
- Day 7: Add to Epic 3A (Individual Analytics)
- Total: 0.5 days additional work

## Updated Epic Timeline with Additions

### Week 1: Foundation (Unchanged)
- Days 1-5: Epic 1 - Foundation & Core Link Management

### Week 2: Analytics, Teams & Import
- Days 6-7: Epic 3A - Individual Analytics + **QR Codes**
- Days 8-9: Epic 2 - Team Workspaces + **CSV Upload**
- Day 10: Buffer/Polish

### Week 3: Monetization & Growth
- Days 11-12: Epic 3B - Team Analytics + **Stripe Integration**
- Day 13: Epic 4 - Chrome Extension + **Subscription UI**
- Day 14: Epic 5 - Platform Admin + **Usage Limits**
- Day 15: Testing & Polish

## Total Impact

### Timeline Impact
- Original: 15 days
- With additions: 17-18 days
- Can compress to 15 days with parallel work

### Complexity Impact
- Payment system adds significant complexity
- Requires additional testing for money handling
- Needs terms of service and privacy policy updates

### Resource Impact
- May need dedicated developer for payment system
- QR and CSV can be handled by main team
- Additional QA needed for payment flows

## Stripe Integration Details

### Products & Pricing Configuration
```javascript
// Stripe Product/Price Setup (One-time)
const products = {
  starter: {
    name: 'Isla Starter',
    price: 1900, // $19.00
    interval: 'month',
    metadata: {
      users: '10',
      links: '1000',
      clicks: '10000'
    }
  },
  growth: {
    name: 'Isla Growth',
    price: 4900, // $49.00
    interval: 'month',
    metadata: {
      users: 'unlimited',
      links: '10000',
      clicks: '100000'
    }
  }
};
```

### Database Schema Additions
```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_name TEXT NOT NULL, -- 'free', 'starter', 'growth'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  metric_type TEXT NOT NULL, -- 'links', 'clicks', 'users'
  count INTEGER NOT NULL DEFAULT 0,
  limit_amount INTEGER NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table (cached from Stripe)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  stripe_invoice_id TEXT UNIQUE,
  amount_paid INTEGER,
  amount_due INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT,
  invoice_pdf TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## User Responsibilities for Payment System

### Before Development
1. Create Stripe account at stripe.com
2. Complete Stripe identity verification
3. Set up bank account for payouts
4. Obtain API keys (test and production)

### During Development
1. Review and approve pricing tiers
2. Create Terms of Service mentioning payments
3. Create Refund Policy
4. Set up customer support email

### Before Launch
1. Enable Stripe production mode
2. Complete PCI compliance questionnaire
3. Set up tax handling (if required)
4. Configure payout schedule

## Success Criteria

With these additions, the MVP will:
- ✅ Support monetization from day one
- ✅ Allow easy migration from spreadsheets
- ✅ Provide QR codes for offline marketing
- ✅ Meet all functional requirements (FR1-FR14)
- ✅ Enable reaching 100+ paying customers goal
- ✅ Maintain competitive feature parity

## Risks & Mitigations

### Payment System Risks
- **Risk**: Stripe account rejection
- **Mitigation**: Apply early, have backup processor ready

### Timeline Risks
- **Risk**: 2-3 extra days needed
- **Mitigation**: Can launch free tier first, add payments week 4

### Complexity Risks
- **Risk**: Payment bugs could affect revenue
- **Mitigation**: Extensive testing, gradual rollout

## Alternative: Deferred Monetization

If timeline is critical, could launch without payments:
1. Week 1-3: Current MVP without payments
2. Week 4: Add payment system
3. Week 5: Enable paid plans

**Recommendation**: Include payments in MVP to start revenue immediately.

---

## Approval Required

- [ ] Product Owner approves payment system addition
- [ ] Technical Lead confirms Stripe integration feasibility
- [ ] Timeline extension (2-3 days) approved
- [ ] CSV upload feature approved
- [ ] QR code generation approved

This ensures MVP meets business goals and user needs completely.