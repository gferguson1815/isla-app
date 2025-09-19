# Isla App - Modern Link Management Platform Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for Isla App - Modern Link Management Platform, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**N/A - Greenfield project**

This is a new greenfield project without an existing starter template. The architecture will be built from scratch using Next.js 14+, Supabase, and Vercel as specified in the PRD technical assumptions.

### Change Log

| Date       | Version | Description                   | Author              |
| ---------- | ------- | ----------------------------- | ------------------- |
| 2025-01-18 | 1.0.0   | Initial architecture document | Winston (Architect) |

## High Level Architecture

### Technical Summary

Isla App employs a **serverless, edge-optimized architecture** using Next.js 14 App Router deployed on Vercel with Supabase as the backend-as-a-service platform. The frontend leverages React Server Components for optimal performance while the backend utilizes Vercel Edge Functions for sub-50ms redirect latency globally. Integration occurs through Supabase's auto-generated REST APIs and real-time subscriptions for live analytics updates. The infrastructure runs on Vercel's global edge network with Supabase providing PostgreSQL, authentication, and storage services. This architecture achieves the PRD goals of immediate time-to-value (<2 min onboarding), enterprise capabilities with consumer-grade UX, and cost-effective scaling from $0 to thousands of users.

### Platform and Infrastructure Choice

**Platform:** Vercel + Supabase
**Key Services:**

- Vercel: Edge Functions, KV Storage (Redis), Analytics, Web Analytics
- Supabase: PostgreSQL with RLS, Auth (Magic Links + OAuth), Realtime, Storage
  **Deployment Host and Regions:**
- Vercel: Global edge network (automatic)
- Supabase: Primary region US-East-1 with read replicas as needed

### Repository Structure

**Structure:** Monorepo
**Monorepo Tool:** Turborepo (optimized for Next.js and Vercel deployments)
**Package Organization:**

- apps/web (Next.js application)
- apps/extension (Chrome extension)
- packages/shared (types, constants, utilities)
- packages/ui (shared components)
- packages/database (Prisma schema, migrations, client)

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Users"
        U1[Marketing Teams]
        U2[Chrome Extension Users]
        U3[API Consumers]
    end

    subgraph "CDN & Edge"
        CF[Cloudflare CDN]
        VE[Vercel Edge Network]
    end

    subgraph "Application Layer"
        NX[Next.js App<br/>React Server Components]
        EF[Edge Functions<br/>Link Redirects]
        API[API Routes<br/>Next.js Route Handlers]
    end

    subgraph "Cache Layer"
        VKV[Vercel KV<br/>Redis]
        ISR[ISR Cache]
    end

    subgraph "Supabase Platform"
        AUTH[Supabase Auth<br/>Magic Links + Google OAuth]
        PG[(PostgreSQL<br/>with RLS)]
        RT[Realtime<br/>Subscriptions]
        ST[Storage<br/>Files & Assets]
    end

    subgraph "External Services"
        STR[Stripe<br/>Payments]
        RES[Resend<br/>Email]
        SEN[Sentry<br/>Monitoring]
    end

    U1 --> CF
    U2 --> CF
    U3 --> API

    CF --> VE
    VE --> NX
    VE --> EF

    NX --> API
    NX --> ISR
    API --> VKV
    EF --> VKV

    API --> AUTH
    API --> PG
    API --> RT
    API --> ST

    NX --> RT
    API --> STR
    API --> RES
    NX --> SEN
    API --> SEN

    VKV -.->|Cache Miss| PG
    RT -.->|Subscriptions| PG
```

### Architectural Patterns

- **Jamstack Architecture:** Static generation with dynamic API routes - _Rationale:_ Optimal performance with CDN distribution and serverless scaling
- **Edge-First Computing:** Link redirects and analytics capture at edge locations - _Rationale:_ Sub-50ms redirect latency requirement globally
- **Backend-as-a-Service (BaaS):** Supabase for database, auth, realtime - _Rationale:_ Rapid development with managed infrastructure under $50/month
- **Row Level Security (RLS):** PostgreSQL RLS for multi-tenant isolation - _Rationale:_ Secure workspace separation without complex application logic
- **Event-Driven Analytics:** Async processing of click events - _Rationale:_ Non-blocking redirects with accurate analytics capture
- **Optimistic UI Updates:** Immediate UI feedback with background sync - _Rationale:_ Perceived performance for link creation and updates
- **Repository Pattern:** Abstract Supabase queries behind service layer - _Rationale:_ Testability and potential future database migration
- **Atomic Design System:** Component hierarchy from atoms to templates - _Rationale:_ Consistent UI and efficient development with shadcn/ui

## Tech Stack

This is the **DEFINITIVE technology selection** for the entire project. All development must use these exact versions.

### Technology Stack Table

| Category             | Technology               | Version  | Purpose                        | Rationale                                                   |
| -------------------- | ------------------------ | -------- | ------------------------------ | ----------------------------------------------------------- |
| Frontend Language    | TypeScript               | 5.3+     | Type-safe frontend development | Type safety critical for team collaboration and refactoring |
| Frontend Framework   | Next.js                  | 14.2+    | Full-stack React framework     | App Router, RSC, and edge runtime support                   |
| UI Component Library | shadcn/ui                | Latest   | Customizable component system  | Radix UI primitives with Tailwind styling flexibility       |
| Animation Library    | Framer Motion            | 11.0+    | UI animations                  | Dub.co-style smooth transitions and micro-interactions      |
| Charts Library       | Recharts                 | 2.10+    | Data visualization             | Time series charts with animations                          |
| State Management     | Zustand                  | 4.5+     | Client-side state management   | Lightweight with TypeScript support, simpler than Redux     |
| Backend Language     | TypeScript               | 5.3+     | Type-safe backend development  | Shared types between frontend and backend                   |
| Backend Framework    | Next.js API Routes       | 14.2+    | Serverless API endpoints       | Unified deployment with frontend                            |
| API Style            | REST + tRPC              | tRPC v10 | Type-safe API communication    | REST for public API, tRPC for internal type safety          |
| Database             | PostgreSQL (Supabase)    | 15+      | Primary data store             | ACID compliance with RLS for multi-tenancy                  |
| ORM                  | Prisma                   | 5.9+     | Database toolkit               | Type-safe queries, migrations, works with Supabase          |
| Cache                | Vercel KV                | Latest   | Redis-compatible caching       | Edge-distributed for link redirect performance              |
| File Storage         | Supabase Storage         | Latest   | User uploads and assets        | Integrated with auth and RLS                                |
| Authentication       | Supabase Auth            | 2.0+     | User authentication            | Magic links + OAuth with session management                 |
| Frontend Testing     | Vitest + Testing Library | Latest   | Unit and integration tests     | Fast with React Testing Library integration                 |
| Backend Testing      | Vitest                   | Latest   | API and service tests          | Consistent tooling with frontend                            |
| E2E Testing          | Playwright               | 1.40+    | End-to-end testing             | Cross-browser testing with good DX                          |
| Build Tool           | pnpm                     | 8.0+     | Package management & builds    | Fast, disk-efficient monorepo package manager               |
| Bundler              | Turbopack                | Beta     | Development bundler            | Faster HMR in development                                   |
| IaC Tool             | Terraform                | 1.6+     | Infrastructure as code         | Manage Supabase and Vercel resources                        |
| CI/CD                | GitHub Actions           | Latest   | Automated deployment           | Native GitHub integration with Vercel                       |
| Monitoring           | Sentry                   | Latest   | Error tracking                 | Real user monitoring and performance                        |
| Logging              | Axiom                    | Latest   | Centralized logging            | Vercel integration with structured logs                     |
| CSS Framework        | Tailwind CSS             | 3.4+     | Utility-first styling          | Rapid development with consistent design                    |

## Data Models

### User

**Purpose:** Core user account with authentication and profile information

**Key Attributes:**

- id: UUID - Unique identifier from Supabase Auth
- email: string - Primary email address
- name: string - Display name
- avatar_url: string | null - Profile picture URL
- created_at: timestamp - Account creation date
- updated_at: timestamp - Last profile update

#### TypeScript Interface

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}
```

