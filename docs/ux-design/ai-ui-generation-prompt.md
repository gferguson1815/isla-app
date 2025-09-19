# AI UI Generation Prompt - Modern Link Management Platform

## Overview
This document contains the comprehensive prompt for generating UI components using AI tools like v0, Lovable, Claude, or similar platforms.

---

## Master Prompt for AI UI Generation

```prompt
# Modern Link Management Platform - Dub.co Style Interface

## High-Level Goal
Create a sophisticated link management platform interface inspired by Dub.co's exceptional UX, featuring a clean monochromatic design with inline editing, real-time collaboration, and intuitive workflows for non-technical marketing teams. The platform should feel like "Notion meets Dub.co" - professional yet approachable, powerful yet simple.

## Project Context
- **Tech Stack**: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui components, Supabase (auth & database)
- **Design Philosophy**: Minimalist monochromatic palette (black primary actions, subtle grays), Inter font
- **Key Features**: Link shortening, real-time analytics, team workspaces, Chrome extension
- **Target Users**: Marketing teams, content creators, small businesses
- **Performance**: Sub-100ms link creation, real-time analytics updates

## Three-Column Layout Architecture

Create a three-column desktop layout (1440px width):
1. **Left Panel (220px)**: Account/workspace navigation
2. **Middle Panel (300px)**: Links list and navigation
3. **Right Panel (fluid)**: Main content area for details/analytics/editing

## Detailed Component Instructions

### 1. Left Panel - Workspace Navigation
Create a fixed-width (220px) sidebar with:

**Structure:**
- Logo at top (clickable to home)
- Workspace selector dropdown with avatar and name
- Navigation sections:
  - INSIGHTS: Analytics, Events, Customers (with icons)
  - LIBRARY: Folders, Tags, UTM Templates (with icons)
- Usage meters at bottom:
  - Events: X of 1K
  - Links: X of 25
  - Reset date text
- Upgrade CTA button (full black)

**Styling:**
- Background: white with subtle left border
- Text: Primary black (#000) for labels
- Icons: Gray (#6B7280)
- Hover states: Light gray background
- Active state: Black text with left border accent

### 2. Middle Panel - Links List
Create a fixed-width (300px) list panel with:

**Header:**
- "Links" title (16px, semibold)
- Filter dropdown button
- Display toggle (list/grid icons)
- Search input (expandable)

**List Area:**
When empty:
- Centered message "No links yet"
- Subtle helper text

When populated:
- Link items (48px height each)
- Show short URL and click count
- Hover reveals copy and preview buttons
- Selection checkbox on hover
- Click to select and show in right panel

**Footer:**
- "Viewing X links" counter
- Previous/Next pagination buttons

### 3. Right Panel - Main Content Area
Create a flexible-width content area with multiple states:

**Empty State:**
```html
<div class="flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-md text-center">
    <h2 class="text-2xl font-semibold mb-2">No links yet</h2>
    <p class="text-gray-600 mb-6">
      Start creating short links for your marketing campaigns,
      referral programs, and more.
    </p>
    <button class="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800">
      Create link
    </button>
    <a href="#" class="block mt-4 text-sm text-gray-500 hover:text-gray-700">
      Learn more
    </a>
  </div>
</div>
```

**Link Selected State:**
Show comprehensive link details with:
- Editable short URL field with copy button
- Editable destination URL field
- Tags selector (multi-select)
- Analytics section with chart
- Share buttons (X, LinkedIn, Email, QR)
- Action buttons (Duplicate, Archive, Delete)

### 4. Create Link Modal
Implement a modal dialog (600px wide) with:

**Fields:**
1. Destination URL input (required, auto-focus)
2. Short link with domain prefix and editable slug
3. Collapsible advanced options:
   - Tags multi-select
   - Campaign dropdown
   - UTM parameters builder

**Actions:**
- Cancel button (ghost style)
- Create link button (black, primary)

**Behavior:**
- Open with Cmd+K or create button
- Auto-generate slug on URL paste
- Show preview of final URL
- Validate in real-time
- Success state shows copy button

### 5. Analytics Dashboard Components

Create modular analytics components:

**Metrics Cards:**
```jsx
<div class="grid grid-cols-4 gap-4">
  <MetricCard
    title="Total Clicks"
    value="1,234"
    change="+12%"
    trend="up"
  />
  <MetricCard
    title="Unique Visitors"
    value="892"
    change="+8%"
    trend="up"
  />
