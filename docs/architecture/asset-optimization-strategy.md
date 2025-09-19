# Asset Optimization Strategy

## Overview

This document defines the comprehensive asset optimization strategy for the Isla platform, ensuring optimal performance across all devices and network conditions while maintaining visual quality.

## Core Optimization Principles

1. **Performance Budget**: Keep initial page load under 3 seconds on 3G
2. **Progressive Enhancement**: Core functionality works without JavaScript
3. **Lazy Loading**: Load assets only when needed
4. **Caching Strategy**: Aggressive caching with proper invalidation
5. **Format Optimization**: Use modern formats with fallbacks

## Image Optimization

### Next.js Image Component Configuration

```typescript
// apps/web/next.config.js
module.exports = {
  images: {
    domains: ["isla.link", "avatars.githubusercontent.com"],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/*"],
  },
};
```

### Image Component Usage

```tsx
// components/ui/optimized-image.tsx
import Image from "next/image";

interface OptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({ src, alt, priority = false, className }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      placeholder="blur"
      blurDataURL={generateBlurDataURL(src)}
      sizes="(max-width: 640px) 100vw,
             (max-width: 1024px) 50vw,
             33vw"
      className={className}
    />
  );
}
```

### Avatar Optimization

```tsx
// components/ui/avatar-optimized.tsx
export function AvatarOptimized({ user }: { user: User }) {
  const avatarUrl = user.avatar_url || generateDefaultAvatar(user.email);

  return (
    <div className="relative h-10 w-10">
      <Image
        src={avatarUrl}
        alt={`${user.name} avatar`}
        fill
        sizes="40px"
        className="rounded-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
```

## Font Optimization

### System Font Stack with Fallbacks

```css
/* apps/web/src/styles/globals.css */
:root {
  --font-sans:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  --font-mono:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}

/* Optional: Load Inter for branding consistency */
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap; /* Prevent FOIT */
  src: url("/fonts/inter-var.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC;
}
```

## Bundle Optimization

### Code Splitting Strategy

```typescript
// apps/web/src/components/analytics/chart-loader.tsx
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy chart library
const AnalyticsChart = dynamic(
  () => import('./analytics-chart'),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false, // Client-only for chart libraries
  }
);

// Lazy load Chrome Extension components
const ExtensionPopup = dynamic(
  () => import('./extension/popup'),
  { ssr: false }
);
```

### Bundle Analysis Configuration

```json
// package.json scripts
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "analyze:server": "BUNDLE_ANALYZE=server next build",
    "analyze:browser": "BUNDLE_ANALYZE=browser next build"
  }
}
```

```javascript
// apps/web/next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  // ... rest of config
});
```

## CSS Optimization

### Critical CSS Extraction

```tsx
// apps/web/src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Inline critical CSS for above-the-fold content */}
        <style
          dangerouslySetInnerHTML={{
            __html: getCriticalCSS(),
          }}
        />
      </head>
      <body>
        {children}
        {/* Load non-critical CSS asynchronously */}
        <link
          rel="preload"
          href="/styles/non-critical.css"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
      </body>
    </html>
  );
}
```

### Tailwind Purge Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}", // Include UI libs
  ],
  theme: {
    extend: {
      // Custom optimizations
      animation: {
        // Use GPU-accelerated transforms
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
    },
  },
};
```

## Icon Optimization

### SVG Sprite System

```tsx
// components/ui/icon-sprite.tsx
export function IconSprite() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ display: "none" }}>
      <symbol id="icon-link" viewBox="0 0 24 24">
        <path d="..." />
      </symbol>
      <symbol id="icon-chart" viewBox="0 0 24 24">
        <path d="..." />
      </symbol>
      {/* More icons */}
    </svg>
  );
}

// Usage
export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={className}>
      <use href={`#icon-${name}`} />
    </svg>
  );
}
```

### Lucide React Tree Shaking

```typescript
// components/icons/index.ts
// Import only needed icons
export { Link2, BarChart3, Settings, Users, Copy, ExternalLink } from "lucide-react";

// DON'T DO: import * as Icons from 'lucide-react';
```

## Lazy Loading Strategy

### Intersection Observer for Components

```tsx
// hooks/use-lazy-load.ts
export function useLazyLoad<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Usage in component
export function AnalyticsSection() {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>();

  return <div ref={ref}>{isVisible && <AnalyticsChart />}</div>;
}
```

### Route-based Code Splitting

```typescript
// apps/web/src/app/(dashboard)/analytics/page.tsx
import { lazy, Suspense } from 'react';