#### Relationships

- Has many WorkspaceMemberships
- Has many PersonalLinks (outside workspaces)

### Workspace

**Purpose:** Team workspace for collaborative link management and analytics

**Key Attributes:**

- id: UUID - Unique workspace identifier
- name: string - Workspace name
- slug: string - URL-friendly identifier
- owner_id: UUID - Creator/owner user ID
- plan: enum - Subscription tier (free, pro, enterprise)
- created_at: timestamp - Workspace creation date

#### TypeScript Interface

```typescript
interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: "free" | "pro" | "enterprise";
  created_at: Date;
}
```

#### Relationships

- Belongs to User (owner)
- Has many WorkspaceMemberships
- Has many Links
- Has many Tags

### Link

**Purpose:** Core shortened URL entity with metadata and analytics

**Key Attributes:**

- id: UUID - Unique link identifier
- short_code: string - URL slug (e.g., "abc123")
- original_url: string - Target URL
- workspace_id: UUID | null - Associated workspace
- user_id: UUID - Creator user ID
- title: string | null - Optional link title
- description: string | null - Optional description
- utm_source: string | null - Campaign source
- utm_medium: string | null - Campaign medium
- utm_campaign: string | null - Campaign name
- is_active: boolean - Enable/disable link
- expires_at: timestamp | null - Optional expiration
- created_at: timestamp - Creation date

#### TypeScript Interface

```typescript
interface Link {
  id: string;
  short_code: string;
  original_url: string;
  workspace_id: string | null;
  user_id: string;
  title: string | null;
  description: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  is_active: boolean;
  expires_at: Date | null;
  created_at: Date;
}
```

#### Relationships

- Belongs to User (creator)
- Belongs to Workspace (optional)
- Has many ClickEvents
- Has many LinkTags

### ClickEvent

**Purpose:** Individual click/visit tracking for analytics

**Key Attributes:**

- id: UUID - Event identifier
- link_id: UUID - Associated link
- visitor_id: string - Anonymous visitor hash
- ip_hash: string - Hashed IP for privacy
- country: string | null - Geo location country
- city: string | null - Geo location city
- device_type: enum - Device category
- browser: string | null - Browser name
- os: string | null - Operating system
- referrer: string | null - Traffic source
- created_at: timestamp - Click timestamp

#### TypeScript Interface

```typescript
interface ClickEvent {
  id: string;
  link_id: string;
  visitor_id: string;
  ip_hash: string;
  country: string | null;
  city: string | null;
  device_type: "desktop" | "mobile" | "tablet" | "other";
  browser: string | null;
  os: string | null;
  referrer: string | null;
  created_at: Date;
}
```

#### Relationships

- Belongs to Link

### Tag

**Purpose:** Organizational labels for links within workspaces

**Key Attributes:**

- id: UUID - Tag identifier
- workspace_id: UUID - Owning workspace
- name: string - Tag name
- color: string - Hex color code
- created_at: timestamp - Creation date

#### TypeScript Interface

```typescript
interface Tag {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: Date;
}
```

#### Relationships

- Belongs to Workspace
- Has many LinkTags

### WorkspaceMembership

**Purpose:** User membership and permissions in workspaces

**Key Attributes:**

- id: UUID - Membership identifier
- workspace_id: UUID - Associated workspace
- user_id: UUID - Member user ID
- role: enum - Permission level
- joined_at: timestamp - Membership date

#### TypeScript Interface

```typescript
interface WorkspaceMembership {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  joined_at: Date;
}
```

#### Relationships

- Belongs to User
- Belongs to Workspace

## API Specification

### REST API Specification (Public API)

```yaml
openapi: 3.0.0
info:
  title: Isla App Public API
  version: 1.0.0
  description: Public API for link management and analytics
servers:
  - url: https://api.isla.app/v1
    description: Production API
  - url: https://staging-api.isla.app/v1
    description: Staging API

paths:
  /links:
    post:
      summary: Create a shortened link
      tags: [Links]
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [original_url]
              properties:
                original_url:
                  type: string
                  format: uri
                short_code:
                  type: string
                  pattern: "^[a-zA-Z0-9-_]{3,20}$"
                title:
                  type: string
                  maxLength: 255
                utm_source:
                  type: string
                utm_medium:
                  type: string
                utm_campaign:
                  type: string
      responses:
        201:
          description: Link created successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Link"

    get:
      summary: List links
      tags: [Links]
      security:
        - ApiKeyAuth: []
      parameters:
        - name: workspace_id
          in: query
          schema:
            type: string
            format: uuid
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        200:
          description: List of links
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/Link"
                  pagination:
                    $ref: "#/components/schemas/Pagination"

  /links/{linkId}/analytics:
    get:
      summary: Get link analytics
      tags: [Analytics]
      security:
        - ApiKeyAuth: []
      parameters:
        - name: linkId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: period
          in: query
          schema:
            type: string
            enum: [24h, 7d, 30d, all]
            default: 7d
      responses:
        200:
          description: Analytics data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Analytics"

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    Link:
      type: object
      properties:
        id:
          type: string
          format: uuid
        short_code:
          type: string
        short_url:
          type: string
          format: uri
        original_url:
          type: string
          format: uri
        title:
          type: string
        clicks:
          type: integer
        created_at:
          type: string
          format: date-time

    Analytics:
      type: object
      properties:
        total_clicks:
          type: integer
        unique_visitors:
          type: integer
        top_referrers:
          type: array
          items:
            type: object
            properties:
              source:
                type: string
              count:
                type: integer
        devices:
          type: object
          properties:
            desktop:
              type: integer
            mobile:
              type: integer
            tablet:
              type: integer
        locations:
          type: array
          items:
            type: object
            properties:
              country:
                type: string
              count:
                type: integer

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer
```

