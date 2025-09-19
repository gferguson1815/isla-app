# Epic 1: Foundation & Core Link Management

**Expanded Goal**: This epic establishes the technical foundation and delivers immediate value through basic link shortening functionality. Users will be able to sign up, create short links, and see real-time click analytics. This provides a working product from day one while setting up the infrastructure for all future features.

## Story 1.1: Project Setup and Infrastructure

**As a** developer,
**I want** to set up the Next.js project with TypeScript, Tailwind, and shadcn/ui,
**so that** we have a modern, type-safe foundation for rapid development.

**Acceptance Criteria:**
1. Next.js 14+ project initialized with App Router and TypeScript configuration
2. Tailwind CSS configured with custom design tokens matching brand guidelines
3. shadcn/ui installed with base components (Button, Input, Card, Dialog, Table)
4. Monorepo structure established using Turborepo with packages for shared utilities
5. Git repository initialized with proper .gitignore and branch protection rules
6. Prettier and ESLint configured with pre-commit hooks via Husky
7. Project runs locally with `pnpm dev` and builds successfully with `pnpm build`
8. pnpm workspace configured with proper package.json and pnpm-workspace.yaml

## Story 1.2: Supabase Setup and Database Schema

**As a** developer,
**I want** to configure Supabase with initial database schema,
**so that** we have authentication, data persistence, and real-time capabilities ready.

**Acceptance Criteria:**
1. Supabase project created and connected to Next.js application
2. Database schema created with tables for: users, workspaces, links, and click_events
3. Row Level Security (RLS) policies implemented for multi-tenant data isolation
4. Database migrations set up with proper versioning
5. Indexes created for high-performance queries (slug lookup, analytics aggregation)
6. Environment variables properly configured for local and production

## Story 1.3: Authentication Flow

**As a** user,
**I want** to sign up and sign in using magic links or Google,
**so that** I can securely access the platform without password hassle.

**Acceptance Criteria:**
1. Sign up page with email input for magic link authentication
2. Google OAuth integration with proper consent screen configuration
3. Magic link email sends within 2 seconds of request
4. Successful authentication redirects to dashboard
5. Session persistence across browser refreshes
6. Sign out functionality clears session and redirects to home
7. Protected routes redirect unauthenticated users to sign in

## Story 1.4: Link Shortening Core Functionality

**As a** user,
**I want** to create shortened URLs with custom or auto-generated slugs,
**so that** I can share memorable, trackable links.

**Acceptance Criteria:**
1. Link creation form accepts long URL and optional custom slug
2. Auto-generated slugs are 6-8 characters, alphanumeric, and unique
3. Custom slugs validate for uniqueness and allowed characters
4. Created links persist to database with proper workspace association
5. Link creation completes in under 100ms
6. Success state shows copyable short link
7. Input validation prevents invalid URLs and duplicate slugs
8. Links table shows all created links with edit and delete actions

## Story 1.5: Redirect Service

**As a** visitor,
**I want** short links to redirect quickly to destinations,
**so that** I reach intended content without noticeable delay.

**Acceptance Criteria:**
1. Redirect service deployed as Vercel Edge Function
2. Successful redirects complete in under 50ms at 95th percentile
3. Click events captured asynchronously without blocking redirect
4. 404 page shown for non-existent slugs
5. Redirect service handles 1000+ requests per minute
6. Click data includes timestamp, IP (hashed), user agent, referrer

## Story 1.6: Basic Analytics Dashboard

**As a** user,
**I want** to see real-time click analytics for my links,
**so that** I can understand link performance immediately.

**Acceptance Criteria:**
1. Dashboard displays total clicks per link
2. Click counter updates in real-time (< 1 second from click)
3. Time-series graph shows clicks over last 7 days
4. Basic metrics include: total clicks, unique clicks, click rate
5. Analytics load without blocking page render
6. Data refreshes automatically without page reload
