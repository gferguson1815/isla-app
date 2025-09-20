# Page-Based Development Plan for Isla

## Executive Summary
This document captures the complete transition from feature-based to page-based development, including all validated requirements, page specifications, and implementation plan.

---

## 🎯 Key Decisions Made

### Development Approach
- **Adopted**: Page-by-page development instead of feature-based epics
- **Rationale**: Each page delivers complete functionality; clearer implementation path
- **First Page**: Links page (core functionality, most detailed requirements)

### URL Structure
- **Pattern**: `https://app.isla.sh/[workspace]/[page]`
- **Example**: `https://app.isla.sh/gferguson1815/links`
- **Account pages**: No workspace in URL (e.g., `/account/settings`)

### Navigation Structure
- **Icon Sidebar**: Short Links, Partner Program, Settings, Account
- **Navigation Panel**: Changes based on icon selection
- **Main Content Area**: Page-specific content

---

## 📄 Complete Page Inventory (47 Pages Total)

### Short Links Section (8 pages) - MVP Priority
1. `/[workspace]/links` - ✅ FULLY SPECIFIED
2. `/[workspace]/links/domains`
3. `/[workspace]/analytics`
4. `/[workspace]/events`
5. `/[workspace]/customers`
6. `/[workspace]/links/folders`
7. `/[workspace]/links/tags`
8. `/[workspace]/links/utm`

### Partner Program Section (14 pages) - Post-MVP
9. `/[workspace]/program`
10. `/[workspace]/program/payouts`
11. `/[workspace]/program/messages`
12. `/[workspace]/program/partners`
13. `/[workspace]/program/partners/applications`
14. `/[workspace]/program/groups`
15. `/[workspace]/program/analytics`
16. `/[workspace]/program/commissions`
17. `/[workspace]/program/bounties`
18. `/[workspace]/program/resources`
19. `/[workspace]/program/groups/[group-id]/rewards`
20. `/[workspace]/program/groups/[group-id]/discounts`
21. `/[workspace]/program/groups/[group-id]/links`
22. `/[workspace]/program/branding`

### Settings Section (3 pages) - MVP Priority
23. `/account/settings`
24. `/account/settings/security`
25. `/account/settings/referrals`

### Authentication Pages (5 pages) - MVP Priority
26. `/login`
27. `/signup`
28. `/forgot-password`
29. `/reset-password`
30. `/verify-email`

### Public Pages (9 pages) - Partial MVP
31. `/` (landing)
32. `/pricing`
33. `/features`
34. `/about`
35. `/contact`
36. `/privacy`
37. `/terms`
38. `/blog`
39. `/api`

### Redirect Pages (4 pages) - MVP Priority
40. `/[shortcode]`
41. `/[shortcode]+`
42. `/[shortcode]/password`
43. `/[shortcode]/expired`

### Special Pages (4 pages) - MVP Priority
44. `/workspaces`
45. `/onboarding`
46. `/404`
47. `/500`

---

## 📋 Links Page - Complete Specification

### Requirements Documents Created
1. **links-page-requirements.md** - Core functionality
2. **links-display-requirements.md** - Display modes and interactions
3. **links-edit-and-selection-requirements.md** - Edit mode and multi-select

### Key Features Specified

#### Page Layout
- Three-panel structure (Icon sidebar, Nav panel, Main content)
- Empty state with CTAs
- Header with folder selector and display options

#### Create Link Modal
- Comprehensive form with all fields
- QR code generation
- Custom link preview
- Bottom tabs (UTM, Targeting, Password, Expiration)
- Drafts functionality

#### Display Modes
- **Card View**: Clean cards with favicon, links, metadata
- **Table View**: Compact rows with same information
- **Sorting**: Date created, Total clicks, Last clicked, Total sales
- **Pagination**: Virtual scrolling (recommended)

#### Interactions
- **Edit**: Click link opens pre-filled modal
- **Multi-select**: Checkboxes for bulk operations (to be added)
- **Three-dot menu**: Edit, QR, Copy, Duplicate, Move, Archive, Transfer, Delete
- **Search/Filter**: Real-time filtering