### tRPC Router Definitions (Internal API)

```typescript
// packages/api/src/routers/index.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const appRouter = createTRPCRouter({
  // Auth procedures
  auth: createTRPCRouter({
    getSession: publicProcedure.query(({ ctx }) => {
      return ctx.session;
    }),
    signOut: protectedProcedure.mutation(async ({ ctx }) => {
      await ctx.supabase.auth.signOut();
    }),
  }),

  // Link management
  links: createTRPCRouter({
    create: protectedProcedure
      .input(
        z.object({
          originalUrl: z.string().url(),
          shortCode: z.string().optional(),
          title: z.string().optional(),
          workspaceId: z.string().uuid().optional(),
          utm: z
            .object({
              source: z.string().optional(),
              medium: z.string().optional(),
              campaign: z.string().optional(),
            })
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Implementation with Prisma
        return ctx.prisma.link.create({
          data: input,
        });
      }),

    list: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid().optional(),
          page: z.number().default(1),
          limit: z.number().max(100).default(20),
          search: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return ctx.prisma.link.findMany({
          where: { workspaceId: input.workspaceId },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          title: z.string().optional(),
          originalUrl: z.string().url().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.link.update({
          where: { id: input.id },
          data: input,
        });
      }),

    delete: protectedProcedure.input(z.string().uuid()).mutation(async ({ ctx, input }) => {
      return ctx.prisma.link.delete({
        where: { id: input },
      });
    }),

    bulkUpload: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          links: z
            .array(
              z.object({
                originalUrl: z.string().url(),
                shortCode: z.string().optional(),
                title: z.string().optional(),
              })
            )
            .max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.link.createMany({
          data: input.links,
        });
      }),
  }),

  // Analytics
  analytics: createTRPCRouter({
    getLinkStats: protectedProcedure
      .input(
        z.object({
          linkId: z.string().uuid(),
          period: z.enum(["24h", "7d", "30d", "all"]).default("7d"),
        })
      )
      .query(async ({ ctx, input }) => {
        return ctx.prisma.clickEvent.groupBy({
          by: ["device_type", "country"],
          where: { linkId: input.linkId },
          _count: true,
        });
      }),

    getWorkspaceStats: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          period: z.enum(["24h", "7d", "30d", "all"]).default("7d"),
        })
      )
      .query(async ({ ctx, input }) => {
        // Complex aggregation query with Prisma
        return ctx.prisma.$queryRaw`
          SELECT ... workspace analytics query
        `;
      }),

    // Real-time subscription for live analytics
    subscribeLinkStats: protectedProcedure
      .input(z.string().uuid())
      .subscription(({ ctx, input }) => {
        return ctx.realtime.subscribeToLink(input);
      }),
  }),

  // Workspace management
  workspaces: createTRPCRouter({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          slug: z.string().regex(/^[a-z0-9-]+$/),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.workspace.create({
          data: input,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return ctx.prisma.workspace.findMany({
        where: {
          members: {
            some: { userId: ctx.session.user.id },
          },
        },
      });
    }),

    invite: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          email: z.string().email(),
          role: z.enum(["admin", "member", "viewer"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.workspaceMembership.create({
          data: {
            workspaceId: input.workspaceId,
            userEmail: input.email,
            role: input.role,
          },
        });
      }),
  }),

  // Billing
  billing: createTRPCRouter({
    createCheckoutSession: protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          plan: z.enum(["pro", "enterprise"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.stripe.createCheckoutSession(input);
      }),

    getSubscription: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
      return ctx.stripe.getSubscription(input);
    }),
  }),
});

export type AppRouter = typeof appRouter;
```

## Components

### Web Application (Next.js)

**Responsibility:** Primary user interface for link management, analytics, and administration

**Key Interfaces:**

- Server-side rendered pages via App Router
- Client-side tRPC hooks for data fetching
- WebSocket connection for real-time analytics
- Stripe checkout integration

**Dependencies:** Supabase Auth, tRPC API, Vercel KV, Stripe SDK

**Technology Stack:** Next.js 14 App Router, React Server Components, Tailwind CSS, shadcn/ui, Zustand

### Edge Redirect Service

**Responsibility:** High-performance link resolution and click tracking at edge locations

**Key Interfaces:**

- GET /:shortCode - Resolve and redirect
- Async click event publishing
- Cache warming/invalidation

**Dependencies:** Vercel KV (Redis), Supabase (fallback), Analytics Queue

**Technology Stack:** Vercel Edge Functions, Edge Runtime API, Vercel KV

### API Layer (tRPC + REST)

**Responsibility:** Business logic orchestration and data validation

**Key Interfaces:**

- tRPC procedures for internal operations
- REST endpoints for public API
- WebSocket subscriptions for real-time updates

**Dependencies:** Prisma Client, Supabase Auth, Stripe API, Resend Email

**Technology Stack:** Next.js API Routes, tRPC v10, Zod validation

### Analytics Engine

**Responsibility:** Process and aggregate click events for reporting

**Key Interfaces:**

- Click event ingestion queue
- Real-time aggregation pipeline
- Materialized view updates

**Dependencies:** PostgreSQL, Supabase Realtime

**Technology Stack:** PostgreSQL functions, Supabase Edge Functions, TimescaleDB extensions

### Chrome Extension

**Responsibility:** Browser-based quick link creation and management with Dub.co-style instant feedback

**Key Interfaces:**

- Chrome Extension API (manifest v3)
- REST API communication with optimistic updates
- OAuth token exchange
- One-click link creation from context menu
- Instant copy-to-clipboard with toast notification

**Dependencies:** Public REST API, Chrome Storage API, Framer Motion

**Technology Stack:** TypeScript, Chrome Extension APIs, Shared UI components, Framer Motion

**UX Features:**

- Floating action button for quick access
- Keyboard shortcut (Cmd/Ctrl+Shift+L) for instant creation
- Smart URL detection from current tab
- Inline slug editing in popup
- Success animation with confetti effect
- Recent links history with search

### Database Layer (Supabase)

**Responsibility:** Data persistence, RLS enforcement, and real-time subscriptions

**Key Interfaces:**

- PostgreSQL with Row Level Security
- Realtime broadcast channels
- Storage buckets for uploads

**Dependencies:** None (foundational layer)

**Technology Stack:** PostgreSQL 15+, PostGIS, pg_cron, Supabase Realtime

### Authentication Service

**Responsibility:** User authentication, session management, and authorization

**Key Interfaces:**

- Magic link email flow
- Google OAuth integration
- JWT token validation
- Session refresh

**Dependencies:** Supabase Auth, Resend (email)

**Technology Stack:** Supabase Auth, Next.js middleware, JWT

### Billing Service

**Responsibility:** Subscription management and payment processing

**Key Interfaces:**

- Stripe checkout sessions
- Webhook event processing
- Subscription status sync

**Dependencies:** Stripe API, Database Layer

