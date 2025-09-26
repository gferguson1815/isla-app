-- Create link_drafts table for autosaving form data
CREATE TABLE link_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- All form fields to capture
  destination_url TEXT,
  slug TEXT,
  domain TEXT DEFAULT 'dub.sh',
  folder_id UUID REFERENCES folders(id),

  -- Custom metadata
  title TEXT,
  description TEXT,
  image TEXT,

  -- Tags stored as JSON array
  tags TEXT[],
  comments TEXT,

  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Advanced settings
  password TEXT,
  expires_at TIMESTAMPTZ,
  click_limit INTEGER,

  -- Targeting
  ios_url TEXT,
  android_url TEXT,
  geo_targeting JSONB,
  device_targeting JSONB,

  -- QR Code customization
  qr_code_settings JSONB,

  -- Conversion tracking
  conversion_tracking JSONB,

  -- Metadata
  form_data JSONB, -- Store any additional form data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at_draft TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days', -- Auto-cleanup old drafts

  -- Indexes
  CONSTRAINT unique_user_workspace_draft UNIQUE (user_id, workspace_id, id)
);

-- Create indexes for performance
CREATE INDEX idx_link_drafts_user_workspace ON link_drafts(user_id, workspace_id);
CREATE INDEX idx_link_drafts_updated_at ON link_drafts(updated_at DESC);
CREATE INDEX idx_link_drafts_expires ON link_drafts(expires_at_draft);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_link_drafts_updated_at
  BEFORE UPDATE ON link_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup job for expired drafts (run daily)
-- DELETE FROM link_drafts WHERE expires_at_draft < NOW();