-- Create clickEvents table for analytics
CREATE TABLE IF NOT EXISTS clickEvents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linkId UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip VARCHAR(64) NOT NULL,
  country VARCHAR(100),
  city VARCHAR(100),
  device VARCHAR(20) NOT NULL CHECK (device IN ('mobile', 'desktop', 'tablet')),
  browser VARCHAR(50) NOT NULL,
  os VARCHAR(50) NOT NULL,
  referrer TEXT,
  userAgent TEXT NOT NULL,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_clickEvents_linkId ON clickEvents(linkId);
CREATE INDEX idx_clickEvents_timestamp ON clickEvents(timestamp);
CREATE INDEX idx_clickEvents_linkId_timestamp ON clickEvents(linkId, timestamp DESC);

-- Create function to increment click count
CREATE OR REPLACE FUNCTION increment_click_count(link_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE links
  SET clickCount = clickCount + 1,
      updatedAt = NOW()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for clickEvents
ALTER TABLE clickEvents ENABLE ROW LEVEL SECURITY;

-- RLS policies for clickEvents
-- Allow authenticated users to read click events for their workspace links
CREATE POLICY "Users can view click events for their workspace links"
  ON clickEvents
  FOR SELECT
  TO authenticated
  USING (
    linkId IN (
      SELECT id FROM links
      WHERE workspaceId IN (
        SELECT workspaceId FROM workspaceMembers
        WHERE userId = auth.uid()
      )
    )
  );

-- Allow service role and anonymous users to insert click events (for tracking)
CREATE POLICY "Allow anonymous click event tracking"
  ON clickEvents
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Grant execute permission on increment function to anonymous users
GRANT EXECUTE ON FUNCTION increment_click_count(UUID) TO anon;