**Technology Stack:** Stripe SDK, Next.js API Routes, Webhook handlers

### Component Diagrams

```mermaid
C4Context
    title System Context Diagram - Isla App

    Person(user, "Marketing Team Member", "Creates and manages shortened links")
    Person(visitor, "Link Visitor", "Clicks on shortened links")

    System_Boundary(isla, "Isla App Platform") {
        System(web, "Web Application", "Next.js, React")
        System(api, "API Layer", "tRPC + REST")
        System(edge, "Edge Services", "Vercel Edge")
        System(db, "Database", "Supabase PostgreSQL")
    }

    System_Ext(stripe, "Stripe", "Payment processing")
    System_Ext(resend, "Resend", "Email delivery")
    System_Ext(chrome, "Chrome Web Store", "Extension distribution")

    Rel(user, web, "Uses", "HTTPS")
    Rel(visitor, edge, "Redirected by", "HTTPS")
    Rel(user, chrome, "Installs extension")

    Rel(web, api, "Calls", "tRPC/REST")
    Rel(api, db, "Queries", "PostgreSQL")
    Rel(edge, db, "Reads", "Cached + Direct")
    Rel(api, stripe, "Processes payments")
    Rel(api, resend, "Sends emails")
```

```mermaid
C4Container
    title Container Diagram - Core Application Flow

    Person(user, "User")

    Container_Boundary(frontend, "Frontend") {
        Container(nextjs, "Next.js App", "TypeScript, React", "Server-rendered UI")
        Container(extension, "Chrome Extension", "TypeScript", "Browser integration")
    }

    Container_Boundary(backend, "Backend Services") {
        Container(api_routes, "API Routes", "Next.js", "Business logic")
        Container(edge_fn, "Edge Functions", "Edge Runtime", "Link redirects")
        Container(trpc, "tRPC Router", "TypeScript", "Type-safe API")
    }

    Container_Boundary(data, "Data Layer") {
        ContainerDb(postgres, "PostgreSQL", "Supabase", "Application data")
        ContainerDb(redis, "Redis Cache", "Vercel KV", "Hot links")
        ContainerDb(storage, "Object Storage", "Supabase", "File uploads")
    }

    Rel(user, nextjs, "Uses")
    Rel(user, extension, "Uses")
    Rel(nextjs, trpc, "Calls", "Type-safe procedures")
    Rel(extension, api_routes, "Calls", "REST API")
    Rel(edge_fn, redis, "Reads", "Cache lookup")
    Rel(edge_fn, postgres, "Falls back", "Cache miss")
    Rel(api_routes, postgres, "CRUD operations")
    Rel(trpc, postgres, "Queries")
```

## External APIs

### Stripe API

- **Purpose:** Payment processing, subscription management, and billing
- **Documentation:** https://stripe.com/docs/api
- **Base URL(s):** https://api.stripe.com
- **Authentication:** Bearer token (Secret key for server, Publishable key for client)
- **Rate Limits:** 100 requests/second in live mode, 25 requests/second in test mode

**Key Endpoints Used:**

- `POST /v1/checkout/sessions` - Create checkout session for subscription
- `POST /v1/customers` - Create customer records
- `GET /v1/subscriptions/{id}` - Retrieve subscription status
- `POST /v1/billing_portal/sessions` - Create customer portal session
- `POST /v1/webhooks/endpoints` - Register webhook endpoints

**Integration Notes:** Webhook events must be verified using Stripe signature. Store customer_id and subscription_id in database for reference. Use idempotency keys for critical operations.

### Resend API

- **Purpose:** Transactional email delivery for auth and notifications
- **Documentation:** https://resend.com/docs
- **Base URL(s):** https://api.resend.com
- **Authentication:** Bearer token (API key)
- **Rate Limits:** 10 emails/second, 3000 emails/hour

**Key Endpoints Used:**

- `POST /emails` - Send transactional emails
- `POST /emails/batch` - Send batch emails for workspace invites
- `GET /emails/{id}` - Check email delivery status

**Integration Notes:** Use React Email templates for consistent styling. Configure domain authentication for better deliverability. Implement retry logic for failed sends.

### Supabase Management API

- **Purpose:** Project configuration and admin operations
- **Documentation:** https://supabase.com/docs/reference/management-api
- **Base URL(s):** https://api.supabase.com
- **Authentication:** Bearer token (Service role key)
- **Rate Limits:** Varies by endpoint, generally 100 requests/minute

**Key Endpoints Used:**

- `GET /v1/projects/{ref}/database/migrations` - Check migration status
- `POST /v1/projects/{ref}/database/query` - Execute admin queries
- `GET /v1/projects/{ref}/config` - Retrieve project configuration

**Integration Notes:** Only use service role key in secure server environments. Never expose to client-side code. Use for automated migrations and admin tasks only.

### Google OAuth API

- **Purpose:** Social authentication for user sign-in
- **Documentation:** https://developers.google.com/identity/protocols/oauth2
- **Base URL(s):** https://accounts.google.com/o/oauth2
- **Authentication:** OAuth 2.0 flow with client ID and secret
- **Rate Limits:** 20,000,000 requests/day

**Key Endpoints Used:**

- `GET /auth` - Initiate OAuth flow
- `POST /token` - Exchange authorization code for tokens
- `GET /userinfo` - Retrieve user profile information

**Integration Notes:** Handled through Supabase Auth provider configuration. Configure authorized redirect URIs in Google Console. Enable necessary scopes (email, profile).

### Vercel Analytics API

- **Purpose:** Performance monitoring and usage analytics
- **Documentation:** https://vercel.com/docs/rest-api
- **Base URL(s):** https://api.vercel.com
- **Authentication:** Bearer token (Integration token)
- **Rate Limits:** 60 requests/minute

**Key Endpoints Used:**

- `GET /v1/analytics/vitals` - Retrieve Core Web Vitals
- `GET /v1/analytics/insights` - Get page view analytics
- `POST /v1/analytics/events` - Log custom events

**Integration Notes:** Automatically integrated with Vercel deployment. Use @vercel/analytics package for client-side tracking. Configure custom events for link creation metrics.

### IP Geolocation API (Vercel Edge)

- **Purpose:** Geographic data for click analytics
- **Documentation:** Built into Vercel Edge Functions
- **Base URL(s):** N/A (Edge runtime built-in)
- **Authentication:** Automatic with Edge Functions
- **Rate Limits:** Unlimited within Edge Functions

**Key Endpoints Used:**

- Edge request headers provide: `x-vercel-ip-country`, `x-vercel-ip-city`

**Integration Notes:** Available automatically in Edge Functions. No external API calls needed. Falls back to IP database if headers unavailable.

## Core Workflows