</div>
```

**Time Series Chart:**
- Use Recharts or similar
- Show clicks over time
- Smooth line with gradient fill
- Hover tooltips with details
- Date range selector

**Geographic Map:**
- World map with heat overlay
- Show click density by region
- Hover for country details

### 6. Mobile Responsive Design

**Breakpoints:**
- Mobile: 320-767px (single column, bottom nav)
- Tablet: 768-1023px (two columns)
- Desktop: 1024px+ (three columns)

**Mobile Adaptations:**
- Hamburger menu for left panel
- Full-screen links list
- Bottom sheet for link details
- FAB for quick create
- Swipe gestures for actions

## Visual Design System

**Colors:**
```css
:root {
  --primary: #000000;
  --primary-hover: #171717;
  --background: #FFFFFF;
  --border: #E5E5E5;
  --muted: #FAFAFA;
  --text-primary: #000000;
  --text-secondary: #666666;
  --text-muted: #999999;
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --link: #0066CC;
}
```

**Typography:**
```css
:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
}
```

**Spacing:**
- Base unit: 4px
- Use Tailwind spacing scale
- Consistent padding: p-4 (16px) mobile, p-6 (24px) desktop

**Components:**
- Use shadcn/ui as base components
- Customize with Tailwind classes
- No custom CSS files
- Maintain consistent border radius (6px small, 8px medium)

## Implementation Requirements

**DO:**
- Use Next.js 14 App Router
- Implement with TypeScript
- Use shadcn/ui components
- Apply Tailwind for all styling
- Include loading states
- Add error boundaries
- Implement keyboard navigation
- Use Supabase for data
- Include ARIA labels

**DON'T:**
- Create custom CSS files
- Use inline styles
- Build authentication (use Supabase)
- Create backend logic
- Use external icon libraries (use Lucide)
- Add unnecessary animations
- Include comments in code

## File Structure

Generate these files:
```
app/
  dashboard/
    page.tsx (main dashboard)
    layout.tsx (three-column layout)
components/
  dashboard/
    LeftPanel.tsx
    LinksPanel.tsx
    ContentArea.tsx
    CreateLinkModal.tsx
    LinkDetails.tsx
    EmptyState.tsx
  ui/
    MetricCard.tsx
    LinkItem.tsx
lib/
  types.ts (TypeScript interfaces)
  mock-data.ts (for initial development)
```

## Component Example

Here's a complete LinkItem component:

```tsx
import { Copy, ExternalLink, MoreHorizontal } from 'lucide-react'

interface LinkItemProps {
  shortUrl: string
  destination: string
  clicks: number
  isSelected?: boolean
  onSelect: () => void
}

export function LinkItem({
  shortUrl,
  destination,
  clicks,
  isSelected,
  onSelect
}: LinkItemProps) {
  return (
    <div
      className={`
        group flex items-center justify-between p-3 cursor-pointer
        hover:bg-gray-50 border-b border-gray-100
        ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}
      `}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {shortUrl}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {destination}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {clicks} clicks
        </span>

        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(shortUrl)
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Copy className="w-3 h-3" />
          </button>

          <button className="p-1 hover:bg-gray-200 rounded">
            <MoreHorizontal className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

## Success Criteria

The generated UI should:
1. Match Dub.co's clean aesthetic
2. Support all CRUD operations for links
3. Update in real-time without page refreshes
4. Work flawlessly on mobile and desktop
5. Load in under 1 second
6. Be fully keyboard navigable
7. Pass WCAG AA accessibility standards

Remember: This is a Dub.co competitor. The UX must be exceptional - every interaction should feel instant, intuitive, and delightful. Focus on making link management feel effortless for non-technical users while preserving power features for advanced users.
```

---

## Usage Instructions

### For v0 by Vercel
1. Copy the entire prompt above
2. Paste into v0.dev
3. Generate components iteratively
4. Start with the layout, then individual panels

### For Lovable
1. Create new project
2. Paste the prompt in the initial setup
3. Use the preview to iterate
4. Export when complete

### For Claude or ChatGPT
1. Copy the prompt
2. Request specific components
3. Ask for iterations and refinements
4. Combine outputs into your project

### For Cursor/Copilot
1. Add prompt as context
2. Generate files one by one
3. Use inline suggestions for refinements

## Validation Checklist

- [ ] Three-column layout matches Dub.co structure
- [ ] Inline editing works without modals
- [ ] Real-time updates implemented
- [ ] Mobile responsive design complete
- [ ] Keyboard navigation functional
- [ ] Loading states present
- [ ] Error handling implemented
- [ ] Accessibility standards met
- [ ] Performance targets achieved

## Next Steps

1. Generate initial components with AI tool
2. Set up Supabase backend
3. Connect real-time subscriptions
4. Implement Chrome extension
5. Add team collaboration features
6. Conduct user testing
7. Iterate based on feedback