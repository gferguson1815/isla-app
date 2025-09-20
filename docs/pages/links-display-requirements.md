# Links Display Requirements - With Data

## Display Modes

### 1. Card View
**Layout**:
- White card with rounded corners
- Left side: Favicon/logo of destination site (circular)
- Content area shows:
  - **Short link**: `dub.sh/P5GlH3O` with copy button
  - **Destination**: Arrow (→) followed by domain (e.g., "isla.so")
  - **Metadata**: User avatar + "Just now" timestamp
- Right side:
  - Click counter (e.g., "0 clicks")
  - Three-dot menu button

### 2. Table/Rows View
**Layout**:
- Same information as card view but in horizontal row format
- Columns (based on Display settings):
  - Favicon + Short link with copy button
  - Arrow (→) Destination domain
  - User avatar
  - Timestamp (e.g., "2m" for 2 minutes ago)
  - Click counter
  - Three-dot menu

## Three-Dot Menu Actions
**Trigger**: Click three dots on any link
**Menu Items** (with keyboard shortcuts):
1. **Edit** - Primary action (highlighted in blue) - Shortcut: E
2. **QR Code** - Generate/download QR code - Shortcut: Q
3. **Copy Link ID** - Copy internal ID - Shortcut: I
4. **Duplicate** - Create copy of link - Shortcut: D
5. **Move** - Move to different folder - Shortcut: M
6. **Archive** - Archive the link - Shortcut: A
7. **Transfer** - Transfer ownership - Shortcut: T
8. **Delete** - Delete link (shown in red) - Shortcut: X

## Footer Pagination
**Display**:
- Shows at bottom of page
- Format: "Viewing 1-1 of 1 link" (updates based on current view)
- Navigation buttons:
  - "Previous" (disabled when on first page)
  - "Next" (disabled when on last page)

## Key Behaviors

### Card View
- Clean, minimal design with focus on readability
- All essential info visible at a glance
- Hover states on interactive elements
- Copy button appears on hover over short link

### Table View
- More compact for viewing many links
- Same information density as cards
- Better for bulk operations
- Sortable columns (when implemented)

### Common Elements
- **Favicon**: Automatically pulled from destination URL
- **Timestamp**: Relative time (Just now, 2m, 5h, 2d, etc.)
- **Click counter**: Real-time updates
- **Copy functionality**: Click to copy short URL

## Responsive Behavior
- Cards stack vertically on mobile
- Table becomes scrollable horizontally on small screens
- Three-dot menu adapts to screen size

## Performance Requirements
- Lazy load favicons
- Virtual scrolling for large lists
- Optimistic UI updates
- Real-time click count updates via WebSocket

## Empty States
(Already documented - shows "No links yet" message)

## Loading States
- Skeleton cards/rows while data loads
- Smooth transitions when switching views
- Progress indicator for bulk operations

## Selection States
(To be defined - for bulk operations)
- Checkbox appears on hover
- Multi-select with shift+click
- Select all option
- Bulk action toolbar appears when items selected

## Search/Filter Integration
- Results update instantly as user types
- Highlight matching terms
- "No results" state when no matches
- Clear search button

## Sort Options
(Based on Display menu settings)
- Date created (default)
- Most clicked
- Alphabetical
- Recently updated
- Custom order (drag and drop)

## Next Steps
Need to clarify:
1. Bulk selection UI - how should checkboxes appear?
2. Inline editing - which fields are editable inline?
3. Link preview on hover - show destination URL preview?
4. Analytics preview - quick stats on hover?
5. Drag and drop for reordering - needed?
6. Keyboard navigation between links?
7. Link status indicators (active, paused, expired)?