### User Registration and Onboarding

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant API as API Layer
    participant Auth as Supabase Auth
    participant Email as Resend
    participant DB as Database

    U->>W: Click "Sign Up"
    W->>Auth: Request magic link
    Auth->>Email: Send magic link email
    Email-->>U: Receive email
    U->>Auth: Click magic link
    Auth->>API: Validate token
    API->>DB: Create user record (Prisma)
    API->>DB: Create default workspace
    API->>W: Return session + workspace
    W->>U: Show onboarding
    U->>W: Complete onboarding
    W->>API: Update user profile
    API->>DB: Save preferences
    W->>U: Redirect to dashboard
```

### Link Creation and Shortening

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant API as tRPC API
    participant DB as Database (Prisma)
    participant Cache as Vercel KV
    participant Queue as Analytics Queue

    U->>W: Enter URL + metadata
    W->>W: Client-side validation
    W->>API: trpc.links.create()
    API->>API: Validate URL
    API->>API: Generate short code
    API->>DB: Check uniqueness
    alt Short code exists
        API->>API: Generate new code
    end
    API->>DB: Insert link record
    API->>Cache: Warm cache with link
    API->>Queue: Queue analytics event
    API-->>W: Return link object
    W->>W: Optimistic UI update
    W->>U: Show success + short URL
```

### Link Redirect Flow

```mermaid
sequenceDiagram
    participant V as Visitor
    participant Edge as Edge Function
    participant Cache as Vercel KV
    participant DB as Database
    participant Queue as Analytics Queue
    participant Target as Target URL

    V->>Edge: GET /abc123
    Edge->>Edge: Extract geo data
    Edge->>Cache: Lookup short code
    alt Cache hit
        Cache-->>Edge: Return target URL
    else Cache miss
        Edge->>DB: Query link
        DB-->>Edge: Return target URL
        Edge->>Cache: Update cache
    end
    Edge->>Queue: Async click event
    Note over Queue: Device, geo, referrer data
    Edge->>V: 301 Redirect
    V->>Target: Follow redirect

    Note over Queue,DB: Async processing
    Queue->>DB: Batch insert events
    DB->>DB: Update aggregates
```

### Real-time Analytics Update (Dub.co Style)

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web Dashboard
    participant API as tRPC API
    participant RT as Supabase Realtime
    participant DB as Database
    participant Queue as Analytics Queue

    U->>W: View link analytics
    W->>API: trpc.analytics.subscribeLinkStats()
    API->>RT: Subscribe to link channel
    RT-->>W: Establish WebSocket

    Note over Queue: Click event occurs
    Queue->>DB: Insert click event
    DB->>RT: Broadcast update
    RT-->>W: Push update
    W->>W: Update chart/counter
    W->>U: Show real-time data

    U->>W: Change time period
    W->>API: trpc.analytics.getLinkStats()
    API->>DB: Query aggregated data
    DB-->>API: Return stats
    API-->>W: Return formatted data
    W->>U: Update visualization
```

### Chrome Extension Authentication

```mermaid
sequenceDiagram
    participant E as Extension
    participant B as Browser
    participant W as Web App
    participant API as REST API
    participant Auth as Supabase Auth
    participant Store as Chrome Storage

    E->>B: User clicks login
    B->>W: Open auth page
    W->>Auth: Initiate OAuth flow
    Auth->>W: Return with token
    W->>W: Generate extension token
    W->>B: postMessage(token)
    B->>E: Receive message
    E->>Store: Save token

    Note over E: Later API calls
    E->>API: POST /api/links
    Note right of API: Header: X-API-Key
    API->>Auth: Validate token
    Auth-->>API: User context
    API->>API: Create link
    API-->>E: Return short URL
    E->>B: Copy to clipboard
```

### Subscription Upgrade Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant API as tRPC API
    participant Stripe as Stripe
    participant DB as Database
    participant Webhook as Webhook Handler

    U->>W: Click "Upgrade to Pro"
    W->>API: trpc.billing.createCheckoutSession()
    API->>Stripe: Create checkout session
    Stripe-->>API: Return session URL
    API-->>W: Return checkout URL
    W->>Stripe: Redirect to checkout
    U->>Stripe: Complete payment
    Stripe->>Webhook: Send webhook event
    Webhook->>Webhook: Verify signature
    Webhook->>DB: Update workspace plan
    Webhook->>DB: Store subscription ID
    Webhook-->>Stripe: Acknowledge

    Note over W: Polling or redirect
    W->>API: Check subscription status
    API->>DB: Query workspace
    DB-->>API: Return updated plan
    API-->>W: Confirm upgrade
    W->>U: Show success + features
```

## Database Schema

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- Users table (managed by Supabase Auth)
-- We reference auth.users for user data

-- Workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    monthly_click_limit INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);

-- Workspace memberships
CREATE TABLE workspace_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_memberships_workspace_id ON workspace_memberships(workspace_id);
CREATE INDEX idx_memberships_user_id ON workspace_memberships(user_id);

-- Links table
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    short_code VARCHAR(20) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    password_hash VARCHAR(255),
    max_clicks INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- High-performance indexes for link lookups
CREATE UNIQUE INDEX idx_links_short_code ON links(short_code) WHERE is_active = true;
CREATE INDEX idx_links_workspace_id ON links(workspace_id, created_at DESC);
CREATE INDEX idx_links_user_id ON links(user_id, created_at DESC);
CREATE INDEX idx_links_search ON links USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, name)
);

CREATE INDEX idx_tags_workspace_id ON tags(workspace_id);

-- Link tags junction table
CREATE TABLE link_tags (
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (link_id, tag_id)
);

CREATE INDEX idx_link_tags_tag_id ON link_tags(tag_id);

-- Click events table (partitioned by month for performance)
CREATE TABLE click_events (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    visitor_id VARCHAR(64) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    country VARCHAR(2),
    city VARCHAR(100),
    region VARCHAR(100),
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'bot', 'other')),
    browser VARCHAR(50),
    browser_version VARCHAR(20),
    os VARCHAR(50),
    os_version VARCHAR(20),
    referrer TEXT,
    referrer_domain VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for the next 12 months
CREATE TABLE click_events_2025_01 PARTITION OF click_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE click_events_2025_02 PARTITION OF click_events
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- ... (continue for all months)

-- Indexes for analytics queries
CREATE INDEX idx_click_events_link_created ON click_events(link_id, created_at DESC);
CREATE INDEX idx_click_events_visitor ON click_events(visitor_id, created_at DESC);
CREATE INDEX idx_click_events_country ON click_events(country) WHERE country IS NOT NULL;

-- Materialized view for link statistics (refreshed every 5 minutes)
CREATE MATERIALIZED VIEW link_stats AS
SELECT
    l.id as link_id,
    l.workspace_id,
    COUNT(DISTINCT ce.visitor_id) as unique_visitors,
    COUNT(ce.id) as total_clicks,
    COUNT(DISTINCT ce.country) as countries_count,
    COUNT(DISTINCT ce.referrer_domain) as referrer_count,
    MAX(ce.created_at) as last_clicked_at,
    NOW() as computed_at
FROM links l
LEFT JOIN click_events ce ON l.id = ce.link_id
GROUP BY l.id, l.workspace_id;

