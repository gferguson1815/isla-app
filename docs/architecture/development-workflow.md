# Development Workflow

## Local Development Setup

> **Important Note on Local Development:**
> We use Supabase CLI for local development, which runs all services (PostgreSQL, Auth, Realtime, Storage) directly on localhost ports. While Supabase CLI uses Docker internally for containerization, this is abstracted away - you interact with localhost services, not Docker containers. No Docker knowledge or commands are required.

### Prerequisites

```bash
# Required tools and versions
node >= 18.0.0
pnpm >= 8.15.0
supabase >= 1.142.0 (Supabase CLI - provides localhost services)
git >= 2.40.0

# Optional but recommended
gh cli >= 2.40.0 (GitHub CLI)
vercel cli >= 32.0.0 (for deployment testing)

# Chrome/Chromium for extension development
Google Chrome >= 120
```

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/isla-links.git
cd isla-links

# 2. Install dependencies
pnpm install

# 3. Run automated setup script
./scripts/setup-dev.sh

# The setup script will:
# - Check prerequisites
# - Copy .env.example to .env.local, .env.development, .env.production
# - Start local Supabase instance (using Supabase CLI - runs on localhost)
# - Run database migrations
# - Seed initial data
# - Generate TypeScript types
# - Verify setup

# 4. Configure environments:
# Edit .env.local for local development
# Edit .env.development for dev deployment
# Edit .env.production for production deployment

# 5. Start Supabase locally (using Supabase CLI)
pnpm supabase start
# This starts:
# - PostgreSQL on localhost:54322
# - Supabase Studio on localhost:54323
# - Auth service on localhost:54321
# - Realtime service on localhost:54321
# Note: All services run locally on your machine, no Docker required

# 6. Start local development
pnpm dev
```

### Environment-Specific Commands

```bash
# Local development
pnpm dev                    # Start all services locally
pnpm db:migrate:local      # Run migrations on local DB
pnpm test                  # Run tests against local environment

# Development environment
pnpm deploy:dev            # Deploy to dev.isla.link
pnpm db:migrate:dev        # Run migrations on dev Supabase
pnpm test:dev              # Run E2E tests against dev environment

# Production environment
pnpm deploy:prod           # Deploy to app.isla.link (requires approval)
pnpm db:migrate:prod       # Run migrations on production (careful!)
pnpm test:smoke            # Run smoke tests on production
```

### Environment Configuration

#### Three-Environment Strategy

```bash
# .env.local (Local Development - Supabase CLI localhost services)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
STRIPE_SECRET_KEY=sk_test_local
RESEND_API_KEY=re_test_local

# .env.development (Development Cloud Environment)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=https://dev.isla.link
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.dev-project.supabase.co:6543/postgres
STRIPE_SECRET_KEY=sk_test_xxx
RESEND_API_KEY=re_test_xxx
UPSTASH_REDIS_REST_URL=https://dev-xxx.upstash.io
SENTRY_DSN=https://dev-xxx@sentry.io/xxx

# .env.production (Production Environment)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.isla.link
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.prod-project.supabase.co:6543/postgres
STRIPE_SECRET_KEY=sk_live_xxx
RESEND_API_KEY=re_live_xxx
UPSTASH_REDIS_REST_URL=https://prod-xxx.upstash.io
SENTRY_DSN=https://prod-xxx@sentry.io/xxx
```
