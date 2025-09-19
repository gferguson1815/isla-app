# Epic 2: Team Workspaces, Collaboration & Monetization (UPDATED)

**Expanded Goal**: This epic transforms the platform from individual use to team collaboration AND enables monetization through subscription tiers. Teams can create shared workspaces, invite members, organize links, manage permissions, AND control their subscription level. This establishes both collaborative differentiation and revenue generation.

## Original Stories (2.1-2.6)

[Stories 2.1 through 2.6 remain unchanged - see original Epic 2 document]

## NEW: Monetization Stories (2.7-2.10)

### Story 2.7: Billing Foundation & Stripe Integration

**As a** platform operator,
**I want** to integrate Stripe for payment processing,
**so that** we can collect payments and manage subscriptions.

**Acceptance Criteria:**
1. **Stripe Setup (User Responsibility)**:
   - Stripe account created and verified
   - API keys configured in environment variables
   - Webhook endpoint secret stored securely

2. **Product Configuration**:
   ```javascript
   // Tier Configuration
   FREE:    $0/month    - 3 users, 100 links, 1K clicks
   STARTER: $19/month   - 10 users, 1K links, 10K clicks
   GROWTH:  $49/month   - ∞ users, 10K links, 100K clicks
   ```

3. **Database Schema**:
   - `subscriptions` table with Stripe references
   - `usage_metrics` table for tracking limits
   - `invoices` table for payment history
   - `payment_methods` table for card management

4. **Stripe Integration**:
   - Customer creation on workspace creation
   - Subscription lifecycle management
   - Webhook processing for events:
     - subscription.created
     - subscription.updated
     - subscription.deleted
     - payment.succeeded
     - payment.failed

5. **Security Requirements**:
   - PCI compliance via Stripe Elements
   - No card data stored in database
   - Webhook signature verification
   - Idempotent webhook processing

6. **Testing**:
   - Test mode with Stripe test cards
   - Webhook testing with Stripe CLI
   - Subscription state machine tests

### Story 2.8: Subscription Management UI

**As a** workspace admin,
**I want** to manage my subscription,
**so that** I can control costs and access features.

**Acceptance Criteria:**
1. **Billing Dashboard** (`/workspace/[id]/billing`):
   - Current plan display with renewal date
   - Usage meters (animated progress bars):
     - Team Members: X/Y used
     - Links Created: X/Y used
     - Clicks This Month: X/Y used
   - Next invoice preview
   - Payment method display (last 4 digits)

2. **Plan Selection UI** (Dub.co style):
   ```
   ┌──────────┬───────────┬───────────┐
   │   FREE   │  STARTER  │  GROWTH   │
   │    $0    │   $19/mo  │  $49/mo   │
   ├──────────┼───────────┼───────────┤
   │ 3 users  │ 10 users  │ ∞ users   │
   │ 100 links│ 1K links  │ 10K links │
   │ 1K clicks│ 10K clicks│ 100K clicks│
   │          │ ✓ Support │ ✓ Priority │
   └──────────┴───────────┴───────────┘
   ```

3. **Upgrade Flow**:
   - Smooth modal with Stripe Elements
   - Immediate access to new limits
   - Prorated billing explanation
   - Success animation (confetti)

4. **Downgrade Flow**:
   - Warning about feature loss
   - Data retention guarantee
   - End of period downgrade
   - Confirmation required

5. **Payment Management**:
   - Add/update card via Stripe Elements
   - View billing history (last 12 months)
   - Download invoices as PDF
   - Update billing email

6. **Trial Experience**:
   - 14-day trial banner
   - Days remaining countdown
   - Trial-to-paid conversion flow
   - Trial expiry warning emails

### Story 2.9: Usage Limits & Enforcement

**As a** system,
**I want** to enforce subscription limits,
**so that** users upgrade when needed.

**Acceptance Criteria:**
1. **Soft Limits (Warnings)**:
   - 80% usage triggers warning banner
   - Email notification to admin
   - Upgrade CTA in warning

2. **Hard Limits (Blocking)**:
   ```typescript
   // Link Creation Check
   if (workspace.linkCount >= plan.maxLinks) {
     return {
       error: "Link limit reached",
       action: "upgrade",
       currentPlan: plan.name,
       suggestedPlan: getNextTier(plan)
     }
   }
   ```

3. **Graceful Degradation**:
   - Clicks always tracked (never lose data)
   - Analytics view-only when over limit
   - Cannot invite users over limit
   - Cannot create links over limit