CREATE UNIQUE INDEX ON link_stats(link_id);
CREATE INDEX ON link_stats(workspace_id);

-- Row Level Security Policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- Workspace access policy
CREATE POLICY workspace_access ON workspaces
    FOR ALL USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_id = workspaces.id
            AND user_id = auth.uid()
        )
    );

-- Links access policy
CREATE POLICY links_access ON links
    FOR ALL USING (
        user_id = auth.uid() OR
        (workspace_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_id = links.workspace_id
            AND user_id = auth.uid()
        ))
    );

-- Click events read-only for link owners
CREATE POLICY click_events_read ON click_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM links
            WHERE links.id = click_events.link_id
            AND (
                links.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM workspace_memberships
                    WHERE workspace_id = links.workspace_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

-- Functions for analytics
CREATE OR REPLACE FUNCTION refresh_link_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY link_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 5 minutes using pg_cron
SELECT cron.schedule('refresh-link-stats', '*/5 * * * *', 'SELECT refresh_link_stats();');
```

## UX Patterns and UI Components

### Dub.co-Inspired UX Patterns

#### Link Creation Flow

- **Smart URL Detection:** Auto-detect and validate URLs as user types
- **Inline Slug Editing:** Edit short code directly in the creation form
- **Instant Visual Feedback:** Show link preview in real-time
- **One-Click Creation:** Single action to create and copy link
- **Smooth Animations:** Framer Motion for all state transitions

#### Animation Specifications

```typescript
// lib/animations.ts
export const animations = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2 },
  },

  // Card animations
  cardHover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },

  // List item stagger
  listStagger: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },

  // Analytics chart entrance
  chartEntrance: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
};
```

#### Key UI Components

##### LinkCreationModal

```typescript
// components/features/links/LinkCreationModal.tsx
interface LinkCreationModalProps {
  onSuccess: (link: Link) => void;
}

// Features:
// - URL validation with debounce
// - Custom slug availability check
// - UTM builder with presets
// - QR code preview
// - Social media preview cards
```

##### AnalyticsDashboard

```typescript
// components/features/analytics/AnalyticsDashboard.tsx
// Features:
// - Time series chart with hover details
// - Real-time click counter with animation
// - Geographic heat map
// - Device/browser breakdown
// - Referrer sources table
// - Time period selector (24h, 7d, 30d, custom)
```

##### LinkCard

```typescript
// components/features/links/LinkCard.tsx
// Features:
// - Hover state with action buttons
// - Click to copy functionality
// - Inline editing capability
// - Live click counter
// - Status indicators (active, expired, password-protected)
```

#### UI Component Library Extensions

```typescript
// packages/ui/src/components/
├── AnimatedCounter/        # Smooth number transitions
├── AreaChart/             # Time series visualization
├── CopyButton/            # Click-to-copy with feedback
├── InlineEdit/            # Edit-in-place functionality
├── SlugInput/             # Smart slug field with validation
├── URLInput/              # URL field with protocol handling
└── Toast/                 # Notification system
```

## Frontend Architecture

### Component Architecture

#### Component Organization

```
apps/web/src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth group routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── layout.tsx       # Dashboard layout with sidebar
│   │   ├── page.tsx         # Dashboard home
│   │   ├── links/
│   │   ├── analytics/
│   │   └── settings/
│   ├── api/                 # API route handlers
│   │   └── trpc/
│   ├── layout.tsx           # Root layout
│   └── globals.css
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── features/            # Feature-specific components
│   │   ├── links/
│   │   ├── analytics/
│   │   └── workspace/
│   └── shared/              # Shared components
├── lib/                     # Utilities and configs
│   ├── trpc.ts
│   ├── supabase.ts
│   └── utils.ts
├── hooks/                   # Custom React hooks
└── stores/                  # Zustand stores
```

#### Component Template

```typescript
// components/features/links/LinkCard.tsx
import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Link } from '@/packages/database/types';

interface LinkCardProps {
  link: Link;
  onEdit?: (link: Link) => void;
  onDelete?: (id: string) => void;
}

export const LinkCard = memo<LinkCardProps>(({ link, onEdit, onDelete }) => {
  return (
    <Card className="p-4">
      {/* Component implementation */}
    </Card>
  );
});

LinkCard.displayName = 'LinkCard';
```

### State Management Architecture

#### State Structure

```typescript
// stores/index.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AppState {
  // Workspace state
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];

  // UI state
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";

  // Actions
  setCurrentWorkspace: (workspace: Workspace) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        currentWorkspace: null,
        workspaces: [],
        sidebarOpen: true,
        theme: "system",

        setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      }),
      { name: "app-store" }
    )
  )
);
```

#### State Management Patterns

- Server state managed by tRPC + React Query
- Client state managed by Zustand for UI preferences
- Form state managed by react-hook-form
- Optimistic updates for better perceived performance

### Routing Architecture

#### Route Organization

```
app/
├── (auth)/                  # Public auth routes
│   ├── login/
│   ├── register/
│   └── layout.tsx          # Minimal auth layout
├── (dashboard)/            # Protected routes
│   ├── layout.tsx          # Dashboard shell
│   ├── page.tsx            # /dashboard
│   ├── links/
│   │   ├── page.tsx        # /dashboard/links
│   │   ├── [id]/
│   │   │   └── page.tsx    # /dashboard/links/[id]
│   │   └── new/
│   │       └── page.tsx    # /dashboard/links/new
│   └── analytics/
│       └── page.tsx        # /dashboard/analytics
├── [shortCode]/            # Public redirect route
│   └── route.ts            # Edge function handler
└── api/
    ├── trpc/[trpc]/
    └── webhooks/stripe/
```

#### Protected Route Pattern

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

### Frontend Services Layer

#### API Client Setup

```typescript
// lib/trpc.ts
import { createTRPCNext } from "@trpc/next";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createClient } from "@/lib/supabase/client";
import type { AppRouter } from "@/packages/api";

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: "/api/trpc",
          async headers() {
            const supabase = createClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();
            return {
              authorization: session?.access_token ? `Bearer ${session.access_token}` : undefined,
            };
          },
        }),
      ],
    };
  },
  ssr: false,
});
```

#### Service Example

```typescript
// services/links.ts
import { trpc } from "@/lib/trpc";
import { useAppStore } from "@/stores";

export const useLinkService = () => {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);

  const createLink = trpc.links.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      utils.links.list.invalidate();
    },
  });

  const links = trpc.links.list.useQuery(
    { workspaceId: currentWorkspace?.id },
    { enabled: !!currentWorkspace }
  );

  return {
    links: links.data,
    isLoading: links.isLoading,
    createLink: createLink.mutate,
  };
};
```

## Backend Architecture

### Service Architecture

#### Serverless Architecture

##### Function Organization

```
packages/api/src/
├── routers/              # tRPC routers
│   ├── auth.ts
│   ├── links.ts
│   ├── analytics.ts
│   ├── workspaces.ts
│   └── billing.ts
├── services/             # Business logic
│   ├── link-shortener/
│   ├── analytics-engine/
│   └── subscription-manager/
├── middleware/           # API middleware
│   ├── auth.ts
│   ├── rate-limit.ts
│   └── workspace-context.ts
└── lib/                  # Shared utilities
    ├── prisma.ts
    ├── redis.ts
    └── errors.ts

