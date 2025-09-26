-- Add missing JSON fields to links table
ALTER TABLE "links"
ADD COLUMN IF NOT EXISTS "geo_targeting" JSONB,
ADD COLUMN IF NOT EXISTS "device_targeting" JSONB,
ADD COLUMN IF NOT EXISTS "qr_code_settings" JSONB;