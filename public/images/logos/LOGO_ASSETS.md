# Isla Logo Assets Documentation

## Overview
Complete set of logo assets for the Isla brand across all platforms and use cases.

## Directory Structure

```
/public/images/logos/
├── SVG Source Files (High Quality, Scalable)
│   ├── isla-icon-black.svg        - Square icon with "i" on black background
│   ├── isla-icon-white.svg        - Square icon with "i" on white background
│   ├── isla-wordmark-black.svg    - Square with "isla" text on black background
│   └── isla-wordmark-white.svg    - Square with "isla" text on white background
│
├── Favicons (/favicon/)
│   ├── favicon-16x16.png          - Browser tab icon (small)
│   ├── favicon-32x32.png          - Browser tab icon (standard)
│   ├── favicon-48x48.png          - Windows taskbar
│   ├── favicon-64x64.png          - Windows site icons
│   ├── favicon-96x96.png          - Google TV
│   ├── favicon-128x128.png        - Chrome Web Store
│   └── favicon-256x256.png        - Large display
│
├── Apple Icons (/apple/)
│   ├── apple-touch-icon-57x57.png    - iPhone non-retina
│   ├── apple-touch-icon-60x60.png    - iPhone
│   ├── apple-touch-icon-72x72.png    - iPad non-retina
│   ├── apple-touch-icon-76x76.png    - iPad
│   ├── apple-touch-icon-114x114.png  - iPhone retina (iOS 6)
│   ├── apple-touch-icon-120x120.png  - iPhone retina
│   ├── apple-touch-icon-144x144.png  - iPad retina
│   ├── apple-touch-icon-152x152.png  - iPad retina
│   ├── apple-touch-icon-167x167.png  - iPad Pro
│   ├── apple-touch-icon-180x180.png  - iPhone 6 Plus
│   └── apple-touch-icon-1024x1024.png - App Store
│
├── Android Chrome (/android/)
│   ├── android-chrome-36x36.png
│   ├── android-chrome-48x48.png
│   ├── android-chrome-72x72.png
│   ├── android-chrome-96x96.png
│   ├── android-chrome-144x144.png
│   ├── android-chrome-192x192.png
│   └── android-chrome-512x512.png
│
├── PWA Icons (/pwa/)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png         - PWA manifest default
│   ├── icon-384x384.png
│   └── icon-512x512.png         - PWA splash screen
│
├── Web Assets (/web/)
│   ├── isla-icon-black-*.png    - Icon on black (32x32 to 2048x2048)
│   ├── isla-icon-white-*.png    - Icon on white (32x32 to 2048x2048)
│   ├── isla-wordmark-black-*.png - Wordmark on black (32x32 to 2048x2048)
│   └── isla-wordmark-white-*.png - Wordmark on white (32x32 to 2048x2048)
│
├── Social Media
│   ├── og-image.png             - Open Graph image (1200x630)
│   └── twitter-card.png         - Twitter card image (1200x600)
│
└── favicon.ico                  - Windows/Legacy browser favicon

```

## Usage Guidelines

### In Next.js App
- `app/favicon.ico` - Automatically served as favicon
- `app/apple-icon.png` - Apple touch icon
- `app/icon.png` - Default icon

### In HTML Head
```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/images/logos/favicon/favicon-32x32.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/images/logos/apple/apple-touch-icon-180x180.png">

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Open Graph -->
<meta property="og:image" content="/images/logos/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="/images/logos/twitter-card.png">
```

### React Component Usage
The `Logo.tsx` component provides a flexible way to render the logo in different contexts:

```tsx
import { Logo } from '@/components/brand/Logo';

// Icon version (single "i")
<Logo type="icon" size="md" variant="default" />

// Wordmark version ("isla" text)
<Logo type="wordmark" size="lg" variant="gradient" />
```

### Logo Variants
- **default**: Black background with white text
- **inverted**: White background with black text
- **gradient**: Purple to pink gradient background
- **wave**: Blue to cyan gradient background
- **dot**: Stylized dot and stem design

### Size Options
- **sm**: 40x40px (10 tailwind units)
- **md**: 56x56px (14 tailwind units)
- **lg**: 64x64px (16 tailwind units)
- **xl**: 80x80px (20 tailwind units)

## Brand Colors
- Primary Black: `#000000`
- Primary White: `#FFFFFF`
- Gradient Start: `#6366f1` (Indigo)
- Gradient Mid: `#3b82f6` (Blue)
- Gradient End: `#ec4899` (Pink)

## File Formats
- **SVG**: Use for web display at any size (scalable)
- **PNG**: Use for apps, social media, and raster requirements
- **ICO**: Legacy Windows/browser favicon support

## Quick Selection Guide

| Use Case | Recommended File |
|----------|-----------------|
| Website favicon | `/favicon.ico` or `/favicon/favicon-32x32.png` |
| iOS home screen | `/apple/apple-touch-icon-180x180.png` |
| Android home screen | `/android/android-chrome-192x192.png` |
| Social media sharing | `/og-image.png` |
| Email signature | `/web/isla-wordmark-black-256x256.png` |
| Print materials | SVG files (scalable) |
| App icon | `/web/isla-icon-black-1024x1024.png` |
| Documentation | `/web/isla-wordmark-black-512x512.png` |

## Regenerating Assets
To regenerate all PNG assets from the SVG sources:

```bash
node scripts/generate-logo-assets.js
node scripts/generate-og-image.js
```

Ensure `sharp` is installed:
```bash
npm install sharp --save-dev
```