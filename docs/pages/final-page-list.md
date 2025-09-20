# Final Page List for Isla Application

## URL Structure
- **Workspace-scoped pages:** `https://app.isla.sh/[workspace]/[page]`
- **Account-level pages:** `https://app.isla.sh/[page]` (no workspace in URL)
- **Public pages:** `https://isla.sh/[page]`
- **Short links:** `https://isla.sh/[shortcode]` or custom domain

---

## 📊 Short Links Section
*When "Short Links" is selected in the icon sidebar*

### Main Pages (Workspace-scoped)
1. **Links Page** - `/[workspace]/links`
   - Main link management table
   - Create, edit, delete links
   - Inline editing
   - Bulk operations

2. **Domains Page** - `/[workspace]/links/domains`
   - Custom domain management
   - DNS configuration
   - Domain verification
   - SSL certificates

3. **Analytics Page** - `/[workspace]/analytics`
   - Click analytics
   - Geographic distribution
   - Device/browser stats
   - Time-series graphs

4. **Events Page** - `/[workspace]/events`
   - Activity log
   - Link creation/modification events
   - Team member actions
   - System events

5. **Customers Page** - `/[workspace]/customers`
   - Customer profiles
   - Customer journey tracking
   - Link interactions per customer
   - Customer analytics

### Organization Pages (Workspace-scoped)
6. **Folders Page** - `/[workspace]/links/folders`
   - Folder structure for links
   - Create/manage folders
   - Move links between folders
   - Folder permissions

7. **Tags Page** - `/[workspace]/links/tags`
   - Tag management
   - Create/edit/delete tags
   - Bulk tag operations
   - Tag analytics

8. **UTM Templates Page** - `/[workspace]/links/utm`
   - UTM parameter templates
   - Campaign presets
   - Quick UTM builder
   - Template management

---

## 🤝 Partner Program Section
*When "Partner Program" is selected in the icon sidebar*

### Overview & Management (Workspace-scoped)
9. **Program Overview** - `/[workspace]/program`
   - Dashboard for partner program
   - Key metrics
   - Quick actions
   - Program health

10. **Payouts Page** - `/[workspace]/program/payouts`
    - Payout history
    - Pending payouts
    - Payout settings
    - Tax documentation

11. **Messages Page** - `/[workspace]/program/messages`
    - Partner communications
    - Announcements
    - Direct messages
    - Message templates

### Partner Management (Workspace-scoped)
12. **All Partners Page** - `/[workspace]/program/partners`
    - Partner list
    - Partner profiles
    - Performance metrics
    - Partner management

13. **Applications Page** - `/[workspace]/program/partners/applications`
    - New partner applications
    - Application review
    - Approval workflow
    - Application settings

14. **Groups Page** - `/[workspace]/program/groups`
    - Partner groups/tiers
    - Group management
    - Group settings
    - Performance by group

### Program Analytics & Rewards (Workspace-scoped)
15. **Program Analytics** - `/[workspace]/program/analytics`
    - Program performance
    - Partner performance
    - Revenue analytics
    - Conversion tracking

16. **Commissions Page** - `/[workspace]/program/commissions`
    - Commission structure
    - Commission rules
    - Commission history
    - Pending commissions

17. **Bounties Page** - `/[workspace]/program/bounties`
    - Special bounties
    - Bounty campaigns
    - Bounty tracking
    - Bounty payouts

18. **Resources Page** - `/[workspace]/program/resources`
    - Partner resources
    - Marketing materials
    - Documentation
    - Training materials

### Group-Specific Settings (Workspace-scoped)
19. **Group Rewards** - `/[workspace]/program/groups/[group-id]/rewards`
    - Reward structure for group
    - Bonus configuration
    - Achievement rewards

20. **Group Discounts** - `/[workspace]/program/groups/[group-id]/discounts`
    - Discount codes for group
    - Special pricing
    - Promotional offers

21. **Group Links** - `/[workspace]/program/groups/[group-id]/links`
    - Group-specific link settings
    - Link templates
    - Tracking parameters

22. **Program Branding** - `/[workspace]/program/branding`
    - Program branding
    - White-label settings
    - Email templates
    - Landing pages

