# Links Edit and Multi-Select Requirements

## Edit Mode
**Trigger**: Click on any link card or row (not on buttons/links)
**Behavior**: Opens edit view (same layout as create modal but pre-filled)

### Edit View Structure
- **Header**: Breadcrumb "Links > [link icon] dub.sh/P5GlH3O" with dropdown
- **Top actions**:
  - "Copy link" button
  - "0 clicks" counter
  - Three-dot menu
- **Form fields**: Same as create modal (all pre-filled):
  - Destination URL
  - Short Link
  - Tags
  - Comments
  - Conversion Tracking
  - Folder
  - QR Code
  - Custom Link Preview
- **Footer tabs**: UTM, Targeting, Password, Expiration, More (...)
- **Bottom**: "Created by [User] • [timestamp]"
- **Note**: "isla.s" domain shown with "Visit isla.s/" link

## Multi-Select Functionality (To Be Added)

### Checkbox Placement
**Card View**:
- Top-left corner of each card
- Appears on hover or when in selection mode
- Circle checkbox design to match design system

**Table/Row View**:
- First column of each row
- Always visible or on hover (TBD)
- Standard checkbox design

### Selection Behaviors
1. **Individual Selection**: Click checkbox to select single item
2. **Shift-Click**: Select range of items
3. **Cmd/Ctrl-Click**: Add/remove individual items
4. **Select All**: Checkbox in header or keyboard shortcut

### Bulk Actions Toolbar
**Appears when**: One or more links selected
**Location**: Fixed bottom or top of content area
**Actions**:
- Delete selected
- Archive selected
- Move to folder
- Add/remove tags
- Export selected
- Transfer ownership
- Duplicate all

## Ordering/Sort Options

### Available Sort Orders
1. **Date created** - Default (newest first)
2. **Total clicks** - Most clicked first
3. **Last clicked** - Recently clicked first
4. **Total sales** - Highest revenue first (if tracking conversions)

### Sort Behavior
- Clicking column headers in table view sorts by that column
- Sort preference persists across sessions
- Visual indicator shows current sort (arrow up/down)

## Pagination Recommendations

### Implementation Options

**Option 1: Virtual Scrolling** (Recommended)
- Load 50 items initially
- Load more as user scrolls
- Smooth performance with thousands of links
- "Viewing 1-50 of 1,234 links" indicator

**Option 2: Traditional Pagination**
- 25/50/100 items per page options
- Page numbers at bottom
- Previous/Next navigation
- Jump to page option

**Option 3: Load More Button**
- Initial load of 50 items
- "Load more" button at bottom
- Preserves scroll position
- Good for moderate datasets

### Performance Considerations
- Lazy load images/favicons
- Debounce search/filter inputs
- Cache recently viewed pages
- Preload next page in background

## Keyboard Shortcuts

### Navigation
- `↑/↓` - Navigate between links
- `Space` - Select/deselect current item
- `Cmd+A` - Select all
- `Esc` - Clear selection

### Actions
- `Enter` - Open edit view
- `Cmd+D` - Duplicate selected
- `Delete` - Delete selected (with confirmation)
- `Cmd+C` - Copy link URLs

## State Management

### URL State
- Selected items in URL params (for sharing state)
- Sort order in URL
- Filter/search terms in URL
- Page number (if using pagination)

### Local Storage
- View preference (cards/table)
- Items per page
- Column visibility
- Sort preference

## Visual Feedback

### Selection States
- **Unselected**: Default appearance
- **Hover**: Slight elevation/border
- **Selected**: Blue border/background
- **Disabled**: Grayed out (e.g., archived links)

### Loading States
- Skeleton loaders during data fetch
- Progress bar for bulk operations
- Optimistic updates (immediate visual feedback)

## Error Handling

### Bulk Operation Errors
- Show which items failed
- Option to retry failed items
- Rollback on critical errors
- Clear error messaging

### Edit Conflicts
- Detect if link changed while editing
- Merge or overwrite options
- Version history (future enhancement)

## Mobile Adaptations

### Touch Interactions
- Long press to enter selection mode
- Swipe actions for quick operations
- Larger touch targets for checkboxes
- Bottom sheet for bulk actions

### Responsive Layout
- Stack form fields vertically on small screens
- Collapsible sections in edit view
- Simplified toolbar for bulk actions
- Full-screen edit modal on mobile

## Questions for Clarification

1. **Selection persistence**: Should selection persist when filtering/searching?
2. **Undo functionality**: Need undo for bulk operations?
3. **Confirmation dialogs**: Which actions need confirmation?
4. **Real-time sync**: How to handle when another user modifies selected links?
5. **Export format**: What format for bulk export (CSV, JSON)?
6. **Maximum selection**: Any limit on number of items selected?