apps/web/app/api/
├── trpc/[trpc]/route.ts    # tRPC handler
├── webhooks/
│   └── stripe/route.ts     # Stripe webhooks
└── edge/
    └── redirect/route.ts    # Edge redirect handler
```

##### Function Template

```typescript
// app/api/edge/redirect/route.ts
import { NextRequest } from "next/server";
import { redis } from "@/lib/redis";
import { prisma } from "@/packages/database";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  const shortCode = params.shortCode;

  // Try cache first
  const cached = await redis.get(`link:${shortCode}`);
  if (cached) {
    // Async analytics tracking
    await trackClick(request, cached);
    return Response.redirect(cached.url);
  }

  // Fallback to database
  const link = await prisma.link.findUnique({
    where: { short_code: shortCode, is_active: true },
  });

  if (!link) {
    return new Response("Not found", { status: 404 });
  }

  // Warm cache
  await redis.setex(`link:${shortCode}`, 3600, {
    url: link.original_url,
    id: link.id,
  });

  await trackClick(request, link);
  return Response.redirect(link.original_url);
}
```

### Database Architecture

#### Schema Design

```prisma
// packages/database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "auth"]
}

model User {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email             String   @unique
  name              String?
  avatar_url        String?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  workspaces        WorkspaceMembership[]
  links             Link[]

  @@schema("auth")
}

model Workspace {
  id                   String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                 String   @db.VarChar(100)
  slug                 String   @unique @db.VarChar(50)
  owner_id             String   @db.Uuid
  plan                 Plan     @default(FREE)
  stripe_customer_id   String?  @db.VarChar(255)
  stripe_subscription_id String? @db.VarChar(255)
  monthly_click_limit  Int      @default(1000)
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt

  members              WorkspaceMembership[]
  links                Link[]
  tags                 Tag[]

  @@index([owner_id])
  @@index([slug])
  @@schema("public")
}

model Link {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  short_code    String    @unique @db.VarChar(20)
  original_url  String    @db.Text
  workspace_id  String?   @db.Uuid
  user_id       String    @db.Uuid
  title         String?   @db.VarChar(255)
  description   String?   @db.Text
  utm_source    String?   @db.VarChar(100)
  utm_medium    String?   @db.VarChar(100)
  utm_campaign  String?   @db.VarChar(100)
  is_active     Boolean   @default(true)
  expires_at    DateTime?
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  workspace     Workspace? @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  user          User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  clicks        ClickEvent[]
  tags          LinkTag[]

  @@index([short_code, is_active])
  @@index([workspace_id, created_at(sort: Desc)])
  @@index([user_id, created_at(sort: Desc)])
  @@schema("public")
}

enum Plan {
  FREE
  PRO
  ENTERPRISE

  @@schema("public")
}

enum Role {
  OWNER
  ADMIN
  MEMBER
  VIEWER

  @@schema("public")
}
```

#### Data Access Layer

```typescript
// packages/api/src/services/link-service.ts
import { prisma } from "@/packages/database";
import { redis } from "@/lib/redis";
import { TRPCError } from "@trpc/server";

export class LinkService {
  async createLink(input: CreateLinkInput, userId: string) {
    // Generate unique short code
    const shortCode = input.shortCode || (await this.generateShortCode());

    // Check uniqueness
    const existing = await prisma.link.findUnique({
      where: { short_code: shortCode },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Short code already exists",
      });
    }

    // Create link with transaction
    const link = await prisma.$transaction(async (tx) => {
      const newLink = await tx.link.create({
        data: {
          short_code: shortCode,
          original_url: input.originalUrl,
          user_id: userId,
          workspace_id: input.workspaceId,
          title: input.title,
          utm_source: input.utm?.source,
          utm_medium: input.utm?.medium,
          utm_campaign: input.utm?.campaign,
        },
      });

      // Warm cache
      await redis.setex(`link:${shortCode}`, 3600, { url: newLink.original_url, id: newLink.id });

      return newLink;
    });

    return link;
  }

  private async generateShortCode(): Promise<string> {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
```

### Authentication and Authorization

#### Auth Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant S as Supabase Auth
    participant P as Prisma
    participant H as Handler

    C->>M: Request with JWT
    M->>S: Verify token
    S-->>M: User session
    M->>P: Get user + workspace
    P-->>M: User context
    M->>H: Enriched context
    H->>H: Execute business logic
    H-->>C: Response
```

#### Middleware/Guards

```typescript
// packages/api/src/middleware/auth.ts
import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";

export const authMiddleware = async (opts: MiddlewareOpts) => {
  const { ctx, next } = opts;

  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  // Enrich context with user data
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    include: {
      workspaces: {
        include: {
          workspace: true,
        },
      },
    },
  });

  return next({
    ctx: {
      ...ctx,
      user,
      workspaces: user?.workspaces.map((m) => m.workspace) || [],
    },
  });
};

// Workspace access guard
export const workspaceGuard = (requiredRole: Role = "MEMBER") => {
  return async (opts: MiddlewareOpts) => {
    const { ctx, input, next } = opts;

    const workspaceId = input?.workspaceId;
    if (!workspaceId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Workspace ID required",
      });
    }

    const membership = await ctx.prisma.workspaceMembership.findFirst({
      where: {
        workspace_id: workspaceId,
        user_id: ctx.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not a workspace member",
      });
    }

    // Check role hierarchy
    const roleHierarchy = ["VIEWER", "MEMBER", "ADMIN", "OWNER"];
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    const userLevel = roleHierarchy.indexOf(membership.role);

    if (userLevel < requiredLevel) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires ${requiredRole} role`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        workspace: { id: workspaceId, role: membership.role },
      },
    });
  };
};
```

## Unified Project Structure

````
isla-app/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── apps/                       # Application packages
│   ├── web/                    # Frontend application
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router
│   │   │   ├── components/     # UI components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API client services
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── lib/            # Utilities
│   │   ├── public/             # Static assets
│   │   ├── tests/              # Frontend tests
│   │   └── package.json
│   └── extension/              # Chrome extension
│       ├── src/
│       ├── manifest.json
│       └── package.json
├── packages/                   # Shared packages
│   ├── api/                    # tRPC API
│   │   ├── src/
│   │   │   ├── routers/        # API endpoints
│   │   │   ├── services/       # Business logic
│   │   │   └── middleware/     # Auth & validation
│   │   └── package.json
│   ├── database/               # Prisma schema
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── package.json
│   ├── shared/                 # Shared types/utils
│   │   ├── src/
│   │   │   ├── types/          # TypeScript types
│   │   │   └── constants/      # Shared constants
│   │   └── package.json
│   └── ui/                     # Shared UI components
│       ├── src/
│       └── package.json
├── infrastructure/             # IaC definitions
│   └── terraform/
├── scripts/                    # Build/deploy scripts
├── docs/                       # Documentation
│   ├── architecture.md
│   └── prd/
├── .env.example                # Environment template
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm workspace config
├── turbo.json                  # Turborepo config
└── README.md

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# Required tools
node --version  # v20+
pnpm --version  # v8+
docker --version  # For local Supabase

# Install pnpm if needed
npm install -g pnpm
````

#### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/isla-app.git
cd isla-app

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Start Supabase locally
pnpm supabase start

# Run database migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm prisma db seed

# Start development server
pnpm dev
```