#### Import/Export
- Import from: Bitly, Rebrandly, Short.io, CSV
- Export as: CSV

---

## 🏗️ Restructured Epic Plan

### ⚠️ MANDATORY: Requirements Before Building
**CRITICAL**: Every page MUST have requirements gathered BEFORE any code is written.

#### Requirements Process for Each Page:
1. **Create Requirements Document** - `/docs/pages/[page-name]-requirements.md`
2. **Gather Visual References** - Screenshots, competitor examples
3. **Get Product Owner Validation** - Step-by-step walkthrough
4. **Update Story File** - Add specific acceptance criteria
5. **Only Then Build** - No assumptions, only validated requirements

#### Requirements Documents Status:
- ✅ Links Page - `/docs/pages/links-page-requirements.md` - VALIDATED
- ✅ Onboarding Page - `/docs/pages/onboarding-page-requirements.md` - NEEDS INPUT
- ⏳ Analytics Page - Requirements needed
- ⏳ Domains Page - Requirements needed
- ⏳ Events Page - Requirements needed
- ⏳ Customers Page - Requirements needed
- ⏳ Settings Pages - Requirements needed

### Epic Story Files
Each epic has a detailed story file in `/docs/stories/` with full acceptance criteria:

### Epic 0: Foundation (Week 1)
**Story File**: `/docs/stories/epic-0-foundation.md` ✅
**Pages**: Authentication, basic routing, database
**Status**: ✅ COMPLETE
**Stories**:
- 0.1: Project setup and infrastructure ✅
- 0.2: Authentication pages (login, signup, etc.) ✅
- 0.3: Workspace structure and routing ✅
- 0.4: Navigation shell (icon sidebar, nav panel) ✅

### Epic 0.5: User Onboarding (NEW)
**Story File**: `/docs/stories/epic-0.5-onboarding.md` ✅
**Page**: `/onboarding`
**Status**: 🚧 IN PROGRESS
**Stories** (with estimates):
- 0.5.1: Basic onboarding page (2h) ✅
- 0.5.2: Workspace creation validation (2h) 🚧
- 0.5.3: Multi-step onboarding (3h) - FUTURE
- 0.5.4: First-time user detection (1h)
- 0.5.5: Welcome tutorial (4h) - FUTURE
- 0.5.6: Sample data & templates (2h) - FUTURE
**Total MVP**: ~5 hours | **With enhancements**: ~14 hours

### Epic 1: Links Management Page (Week 1-2)
**Story File**: `/docs/stories/epic-1-links-page.md` ✅ **[READY TO BUILD]**
**Page**: `/[workspace]/links`
**Stories** (with estimates):
- 1.1: Page layout and empty state (4h)
- 1.2: Create link modal (8h)
- 1.3: Display links - cards and table (6h)
- 1.4: Edit functionality (4h)
- 1.5: Search and filtering (4h)
- 1.6: Folder navigation (4h)
- 1.7: Display options menu (3h)
- 1.8: Import/Export functionality (6h)
- 1.9: Multi-select and bulk operations (6h)
- 1.10: Virtual scrolling/pagination (4h)
**Total**: ~49 hours / 6-7 days

### Epic 2: Analytics Page (Week 2)
**Story File**: `/docs/stories/epic-2-analytics-page.md` (to be created)
**Page**: `/[workspace]/analytics`
**Stories**: To be specified after Links page

### Epic 3: Domains Page (Week 2)
**Story File**: `/docs/stories/epic-3-domains-page.md` (to be created)
**Page**: `/[workspace]/links/domains`
**Stories**: To be specified after Links page

### Epic 4: Events & Customers Pages (Week 3)
**Pages**: `/[workspace]/events`, `/[workspace]/customers`
**Stories**: To be specified

### Epic 5: Organization Pages (Week 3)
**Pages**: Folders, Tags, UTM templates
**Stories**: To be specified

### Epic 6: Settings Pages (Week 3)
**Pages**: Account settings
**Stories**: To be specified

---

## 🔄 Migration from Current Structure