---

## ⚙️ Settings Section
*Account-level pages (no workspace in URL)*

23. **General Settings** - `/account/settings`
    - Profile information
    - Email preferences
    - Language/timezone
    - Notification settings

24. **Security Settings** - `/account/settings/security`
    - Password management
    - Two-factor authentication
    - API keys
    - Active sessions

25. **Referrals Settings** - `/account/settings/referrals`
    - Referral program participation
    - Your referral code
    - Referral rewards
    - Referred users

---

## 🔐 Authentication Pages
*No workspace in URL*

26. **Login** - `/login`
27. **Sign Up** - `/signup`
28. **Forgot Password** - `/forgot-password`
29. **Reset Password** - `/reset-password`
30. **Verify Email** - `/verify-email`

---

## 🌐 Public Pages
*On main domain: isla.sh*

31. **Landing Page** - `/`
32. **Pricing** - `/pricing`
33. **Features** - `/features`
34. **About** - `/about`
35. **Contact** - `/contact`
36. **Privacy Policy** - `/privacy`
37. **Terms of Service** - `/terms`
38. **Blog** - `/blog` (optional)
39. **API Docs** - `/api` (optional)

---

## 🔗 Link Redirect Pages
*On main domain or custom domain*

40. **Link Redirect** - `/[shortcode]`
41. **Link Preview** - `/[shortcode]+` (optional)
42. **Password Protected** - `/[shortcode]/password`
43. **Link Expired** - `/[shortcode]/expired`

---

## 📱 Special Pages

44. **Workspace Selector** - `/workspaces` (if user has multiple)
45. **Onboarding** - `/onboarding` (first-time setup)
46. **404 Page** - `/404`
47. **500 Page** - `/500`

---

## Page Count Summary

| Section | Pages | Priority |
|---------|-------|----------|
| Short Links Core | 8 | Essential for MVP |
| Partner Program | 14 | Phase 2 |
| Settings | 3 | Essential for MVP |
| Authentication | 5 | Essential for MVP |
| Public | 9 | 3-4 Essential for MVP |
| Redirects | 4 | Essential for MVP |
| Special | 4 | Essential for MVP |
| **Total** | **47 pages** | **~20-25 for MVP** |

---

## MVP Priority (Weeks 1-3)

### Week 1: Foundation
1. Authentication pages (5 pages)
2. Basic public pages (landing, pricing)
3. Workspace structure

### Week 2: Core Features
4. Links page
5. Analytics page
6. Domains page
7. Basic settings pages

### Week 3: Enhancement
8. Events page
9. Tags/Folders
10. UTM templates
11. Customer tracking

### Post-MVP: Partner Program (Week 4+)
- All partner program pages (14 pages)
- Advanced analytics
- Group management

---

## Navigation Structure

### Icon Sidebar (Left - Always Visible)
- 🔗 Short Links
- 🤝 Partner Program
- ⚙️ Settings
- 👤 Account

### Navigation Panel (Changes based on icon selection)
**When Short Links selected:**
- Links
- Domains
- Analytics
- Events
- Customers
- Organization (submenu)
  - Folders
  - Tags
  - UTM Templates

**When Partner Program selected:**
- Overview
- Partners
- Payouts
- Messages
- Analytics
- Settings (submenu)
  - Groups
  - Commissions
  - Bounties
  - Resources
  - Branding

**When Settings selected:**
- General
- Security
- Referrals

---

## Technical Implementation Notes

1. **Routing Structure:**
   ```
   /[workspace]/links
   /[workspace]/analytics
   /[workspace]/program/*
   /account/settings/*
   ```

2. **Middleware Requirements:**
   - Workspace validation
   - Authentication checks
   - Permission verification
   - Redirect handling

3. **State Management:**
   - Active workspace context
   - Selected navigation section
   - User permissions
   - Feature flags

4. **API Pattern:**
   ```
   /api/workspaces/[workspace]/links
   /api/workspaces/[workspace]/analytics
   /api/account/settings
   ```

This structure provides clear separation between workspace-scoped features (links, partner program) and account-level settings, while maintaining the Dub.co-style URL pattern you prefer.