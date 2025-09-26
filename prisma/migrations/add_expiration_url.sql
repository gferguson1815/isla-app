-- Add expiration_url column to links table
ALTER TABLE links
ADD COLUMN IF NOT EXISTS expiration_url TEXT;

-- Add expiration_url column to link_drafts table for consistency
ALTER TABLE link_drafts
ADD COLUMN IF NOT EXISTS expiration_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN links.expiration_url IS 'URL to redirect to when the link has expired';
COMMENT ON COLUMN link_drafts.expiration_url IS 'URL to redirect to when the link has expired';