### What We Had
- Feature-based epics (Foundation, Workspaces, Analytics, etc.)
- Stories scattered across features
- UI/UX as separate epic

### What We're Moving To
- Page-based epics
- Each page gets complete functionality
- UI/UX integrated into each page

### Existing Stories to Migrate
- Story 1.3 (Link Shortening) → Epic 1, Story 1.2 (Create modal)
- Story 1.4 (Analytics) → Epic 2 (Analytics page)
- Story 1.5 (Dashboard) → Epic 1, Story 1.3 (Display links)
- Story 2.5.2 (Inline editing) → Epic 1, Story 1.4 (Edit)

---

## 🎯 How to Execute This Plan

### Step 1: Open the Epic Story File
For Links page: `/docs/stories/epic-1-links-page.md`

### Step 2: Work Through Stories in Order
1. Start with Story 1.1 (Page layout)
2. Complete each story's acceptance criteria
3. Mark complete before moving to next

### Step 3: Track Progress
- Use the story file checkboxes
- Update estimates vs actual time
- Document any blockers

### Step 4: Daily Workflow
1. Pick next story from epic file
2. Review acceptance criteria
3. Build the feature
4. Test against criteria
5. Commit and move to next

---

## ✅ Action Items

### Immediate (This Week)
1. [ ] Build Story 1.1: Links page layout and empty state (4h)
2. [ ] Build Story 1.2: Create link modal (8h)
3. [ ] Build Story 1.3: Display links (6h)
4. [ ] Build Story 1.4: Edit functionality (4h)
5. [ ] Build Story 1.5: Search and filtering (4h)

### Next Sprint
1. [ ] Validate requirements for Analytics page
2. [ ] Validate requirements for Domains page
3. [ ] Build Analytics and Domains pages

### Backlog
1. [ ] Specify remaining MVP pages
2. [ ] Plan Partner Program pages (post-MVP)
3. [ ] Create test plans per page

---

## 📚 Reference Documents

### Created During Planning
1. `/docs/pages/final-page-list.md` - Complete page inventory
2. `/docs/pages/links-page-requirements.md` - Links page core requirements
3. `/docs/pages/links-display-requirements.md` - Links display specifications
4. `/docs/pages/links-edit-and-selection-requirements.md` - Edit and multi-select specs
5. `/docs/pages/links-page-specification.md` - Initial specification
6. `/docs/pages/links-page-story-mapping.md` - Story mapping and gaps
7. `/docs/prd/epic-list-page-based.md` - Page-based epic structure

### Process to Follow for Each Page
1. Validate requirements with user (step-by-step)
2. Document specifications
3. Map to existing stories
4. Identify gaps
5. Build page
6. Test and iterate

---

## 🎯 Success Metrics

### Per Page
- Complete functionality works end-to-end
- Responsive on all devices
- Performance <2s load time
- All interactions documented
- Tests written

### Overall
- 20-25 pages for MVP
- 3-4 week timeline
- Each page fully functional before moving on

---

## 💡 Key Insights

### What We Learned
1. Page-by-page reveals missing details immediately
2. Visual references (screenshots) are essential
3. Step-by-step validation prevents assumptions
4. Complete specifications before building saves time

### Patterns to Apply
1. Always validate with visuals
2. Document every interaction
3. Consider mobile from start
4. Build complete pages, not features

---

## 🚦 Next Steps

1. **Today**: Start building Links page with current specifications
2. **Tomorrow**: Continue Links page, begin Analytics validation
3. **This Week**: Complete Links page, specify 2-3 more pages
4. **Next Week**: Build Analytics, Domains, Events pages

---

## Questions Still to Answer

### Technical
1. Real-time updates implementation (WebSockets vs polling)
2. State management approach (Context vs Redux vs Zustand)
3. Data fetching strategy (SWR vs React Query vs tRPC)

### Product
1. Multi-select UI details
2. Bulk operation limits
3. Mobile-specific features
4. Offline functionality

### Process
1. Testing strategy per page
2. Deployment approach (page by page vs batched)
3. Feature flags for gradual rollout

---

This document serves as the master reference for our page-based development approach. Update it as we validate more pages and learn from implementation.