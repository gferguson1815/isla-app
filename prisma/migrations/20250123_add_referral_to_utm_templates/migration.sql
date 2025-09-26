-- Add referral field to utm_templates table
ALTER TABLE "utm_templates"
ADD COLUMN IF NOT EXISTS "referral" VARCHAR(255);