#### Development Commands

```bash
# Start all services
pnpm dev

# Start frontend only
pnpm dev --filter=web

# Start backend only
pnpm dev --filter=api

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build for production
pnpm build
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend (.env)
DATABASE_URL=postgresql://postgres:password@localhost:5432/isla
DIRECT_URL=postgresql://postgres:password@localhost:5432/isla
SUPABASE_SERVICE_ROLE_KEY=xxx
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
RESEND_API_KEY=re_xxx

# Shared
NODE_ENV=development
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**

- **Platform:** Vercel
- **Build Command:** `pnpm build --filter=web`
- **Output Directory:** `apps/web/.next`
- **CDN/Edge:** Automatic via Vercel

**Backend Deployment:**

- **Platform:** Vercel (API Routes + Edge Functions)
- **Build Command:** Included in frontend build
- **Deployment Method:** Serverless functions

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build

      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

### Environments

| Environment | Frontend URL             | Backend URL                  | Purpose                |
| ----------- | ------------------------ | ---------------------------- | ---------------------- |
| Development | http://localhost:3000    | http://localhost:3000/api    | Local development      |
| Staging     | https://staging.isla.app | https://staging.isla.app/api | Pre-production testing |
| Production  | https://isla.app         | https://isla.app/api         | Live environment       |

## Security and Performance

### Security Requirements

**Frontend Security:**

- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline' *.stripe.com;`
- XSS Prevention: React's automatic escaping + input sanitization
- Secure Storage: httpOnly cookies for auth tokens

**Backend Security:**

- Input Validation: Zod schemas on all inputs
- Rate Limiting: 100 req/min per user, 1000 req/min per IP
- CORS Policy: Restricted to known domains

**Authentication Security:**

- Token Storage: Secure, httpOnly cookies
- Session Management: 7-day refresh, 1-hour access tokens
- Password Policy: Magic links (no passwords stored)

### Performance Optimization

**Frontend Performance:**

- Bundle Size Target: <100KB initial JS
- Loading Strategy: Code splitting + dynamic imports
- Caching Strategy: ISR for static pages, SWR for data

**Backend Performance:**

- Response Time Target: <200ms p95
- Database Optimization: Connection pooling, indexes, materialized views
- Caching Strategy: Redis for hot links, 5-min TTL

## Testing Strategy

### Testing Pyramid

```
       E2E Tests (Playwright)
      /                      \
    Integration Tests (Vitest)
   /                          \
Frontend Unit Tests    Backend Unit Tests
     (Vitest + RTL)         (Vitest)
```

### Test Organization

#### Frontend Tests

```
apps/web/tests/
├── unit/
│   ├── components/
│   └── hooks/
├── integration/
│   └── features/
└── e2e/
    └── user-flows/
```

#### Backend Tests

```
packages/api/tests/
├── unit/
│   └── services/
├── integration/
│   └── routers/
└── fixtures/
```

### Test Examples

#### Frontend Component Test

```typescript
// tests/unit/components/LinkCard.test.tsx
import { render, screen } from '@testing-library/react';
import { LinkCard } from '@/components/features/links/LinkCard';

describe('LinkCard', () => {
  it('displays link information', () => {
    const link = {
      id: '1',
      short_code: 'abc123',
      original_url: 'https://example.com',
      title: 'Test Link'
    };

    render(<LinkCard link={link} />);

    expect(screen.getByText('Test Link')).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
  });
});
```

#### Backend API Test

```typescript
// tests/integration/routers/links.test.ts
import { createInnerTRPCContext } from "@/lib/trpc";
import { linksRouter } from "@/routers/links";

describe("Links Router", () => {
  it("creates a new link", async () => {
    const ctx = createInnerTRPCContext({
      session: { user: { id: "user1" } },
    });

    const caller = linksRouter.createCaller(ctx);

    const result = await caller.create({
      originalUrl: "https://example.com",
      title: "Test Link",
    });

    expect(result.short_code).toMatch(/^[a-z0-9]{6}$/);
  });
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there
- **API Calls:** Never make direct HTTP calls - use the tRPC service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **Database Access:** All database operations through Prisma, never raw SQL
- **Authentication:** Always verify JWT tokens in middleware, not in handlers
- **Caching:** Use Redis for frequently accessed data, implement cache invalidation

### Naming Conventions

| Element         | Frontend             | Backend         | Example             |
| --------------- | -------------------- | --------------- | ------------------- |
| Components      | PascalCase           | -               | `UserProfile.tsx`   |
| Hooks           | camelCase with 'use' | -               | `useAuth.ts`        |
| API Routes      | -                    | kebab-case      | `/api/user-profile` |
| Database Tables | -                    | snake_case      | `user_profiles`     |
| Env Variables   | SCREAMING_SNAKE      | SCREAMING_SNAKE | `DATABASE_URL`      |

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Layer
    participant S as Service
    participant DB as Database

    C->>API: Request
    API->>S: Process
    S->>DB: Query
    DB-->>S: Error
    S-->>API: Throw TRPCError
    API-->>C: Formatted Error Response
    C->>C: Display User-Friendly Message
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling

```typescript
// lib/error-handler.ts
export const handleApiError = (error: unknown) => {
  if (error instanceof TRPCClientError) {
    toast.error(error.message);

    if (error.data?.code === "UNAUTHORIZED") {
      router.push("/login");
    }
  } else {
    toast.error("Something went wrong");
    console.error(error);
  }
};
```

### Backend Error Handling

```typescript
// middleware/error-handler.ts
export const errorHandler = (error: unknown) => {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new TRPCError({
        code: "CONFLICT",
        message: "Resource already exists",
      });
    }
  }

  // Log unexpected errors
  logger.error(error);

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};
```

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics + Sentry
- **Backend Monitoring:** Axiom + Sentry
- **Error Tracking:** Sentry (both frontend and backend)
- **Performance Monitoring:** Vercel Speed Insights

### Key Metrics

**Frontend Metrics:**

- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors
- API response times
- User interactions

**Backend Metrics:**

- Request rate
- Error rate (4xx, 5xx)
- Response time (p50, p95, p99)
- Database query performance
- Redis hit rate
- Link redirect latency
