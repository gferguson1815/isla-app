# Design System - Modern Link Management Platform

## Overview
This document defines the complete design system for the link management platform, ensuring consistency across all interfaces.

## Brand Identity

### Design Principles
1. **Simplicity First** - Every element serves a purpose
2. **Speed is Feature** - Sub-100ms interactions
3. **Progressive Disclosure** - Complexity reveals gradually
4. **Familiar Patterns** - Like Notion and Linear
5. **Monochromatic Elegance** - Following Dub.co's aesthetic

## Color System

### Primary Palette
```css
/* Core Colors */
--color-primary: #000000;        /* Primary actions, CTAs */
--color-primary-hover: #171717;  /* Hover state for primary */
--color-background: #FFFFFF;     /* Main background */
--color-surface: #FAFAFA;        /* Card backgrounds */
--color-border: #E5E5E5;         /* All borders */

/* Text Colors */
--color-text-primary: #000000;   /* Headings, primary text */
--color-text-secondary: #666666; /* Secondary text */
--color-text-muted: #999999;     /* Disabled, hints */
--color-text-inverse: #FFFFFF;   /* Text on dark backgrounds */

/* Semantic Colors */
--color-success: #10B981;        /* Success states */
--color-warning: #F59E0B;        /* Warning states */
--color-error: #EF4444;          /* Error states */
--color-info: #3B82F6;           /* Information */
--color-link: #0066CC;           /* Hyperlinks */

/* State Colors */
--color-hover: rgba(0, 0, 0, 0.05);
--color-active: rgba(0, 0, 0, 0.1);
--color-selected: rgba(0, 102, 204, 0.1);
--color-focus: rgba(59, 130, 246, 0.5);
```

### Usage Guidelines
- **Black (#000000)**: Primary CTAs only
- **Grays**: Content hierarchy
- **Colors**: Semantic meaning only
- **White space**: Primary design element

## Typography

### Font Stack
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Roboto, Oxygen, Ubuntu, sans-serif;
--font-mono: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
```

### Type Scale
```css
--text-xs: 0.75rem;    /* 12px - Labels, captions */
--text-sm: 0.875rem;   /* 14px - Body small, buttons */
--text-base: 1rem;     /* 16px - Body default */
--text-lg: 1.125rem;   /* 18px - Emphasized body */
--text-xl: 1.25rem;    /* 20px - H3 */
--text-2xl: 1.5rem;    /* 24px - H2 */
--text-3xl: 1.875rem;  /* 30px - H1 */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Typography Patterns
```css
/* Headings */
h1 { font-size: var(--text-3xl); font-weight: var(--font-bold); }
h2 { font-size: var(--text-2xl); font-weight: var(--font-semibold); }
h3 { font-size: var(--text-xl); font-weight: var(--font-semibold); }

/* Body */
body { font-size: var(--text-base); line-height: var(--leading-normal); }
small { font-size: var(--text-sm); }

/* Links */
a { color: var(--color-link); text-decoration: none; }
a:hover { text-decoration: underline; }

/* Code */
code { font-family: var(--font-mono); font-size: var(--text-sm); }
```

## Spacing System

### Base Unit: 4px
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Component Spacing
- **Card padding**: 16px mobile, 24px desktop
- **Section spacing**: 32px mobile, 48px desktop
- **Input padding**: 12px horizontal, 8px vertical
- **Button padding**: 16px horizontal, 8px vertical

## Layout System

### Grid System
```css
/* Container widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Column widths (desktop) */
--panel-left: 220px;    /* Account navigation */
--panel-middle: 300px;  /* Links list */
--panel-right: 1fr;     /* Main content */
```

### Breakpoints
```css
--breakpoint-sm: 640px;   /* Mobile → Tablet */
--breakpoint-md: 768px;   /* Tablet → Desktop */
--breakpoint-lg: 1024px;  /* Desktop → Wide */
--breakpoint-xl: 1280px;  /* Wide → Ultra-wide */
```

## Components

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  padding: var(--space-2) var(--space-4);
  border-radius: 6px;
  font-weight: var(--font-medium);
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
```

### Inputs
```css
.input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: var(--text-sm);
  transition: all 150ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus);
}
```

### Cards
```css
.card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--space-4);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

## Icons

### Icon Library: Lucide
- Size: 16px (small), 20px (default), 24px (large)
- Stroke width: 1.5px
- Color: Inherit from parent

### Common Icons
```
Navigation:
- Home: home
- Analytics: bar-chart-2
- Links: link
- Settings: settings
- Users: users

Actions:
- Create: plus
- Edit: pencil
- Delete: trash-2
- Copy: copy
- Share: share-2

States:
- Success: check-circle
- Warning: alert-triangle
- Error: x-circle
- Info: info
```

## Animation System

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Duration
```css
--duration-fast: 150ms;     /* Hover states */
--duration-normal: 250ms;   /* Transitions */
--duration-slow: 350ms;     /* Complex animations */
```

### Common Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Skeleton Loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

## Shadows & Elevation

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Elevation Levels
1. **Ground**: No shadow (tables, lists)
2. **Raised**: shadow-sm (cards, inputs)
3. **Floating**: shadow-md (dropdowns)
4. **Overlay**: shadow-lg (modals)
5. **Popup**: shadow-xl (tooltips)

## Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;    /* Inputs, small buttons */
--radius-md: 6px;    /* Buttons, tags */
--radius-lg: 8px;    /* Cards, modals */
--radius-xl: 12px;   /* Large cards */
--radius-full: 9999px; /* Pills, avatars */
```

## Z-Index Scale

```css
--z-0: 0;          /* Base */
--z-10: 10;        /* Dropdowns */
--z-20: 20;        /* Sticky elements */
--z-30: 30;        /* Fixed headers */
--z-40: 40;        /* Overlays */
--z-50: 50;        /* Modals */
--z-60: 60;        /* Tooltips */
--z-max: 9999;     /* Critical alerts */
```

## Accessibility

### Focus States
- All interactive elements have visible focus indicators
- Focus ring: 3px, color: var(--color-focus)
- Keyboard navigation follows logical order

### Color Contrast
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### ARIA Guidelines
- All buttons have labels
- Form inputs have associated labels
- Dynamic content has live regions
- Loading states announced to screen readers

## Implementation Notes

### Using with Tailwind CSS
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        'primary-hover': '#171717',
        // ... rest of color system
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['SF Mono', ...defaultTheme.fontFamily.mono],
      },
      spacing: {
        // Custom spacing values
      },
    },
  },
}
```

### Using with CSS Variables
```css
:root {
  /* Import all design tokens */
  @import 'design-tokens.css';
}

/* Dark mode support (future) */
[data-theme="dark"] {
  --color-primary: #FFFFFF;
  --color-background: #000000;
  /* ... dark theme overrides */
}
```

## Component Library Integration

### With shadcn/ui
- Override default theme with our design tokens
- Use Tailwind classes exclusively
- Maintain component consistency

### Custom Components
- Follow shadcn/ui patterns
- Use design tokens via CSS variables
- Document variations and states

## Version History

- **v1.0.0** - Initial design system
- **v1.1.0** - Added Chrome extension specs
- **v1.2.0** - Mobile responsive updates

---

Last Updated: 2024
Design System Version: 1.0.0