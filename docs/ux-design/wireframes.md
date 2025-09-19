# Link Management Platform - Wireframes & Layout Specifications

## Overview
This document contains the complete wireframe specifications for the Modern Link Management Platform, following Dub.co's proven UX patterns.

## Desktop Layout Architecture (1440px)

### Three-Column Structure
```
┌────────────────────────────────────────────────────────┐
│ Account     │  Links List/Nav  │   Main Content Area    │
│ (220px)     │  (300px)         │   (920px fluid)        │
├─────────────┼──────────────────┼────────────────────────┤
│ dub         │ Links            │                        │
│             │                  │   ┌──────────────┐     │
│ [S] Team ▼  │ [Filter▼][Display│   │              │     │
│             │          ][🔍]   │   │  No links    │     │
│ — Insights  │                  │   │     yet      │     │
│ 📊 Analytics│ ┌──────────────┐ │   │              │     │
│ 📈 Events   │ │              │ │   │ Start creating│     │
│ 👥 Customers│ │ Links would  │ │   │ short links..│     │
│             │ │ appear here  │ │   │              │     │
│ — Library   │ │ when created │ │   │ [Create link]│     │
│ 📁 Folders  │ │              │ │   │ [Learn more] │     │
│ 🏷️ Tags     │ └──────────────┘ │   └──────────────┘     │
│ 🎯 UTM      │                  │                        │
│             │ Viewing 0 links  │                        │
│ — Usage     │ [Prev] [Next]    │   [Create link] button │
│ Events: 0/1K│                  │   (top right corner)   │
│ Links: 0/25 │                  │                        │
│             │                  │                        │
│ [Get Pro]   │                  │                        │
└─────────────┴──────────────────┴────────────────────────┘
```

## Component Specifications

### 1. Left Panel - Account/Workspace (220px fixed)
- **Logo**: Top aligned, clickable to dashboard
- **Workspace Selector**:
  - Avatar/Initial bubble
  - Workspace name with dropdown chevron
  - Switch between workspaces
- **Navigation Sections**:
  - INSIGHTS: Analytics, Events, Customers
  - LIBRARY: Folders, Tags, UTM Templates
- **Usage Metrics**:
  - Event counter with limits
  - Links counter with limits
  - Reset date information
- **Upgrade CTA**: Full-width black button

### 2. Middle Panel - Links List/Navigation (300px fixed)
- **Header**: "Links" title
- **Controls Bar**:
  - Filter dropdown (tags, dates, campaigns)
  - Display toggle (list/grid view)
  - Search bar (expandable)
- **Links Table** (when populated):
  - Compact row height (48px)
  - Columns: Short URL, Clicks
  - Hover actions: Copy, Preview
  - Selection checkboxes
- **Empty State**:
  - Instructional text
  - Secondary CTA
- **Footer**:
  - "Viewing X links" counter
  - Pagination controls

### 3. Right Panel - Main Content Area (Fluid width)
**States:**

#### Empty State
```
┌──────────────────────────┐
│                          │
│      No links yet        │
│                          │
│  Start creating short    │
│  links for your          │
│  marketing campaigns,    │
│  referral programs,      │
│  and more.              │
│                          │
│   [Create link] (black)  │
│     Learn more (link)    │
│                          │
└──────────────────────────┘
```

#### Link Selected State
```
┌──────────────────────────┐
│ Link Details             │
├──────────────────────────┤
│ Short URL                │
│ [acme.link/summer    📋] │
│                          │
│ Destination              │
│ [example.com/campaign  ] │
│                          │
│ Tags                     │
│ [#summer #promo      +] │
│                          │
│ — Analytics              │
│ Total Clicks: 1,234      │
│ [=========] 📈          │
│                          │
│ — Share                  │
│ [X] [in] [📧] [QR Code] │
│                          │
│ — Actions                │
│ [Duplicate] [Archive]    │
│ [Delete]                 │
└──────────────────────────┘
```

