-- Add color field to tags table
ALTER TABLE "tags" ADD COLUMN "color" VARCHAR(7);

-- Optional: Set default colors for existing tags
-- UPDATE "tags" SET "color" = '#6B7280' WHERE "color" IS NULL;