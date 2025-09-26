-- Setup Shadow Database Schema for Prisma Migrations
-- This creates a separate schema in your Supabase database for Prisma's shadow database

-- Drop the shadow schema if it exists (to start fresh)
DROP SCHEMA IF EXISTS prisma_shadow CASCADE;

-- Create a new schema for the shadow database
CREATE SCHEMA prisma_shadow;

-- Grant all privileges on the shadow schema to the postgres user
GRANT ALL ON SCHEMA prisma_shadow TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA prisma_shadow TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA prisma_shadow TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA prisma_shadow TO postgres;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA prisma_shadow
    GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA prisma_shadow
    GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA prisma_shadow
    GRANT ALL ON FUNCTIONS TO postgres;

-- Ensure the postgres user can create objects in this schema
GRANT CREATE ON SCHEMA prisma_shadow TO postgres;