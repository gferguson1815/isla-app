# Tech Stack

This is the DEFINITIVE technology selection for the entire project. Work with user to finalize all choices. This table is the single source of truth - all development must use these exact versions across all three environments.

## Technology Stack Table

| Category             | Technology          | Version | Purpose                    | Environment Strategy                              | Rationale                                                            |
| -------------------- | ------------------- | ------- | -------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| Frontend Language    | TypeScript          | 5.3+    | Type-safe development      | All environments                                  | Prevents runtime errors, essential for rapid AI-assisted development |
| Frontend Framework   | Next.js             | 14.2+   | Full-stack React framework | Local → Dev (Vercel) → Prod (Vercel)              | App Router, RSC, built-in optimizations, proven by Dub.co at scale   |
| UI Component Library | shadcn/ui           | latest  | Reusable components        | All environments                                  | Notion-like components, fully customizable, no runtime overhead      |
| State Management     | Zustand             | 4.5+    | Client state management    | All environments                                  | Lightweight (8kb), TypeScript-first, simpler than Redux              |
| Backend Language     | TypeScript          | 5.3+    | Unified language           | All environments                                  | Same language across stack, shared types                             |
| Backend Framework    | Next.js API Routes  | 14.2+   | API endpoints              | All environments                                  | Integrated with frontend, automatic deployments                      |
| API Style            | tRPC                | 10.45+  | Type-safe API layer        | All environments                                  | End-to-end type safety, no API versioning issues                     |
| Database             | Supabase PostgreSQL | 15+     | Primary data store         | Local (Supabase CLI) → Dev (Cloud) → Prod (Cloud) | Built-in RLS, auth, real-time, proven choice for MVP speed           |
| Cache                | Upstash Redis       | latest  | Link metadata cache        | Local (Skip/Memory) → Dev (Cloud) → Prod (Cloud)  | Serverless Redis, global replication, pay-per-use                    |
| File Storage         | Supabase Storage    | latest  | Future: QR codes, assets   | Dev (Cloud) → Prod (Cloud)                        | Integrated with RLS, no additional setup                             |
| Authentication       | Supabase Auth       | 2.0+    | User management            | Local (Supabase CLI) → Dev (Cloud) → Prod (Cloud) | Magic links, OAuth, integrated with database                         |
| Frontend Testing     | Vitest              | 1.2+    | Unit/component tests       | Local → CI/CD                                     | 10x faster than Jest, native ESM support                             |
| Backend Testing      | Vitest              | 1.2+    | API/integration tests      | Local → CI/CD                                     | Unified testing framework                                            |
| E2E Testing          | Playwright          | 1.40+   | Browser automation         | Local → Dev → Staging                             | Cross-browser testing, better than Cypress for our needs             |
| Build Tool           | Vite                | 5.0+    | Development server         | All environments                                  | Used by Vitest, instant HMR                                          |
| Bundler              | Turbopack           | latest  | Production builds          | Build environments                                | Next.js native bundler, faster than Webpack                          |
| IaC Tool             | SST                 | 2.40+   | Infrastructure as code     | Deployment automation                             | Better than Terraform for serverless, great Vercel integration       |
| CI/CD                | GitHub Actions      | n/a     | Automation pipelines       | All deployments                                   | Free for public repos, great Vercel integration                      |
| Monitoring           | Sentry              | 7.100+  | Error tracking             | Dev → Prod (not local)                            | Excellent Next.js integration, performance monitoring                |
| Logging              | Axiom               | latest  | Structured logging         | Dev → Prod                                        | Better than Datadog for our scale, great Vercel integration          |
| CSS Framework        | Tailwind CSS        | 3.4+    | Utility-first CSS          | All environments                                  | Pairs with shadcn/ui, incredible DX with AI coding                   |
| Package Manager      | pnpm                | 8.15+   | Dependency management      | All environments                                  | Faster than npm/yarn, perfect for monorepos                          |
| Monorepo Tool        | Turborepo           | 1.12+   | Monorepo orchestration     | All environments                                  | Proven by Vercel and Dub.co, excellent caching                       |
| ORM                  | Prisma              | 5.9+    | Database toolkit           | All environments                                  | Type-safe queries, migrations, works great with Supabase             |
| Email Service        | Resend              | latest  | Transactional emails       | Local (Preview) → Dev (Test) → Prod (Live)        | Built by former Vercel team, great DX, React email templates         |
| Analytics (Product)  | PostHog             | Cloud   | User analytics             | Dev → Prod (not local)                            | Better than Plausible for product metrics, session recordings        |
| Analytics (Speed)    | Vercel Analytics    | latest  | Performance metrics        | Dev → Prod                                        | Built-in with Vercel, Core Web Vitals tracking                       |
| Rate Limiting        | Upstash Ratelimit   | latest  | API protection             | All environments                                  | Serverless rate limiting with Redis backend                          |
| Feature Flags        | Vercel Edge Config  | latest  | Feature toggles            | Dev → Prod                                        | Instant updates without redeploy                                     |
| Payments             | Stripe              | latest  | Subscriptions              | Local (Test) → Dev (Test) → Prod (Live)           | Industry standard, excellent webhook support                         |
| Form Validation      | Zod                 | 3.22+   | Schema validation          | All environments                                  | Type inference, works with tRPC and react-hook-form                  |
| Form Library         | react-hook-form     | 7.49+   | Form management            | All environments                                  | Performant, works great with Zod                                     |
| Data Fetching        | TanStack Query      | 5.18+   | Server state management    | All environments                                  | Caching, optimistic updates, perfect for real-time                   |
| Time Library         | date-fns            | 3.3+    | Date manipulation          | All environments                                  | Tree-shakeable, better than moment.js                                |
| Icons                | Lucide React        | 0.32+   | Icon library               | All environments                                  | Consistent with shadcn/ui, tree-shakeable                            |
| Charts               | Recharts            | 2.10+   | Data visualization         | All environments                                  | Best for analytics dashboards, responsive                            |
| QR Generator         | qrcode              | 1.5+    | QR code generation         | All environments                                  | For link QR codes feature                                            |
| Browser Extension    | WXT                 | 0.17+   | Extension framework        | Local → Production                                | Modern Chrome extension development with Vite                        |

## Environment Cost Breakdown

| Service           | Local             | Development    | Production      | Monthly Cost |
| ----------------- | ----------------- | -------------- | --------------- | ------------ |
| **Vercel**        | N/A               | Free/Hobby     | Pro Plan        | $0 → $20     |
| **Supabase**      | Local CLI (Free)  | Free Tier      | Pro Plan        | $0 → $25     |
| **Upstash Redis** | Skip/Memory Cache | Free Tier      | Pay-as-you-go   | $0 → ~$10    |
| **Stripe**        | Test Mode         | Test Mode      | Live Mode       | 2.9% + 30¢   |
| **Resend**        | Dev Preview       | 100/day free   | 3000/month      | $0 → $20     |
| **Sentry**        | Disabled          | 5K events free | 100K events     | $0 → $26     |
| **PostHog**       | Disabled          | 1M events free | 1M events free  | $0           |
| **Total**         | **$0**            | **$0**         | **~$101/month** |              |