## Mobile Layout (375px)

### Navigation Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ ≡  Links    │ --> │ Link List   │ --> │ Link Detail │
│             │     │             │     │  (Sheet)    │
│ [List View] │     │ [Link 1]    │     │             │
│             │     │ [Link 2]    │     │ [Full View] │
│     (+)     │     │ [Link 3]    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Mobile Components
- **Header**: Hamburger menu, title, create button
- **List View**: Card-based layout with swipe actions
- **Bottom Sheet**: Link details and actions
- **FAB**: Floating action button for quick create

## Create Link Modal

```
┌─────────────────────────────────────┐
│        Create a new link        [X] │
├─────────────────────────────────────┤
│ Destination URL *                   │
│ ┌─────────────────────────────────┐ │
│ │ https://                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Short Link                          │
│ ┌──────────────┬──────────────────┐ │
│ │ acme.link/   │ (auto-generated) │ │
│ └──────────────┴──────────────────┘ │
│                                     │
│ ▼ Advanced Options                  │
│                                     │
│ Tags                                │
│ ┌─────────────────────────────────┐ │
│ │ Select or create tags...        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Campaign                            │
│ ┌─────────────────────────────────┐ │
│ │ Select campaign...              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ UTM Parameters                      │
│ ┌─────────────────────────────────┐ │
│ │ + Add UTM parameters            │ │
│ └─────────────────────────────────┘ │
│                                     │
│          [Cancel] [Create link]     │
└─────────────────────────────────────┘
```

## Chrome Extension (400x600px)

```
┌────────────────────┐
│ 🔗 Link Manager    │
├────────────────────┤
│ Current Page:      │
│ ┌────────────────┐ │
│ │ example.com/.. │ │
│ └────────────────┘ │
│                    │
│ Custom slug:       │
│ ┌────────────────┐ │
│ │ (optional)     │ │
│ └────────────────┘ │
│                    │
│ [Shorten This URL] │
│                    │
│ ─ After Creation ─ │
│                    │
│ ✅ Link Created!   │
│ ┌────────────────┐ │
│ │ acme.link/xyz  │ │
│ └────────────────┘ │
│ [📋 Copy]          │
│                    │
│ Share:             │
│ [X] [in] [📧] [QR]│
│                    │
│ Clicks: 0 (live)   │
│                    │
│ Recent Links:      │
│ ┌────────────────┐ │
│ │ • /summer (45) │ │
│ │ • /promo (123) │ │
│ └────────────────┘ │
│                    │
│ [Open Dashboard]   │
└────────────────────┘
```

## Interaction Patterns

### Inline Editing
- Single click on editable fields transforms to input
- Auto-save on blur or Enter key
- Escape key cancels edit
- Show loading spinner during save
- Optimistic UI updates with rollback on error

### Keyboard Navigation
- Tab: Navigate between fields
- Enter: Submit/Save
- Escape: Cancel operation
- Cmd+K: Open command palette
- Cmd+C: Copy link
- Cmd+N: Create new link

### Real-time Updates
- WebSocket connections for live data
- Pulse animation on metric updates
- Live counters for clicks
- Presence indicators for team members
- Auto-refresh every 30 seconds as fallback

## Responsive Breakpoints

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1439px
- **Wide**: 1440px+

## Accessibility Requirements

- WCAG AA compliance
- Keyboard navigation for all interactions
- Screen reader announcements for updates
- Focus indicators on all interactive elements
- Proper ARIA labels and roles
- Color contrast ratio 4.5:1 minimum

## Performance Targets

- Link creation: < 100ms
- Page load: < 1 second
- Analytics update: < 1 second (real-time)
- Search results: < 200ms
- Redirect latency: < 50ms

## Next Steps

1. Create high-fidelity mockups in Figma
2. Build component library in Storybook
3. Implement with Next.js and shadcn/ui
4. User testing with marketing teams
5. Iterate based on feedback