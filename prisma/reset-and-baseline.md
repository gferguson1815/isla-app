# Prisma + Supabase Migration Reset Guide

## Current Situation
- Prisma schema is now synced with Supabase production database
- Migration history may be out of sync
- Shadow database issues preventing new migrations

## Solution: Baseline Strategy

Since Supabase is your production database and already has the schema, we'll use a "baseline" approach:

### Step 1: Mark Current State as Baseline

1. **Clear existing migration history** (if needed):
```bash
rm -rf prisma/migrations
```

2. **Create initial migration from current state**:
```bash
npx prisma migrate dev --name initial_baseline --create-only
```

3. **Mark migration as already applied** (since schema exists in Supabase):
```bash
npx prisma migrate resolve --applied initial_baseline
```

### Step 2: Fix Shadow Database

For Supabase, we have two options:

#### Option A: Use a separate database for shadow (Recommended)
Create a separate Supabase project for development that includes a shadow database.

#### Option B: Use schema-based shadow database
Add to your `.env`:
```env
SHADOW_DATABASE_URL="${DIRECT_URL}?schema=shadow"
```

Then create the shadow schema in Supabase:
```sql
CREATE SCHEMA IF NOT EXISTS shadow;
GRANT ALL ON SCHEMA shadow TO postgres;
```

### Step 3: Going Forward

After baselining:
1. All new changes should be made through Prisma migrations
2. Use `npx prisma migrate dev` for local development
3. Use `npx prisma migrate deploy` for production

## Alternative: Supabase CLI Approach

If you prefer Supabase as the source of truth:

1. Use Supabase CLI for schema changes:
```bash
supabase db diff --file new_migration.sql
```

2. Apply migrations via Supabase:
```bash
supabase db push
```

3. Then pull into Prisma:
```bash
npx prisma db pull
npx prisma generate
```

## Current Recommendation

Since you already have a production database with data, I recommend:

1. Keep current pulled schema
2. Generate Prisma client: `npx prisma generate`
3. For new features, create migrations but test them carefully
4. Consider using Supabase migrations for complex DDL changes