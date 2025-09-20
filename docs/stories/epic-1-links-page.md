# Epic 1: Links Page

## Epic Overview
**Page URL**: `/[workspace]/links`
**Priority**: P0 - Core functionality
**Timeline**: Week 1-2 of development
**Status**: Requirements validated, ready to build

## Success Criteria
- [ ] Users can create, view, edit, and delete links
- [ ] Multiple display modes (cards and table)
- [ ] Search and filtering works
- [ ] Import/export functionality
- [ ] Multi-select for bulk operations
- [ ] Mobile responsive
- [ ] Performance: <2s load time

## User Stories

### Story 1.1: Page Layout and Empty State
**Priority**: P0
**Estimate**: 4 hours
**Description**: Implement the basic page structure with empty state

**Acceptance Criteria**:
- [ ] Three-panel layout (icon sidebar, nav panel, main content)
- [ ] Empty state shows "No links yet" message
- [ ] "Create link" and "Learn more" buttons in empty state
- [ ] Header with page title "Links"
- [ ] Responsive on mobile

**Technical Notes**:
- Use existing layout components from dashboard
- Empty state component should be reusable

---

### Story 1.2: Create Link Modal
**Priority**: P0
**Estimate**: 8 hours
**Description**: Complete link creation modal with all fields

**Acceptance Criteria**:
- [ ] Modal opens on "Create link" button click
- [ ] All fields from requirements:
  - Destination URL (required)
  - Short link with domain selector
  - Tags selector
  - Comments field
  - Folder selector
  - QR code preview
  - Custom link preview
- [ ] Bottom tabs (UTM, Targeting, Password, Expiration)
- [ ] "Create link" action button
- [ ] Form validation
- [ ] Drafts functionality

**Technical Notes**:
- Modal should be accessible (ESC to close, focus trap)
- Generate random slug by default
- QR code generates automatically

---

### Story 1.3: Display Links (Cards & Table View)
**Priority**: P0
**Estimate**: 6 hours
**Description**: Show created links in both card and table view

**Acceptance Criteria**:
- [ ] Card view displays:
  - Favicon
  - Short link with copy button
  - Destination domain
  - Timestamp
  - Click count
  - Three-dot menu
- [ ] Table view shows same information in rows
- [ ] Toggle between views via Display menu
- [ ] Real-time click count updates

**Technical Notes**:
- Implement virtual scrolling for performance
- Cache favicons
- Use optimistic UI updates

---

### Story 1.4: Edit Functionality
**Priority**: P0
**Estimate**: 4 hours
**Description**: Edit existing links

**Acceptance Criteria**:
- [ ] Click on link opens edit modal
- [ ] All fields pre-populated
- [ ] Can modify all fields except short URL
- [ ] Save changes with validation
- [ ] Show "Created by" attribution

**Technical Notes**:
- Reuse create modal component
- Handle edit conflicts

---

### Story 1.5: Search and Filtering
**Priority**: P0
**Estimate**: 4 hours
**Description**: Search and filter links

**Acceptance Criteria**:
- [ ] Search by short link or destination URL
- [ ] Real-time filtering as user types
- [ ] Clear search button
- [ ] No results state

**Technical Notes**:
- Debounce search input
- Client-side filtering for speed

---

### Story 1.6: Folder Navigation
**Priority**: P1
**Estimate**: 4 hours
**Description**: Folder selector and navigation

**Acceptance Criteria**:
- [ ] Dropdown shows all folders
- [ ] Search folders functionality
- [ ] "View All" navigates to folders page
- [ ] Create new folder option
- [ ] Show current folder selection

**Technical Notes**:
- Integrate with folders data model
- Remember last selected folder

---

### Story 1.7: Display Options Menu
**Priority**: P1
**Estimate**: 3 hours
**Description**: Configure how links are displayed

**Acceptance Criteria**:
- [ ] Cards/Rows toggle
- [ ] Sort options (Date created, Total clicks, etc.)
- [ ] Show archived links toggle
- [ ] Column visibility checkboxes
- [ ] Settings persist across sessions

**Technical Notes**:
- Store preferences in localStorage
- Apply settings immediately

---

### Story 1.8: Import/Export Functionality
**Priority**: P2
**Estimate**: 6 hours
**Description**: Import and export links

**Acceptance Criteria**:
- [ ] Import from CSV
- [ ] Import from Bitly, Rebrandly, Short.io (UI only for now)
- [ ] Export selected links as CSV
- [ ] Progress indicator for import
- [ ] Error handling with clear messages

**Technical Notes**:
- CSV parser library
- Validate import data
- Background job for large imports

---

### Story 1.9: Multi-Select and Bulk Operations
**Priority**: P2
**Estimate**: 6 hours
**Description**: Select multiple links for bulk actions

**Acceptance Criteria**:
- [ ] Checkboxes appear on hover
- [ ] Select all checkbox
- [ ] Shift-click for range selection
- [ ] Bulk actions toolbar
- [ ] Actions: Delete, Archive, Move, Tag

**Technical Notes**:
- Keyboard shortcuts for selection
- Confirm destructive actions

---

### Story 1.10: Virtual Scrolling/Pagination
**Priority**: P1
**Estimate**: 4 hours
**Description**: Handle large datasets efficiently

**Acceptance Criteria**:
- [ ] Load 50 items initially
- [ ] Load more as user scrolls
- [ ] "Viewing X-Y of Z" indicator
- [ ] Smooth scrolling performance
- [ ] Previous/Next navigation

**Technical Notes**:
- Use react-window or similar
- Intersection Observer for infinite scroll

---

## Dependencies
- Authentication system (Epic 0)
- Workspace routing (Epic 0)
- Links database table
- Analytics tracking setup

## Technical Decisions
- **State Management**: Zustand or Context API
- **Data Fetching**: tRPC with SWR
- **UI Components**: Shadcn/ui
- **Virtualization**: react-window
- **QR Generation**: qrcode.js

## Testing Requirements
- Unit tests for modal forms
- Integration tests for CRUD operations
- E2E tests for complete user flows
- Performance testing with 1000+ links
- Mobile responsive testing

## References
- [Links Page Requirements](/docs/pages/links-page-requirements.md)
- [Links Display Requirements](/docs/pages/links-display-requirements.md)
- [Links Edit Requirements](/docs/pages/links-edit-and-selection-requirements.md)
- [Master Development Plan](/docs/prd/page-based-development-plan.md)

## Notes
- This is the flagship page - sets patterns for all others
- Focus on polish and performance
- All patterns should be reusable for other pages