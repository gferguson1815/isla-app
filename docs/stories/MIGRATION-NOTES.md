# Story Migration Notes

## What Happened
- **Date**: December 20, 2024
- **Change**: Migrated from feature-based to page-based development approach
- **Old Stories**: Archived to `/docs/stories/archived-feature-based/`
- **New Structure**: Page-based stories with new numbering scheme

## Old Story Structure (Archived with PREFIX)

**IMPORTANT**: All old stories have been renamed with `ARCHIVED-FEATURE-` prefix to avoid confusion with new page-based stories.

### Epic 1: Foundation & Core Link Management
- ARCHIVED-FEATURE-1.1: Project Setup & Infrastructure
- ARCHIVED-FEATURE-1.2: Authentication & User Management
- ARCHIVED-FEATURE-1.3: Link Shortening Service
- ARCHIVED-FEATURE-1.4: Basic Analytics & Click Tracking
- ARCHIVED-FEATURE-1.5: Link Management Dashboard
- ARCHIVED-FEATURE-1.6: User Dashboard

### Epic 2: Team Workspaces & Collaboration
- ARCHIVED-FEATURE-2.1: Workspace Data Model
- ARCHIVED-FEATURE-2.2: Workspace UI Components
- ARCHIVED-FEATURE-2.3: Workspace Creation & Management
- ARCHIVED-FEATURE-2.4: Team Member Management
- ARCHIVED-FEATURE-2.5: Workspace Settings
- ARCHIVED-FEATURE-2.6: Workspace Switching
- ARCHIVED-FEATURE-2.7: Billing & Subscription (Stripe)
- ARCHIVED-FEATURE-2.8: Usage Tracking
- ARCHIVED-FEATURE-2.9: Payment UI
- ARCHIVED-FEATURE-2.10: Subscription Management
- ARCHIVED-FEATURE-2.5.1: Navigation & Command System (UI/UX)

### Epic 3: Analytics & Campaign Attribution
- ARCHIVED-FEATURE-3.1: Enhanced Click Data Collection
- ARCHIVED-FEATURE-3.2: Analytics Dashboard UI
- ARCHIVED-FEATURE-3.3: UTM Parameter Management

## New Page-Based Structure

### Epic 0: Foundation (Auth & Setup)
- 0.1: Project infrastructure
- 0.2: Authentication pages
- 0.3: Workspace routing
- 0.4: Navigation shell

### Epic 1: Links Page
- 1.1: Page layout and empty state
- 1.2: Create link modal
- 1.3: Display links (cards/table)
- 1.4: Edit functionality
- 1.5: Search and filtering
- 1.6: Folder navigation
- 1.7: Display options
- 1.8: Import/Export
- 1.9: Multi-select
- 1.10: Pagination

### Epic 2: Analytics Page
- 2.1-2.x: To be defined

### Epic 3: Domains Page
- 3.1-3.x: To be defined

## Mapping Old Stories to New Pages

| Old Story (ARCHIVED) | Functionality | New Location |
|-----------|--------------|--------------|
| ARCHIVED-FEATURE-1.1 | Infrastructure | Epic 0.1 |
| ARCHIVED-FEATURE-1.2 | Auth pages | Epic 0.2 |
| ARCHIVED-FEATURE-1.3 | Create link | Epic 1.2 |
| ARCHIVED-FEATURE-1.4 | Analytics data | Epic 2.x |
| ARCHIVED-FEATURE-1.5 | Links display | Epic 1.3 |
| ARCHIVED-FEATURE-1.6 | Dashboard page | Future |
| ARCHIVED-FEATURE-2.1-2.6 | Workspace logic | Epic 0.3 |
| ARCHIVED-FEATURE-2.7-2.10 | Billing pages | Future |
| ARCHIVED-FEATURE-2.5.1 | Nav components | Epic 0.4 |
| ARCHIVED-FEATURE-3.1-3.3 | Analytics page | Epic 2.x |

## Why We Migrated

1. **Page-focused**: Each page delivers complete functionality
2. **Clearer scope**: Know exactly what "done" means
3. **Better UX**: Complete experiences, not scattered features
4. **Easier testing**: Test complete user journeys

## How to Use New Structure

1. **Start with page requirements**: Validate with user first
2. **Create page story files**: One epic per page
3. **Build complete pages**: All functionality before moving on
4. **Test page-by-page**: Complete user flows

## Reference Documents

- **Master Plan**: `/docs/prd/page-based-development-plan.md`
- **Page List**: `/docs/pages/final-page-list.md`
- **Links Spec**: `/docs/pages/links-page-requirements.md`
- **Old Epics**: `/docs/prd/epic-list-optimized.md` (for reference)