4. **Usage Tracking**:
   - Real-time counters in Redis
   - Daily sync to database
   - Monthly reset for click limits
   - Permanent count for links/users

5. **Upgrade Prompts**:
   - Inline CTAs when action blocked
   - Modal with plan comparison
   - One-click upgrade flow
   - Success removes all blocks

6. **Admin Overrides**:
   - Support can grant temporary increases
   - Special customer exceptions
   - Beta user unlimited access
   - VIP customer flags

### Story 2.10: Bulk Link Import via CSV

**As a** marketer,
**I want** to import links from CSV,
**so that** I can migrate from spreadsheets quickly.

**Acceptance Criteria:**
1. **Import Interface**:
   - Drag-drop CSV upload zone
   - File size limit: 5MB
   - Format detection and preview
   - Column mapping interface

2. **CSV Format**:
   ```csv
   destination_url,custom_slug,title,tags,folder
   https://example.com,promo-2024,Summer Promo,"marketing,summer",campaigns
   https://blog.com/post,,Blog Post,"content",blog
   ```

3. **Validation & Preview**:
   - ✅ Valid URLs (green rows)
   - ⚠️ Duplicate slugs (yellow rows)
   - ❌ Invalid data (red rows)
   - Show first 10 rows preview
   - Total: X valid, Y warnings, Z errors

4. **Import Process**:
   - Animated progress bar
   - "Importing link 45 of 100..."
   - Pause/resume capability
   - Cancel with rollback

5. **Limits by Plan**:
   - Free: 10 links per import
   - Starter: 100 links per import
   - Growth: 1000 links per import

6. **Error Handling**:
   - Partial success allowed
   - Error report downloadable
   - Skip duplicates option
   - Fix and retry capability

7. **Success State**:
   - "Successfully imported X links!"
   - View imported links button
   - Undo within 5 minutes
   - Import history log

## Integration Points

### With Epic 1 (Foundation)
- Uses user authentication system
- Extends workspace creation flow
- Leverages link creation limits

### With Epic 3A (Analytics)
- Usage metrics feed analytics
- Click limits affect analytics access
- QR codes available by plan

### With Epic 4 (Extension)
- Extension shows plan limits
- Upgrade prompts in extension
- Bulk operations via extension (Growth only)

### With Epic 5 (Admin)
- Admin can override limits
- Admin views all subscriptions
- Admin handles failed payments

## Timeline Integration

### Original Epic 2: Days 8-9
### With Additions: Days 8-10
- Day 8: Stories 2.1-2.4 (Workspaces, Teams, Folders, Tags)
- Day 9: Stories 2.5-2.6 + 2.10 (Search, Permissions, CSV)
- Day 10: Stories 2.7-2.9 (Stripe, Billing UI, Limits)

### Parallel Work Opportunity
- Developer 1: Original Epic 2 stories
- Developer 2: Payment system (2.7-2.9)
- Merge on Day 10

## Testing Requirements

### Payment Testing
1. Stripe test cards:
   - 4242 4242 4242 4242 (Success)
   - 4000 0000 0000 9995 (Decline)
   - 4000 0000 0000 0002 (Decline)

2. Subscription scenarios:
   - Free → Starter upgrade
   - Starter → Growth upgrade
   - Growth → Starter downgrade
   - Payment failure handling
   - Trial expiration

3. Webhook testing:
   - Use Stripe CLI for local testing
   - Verify idempotency
   - Test retry logic

### CSV Import Testing
1. File variations:
   - Valid CSV with all columns
   - Missing optional columns
   - Invalid URLs
   - Duplicate slugs
   - Empty file
   - Malformed CSV

2. Scale testing:
   - 10 links (minimum)
   - 100 links (typical)
   - 1000 links (maximum)

## Success Metrics

### Monetization Metrics
- Trial → Paid conversion: >10%
- Payment success rate: >95%
- Churn rate: <5% monthly
- Average revenue per user: >$25

### Import Metrics
- CSV import success rate: >90%
- Average import size: 50 links
- Import → Active user: >80%

## Risk Mitigation

### Payment Risks
- **Stripe account issues**: Have backup processor ready
- **Payment failures**: Implement retry logic and grace period
- **Compliance issues**: Use Stripe's PCI compliant tools

### Import Risks
- **Large file DoS**: Implement rate limiting
- **Malicious CSV**: Sanitize all inputs
- **Duplicate spam**: Require authentication

---

This updated Epic 2 delivers both collaboration and monetization, ensuring the platform can achieve its "100+ paying customers" goal while providing essential team features.