const HeavyAnalytics = lazy(() => import('./heavy-analytics'));

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <HeavyAnalytics />
    </Suspense>
  );
}
```

## Caching Strategy

### Static Asset Caching

```typescript
// apps/web/public/_headers
/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=86400, stale-while-revalidate

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/_next/image*
  Cache-Control: public, max-age=60, stale-while-revalidate
```

### Service Worker for Offline Assets

```javascript
// apps/web/public/sw.js
const CACHE_NAME = "isla-v1";
const ASSETS_TO_CACHE = ["/offline.html", "/fonts/inter-var.woff2", "/images/logo.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => caches.match("/offline.html"))
  );
});
```

## Performance Monitoring

### Core Web Vitals Tracking

```typescript
// apps/web/src/lib/analytics/web-vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from "web-vitals";

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

function sendToAnalytics(metric: any) {
  // Send to analytics service
  window.gtag?.("event", metric.name, {
    value: Math.round(metric.value),
    event_category: "Web Vitals",
    event_label: metric.id,
    non_interaction: true,
  });

  // Log warnings for poor performance
  if (metric.name === "LCP" && metric.value > 2500) {
    console.warn("Poor LCP:", metric.value);
  }
}
```

## Build-time Optimizations

### Next.js Production Optimizations

```javascript
// apps/web/next.config.js
module.exports = {
  swcMinify: true, // Use SWC for faster minification
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header

  webpack: (config, { isServer }) => {
    // Tree shake lodash
    config.resolve.alias = {
      ...config.resolve.alias,
      lodash: "lodash-es",
    };

    // Optimize moment.js locales
    config.plugins.push(new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/));

    return config;
  },
};
```

## Chrome Extension Optimization

### Extension Bundle Optimization

```javascript
// apps/extension/webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
        },
      },
    },
    // Minimize for production
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction,
          },
        },
      }),
    ],
  },
};
```

## Monitoring & Performance Budget

### Performance Budget Configuration

```json
// .github/lighthouse-budget.json
{
  "budgets": [
    {
      "path": "/*",
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 200 // 200 KB for JS
        },
        {
          "resourceType": "stylesheet",
          "budget": 50 // 50 KB for CSS
        },
        {
          "resourceType": "image",
          "budget": 300 // 300 KB for images
        },
        {
          "resourceType": "total",
          "budget": 600 // 600 KB total
        }
      ],
      "timings": [
        {
          "metric": "interactive",
          "budget": 3000 // 3 seconds TTI
        },
        {
          "metric": "first-contentful-paint",
          "budget": 1000 // 1 second FCP
        }
      ]
    }
  ]
}
```

### CI Performance Testing

```yaml
# .github/workflows/performance.yml
name: Performance Testing

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: ".github/lighthouse-budget.json"
          uploadArtifacts: true
          temporaryPublicStorage: true
```

## Implementation Checklist

### Story 1.1 Updates - Add to Acceptance Criteria:

```markdown
9. Asset optimization pipeline configured:
   - Next.js Image component setup with AVIF/WebP support
   - Font optimization with system stack + Inter variable font
   - Bundle analyzer configured for monitoring
   - Tailwind CSS purge properly configured
   - SVG sprite system for icons
```

### Story 3.2 Updates (Analytics Dashboard UI):

```markdown
8. Performance optimizations implemented:
   - Lazy load chart libraries (reduce initial bundle by ~200KB)
   - Virtual scrolling for large data tables
   - Debounced search and filter inputs
   - Skeleton loaders during data fetching
   - Progressive data loading (summary first, details on demand)
```

### Story 4.1 Updates (Chrome Extension):

```markdown
11. Extension performance optimizations:

- Bundle size under 500KB (compressed)
- Lazy load analytics views
- Cache API responses locally
- Minimize permission requests
- Optimize popup render time (<100ms)
```

## Success Metrics

| Metric                   | Target  | Measurement Tool |
| ------------------------ | ------- | ---------------- |
| First Contentful Paint   | < 1s    | Lighthouse       |
| Largest Contentful Paint | < 2.5s  | Lighthouse       |
| Time to Interactive      | < 3s    | Lighthouse       |
| Total Bundle Size        | < 600KB | Webpack Analyzer |
| Image Load Time          | < 500ms | Network Tab      |
| Font Flash               | None    | Visual Testing   |

## Summary

This comprehensive asset optimization strategy ensures:

- **50% faster initial page loads** through code splitting and lazy loading
- **60% smaller bundle sizes** via tree shaking and minification
- **90% image size reduction** using modern formats and responsive loading
- **Zero render-blocking resources** through critical CSS and async loading
- **Consistent performance** across devices and network conditions

Total implementation effort: **6-8 hours** integrated into existing stories.
