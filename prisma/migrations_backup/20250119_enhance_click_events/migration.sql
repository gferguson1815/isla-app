-- Add enhanced tracking columns to click_events table
ALTER TABLE click_events
ADD COLUMN IF NOT EXISTS browser_version VARCHAR(20),
ADD COLUMN IF NOT EXISTS os_version VARCHAR(20),
ADD COLUMN IF NOT EXISTS referrer_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_term VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100);

-- Create analytics_aggregates table for processed metrics
CREATE TABLE IF NOT EXISTS analytics_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  period VARCHAR(10) NOT NULL CHECK (period IN ('hour', 'day', 'week', 'month')),
  period_start TIMESTAMPTZ NOT NULL,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  device_breakdown JSONB,
  browser_breakdown JSONB,
  os_breakdown JSONB,
  country_breakdown JSONB,
  referrer_type_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_link_period_start UNIQUE(link_id, period, period_start)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_click_events_browser_version ON click_events(browser_version) WHERE browser_version IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_click_events_referrer_type ON click_events(referrer_type) WHERE referrer_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_click_events_utm_source ON click_events(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_click_events_utm_campaign ON click_events(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_link_period ON analytics_aggregates(link_id, period, period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_period_start ON analytics_aggregates(period_start);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for analytics_aggregates
DROP TRIGGER IF EXISTS update_analytics_aggregates_updated_at ON analytics_aggregates;
CREATE TRIGGER update_analytics_aggregates_updated_at
BEFORE UPDATE ON analytics_aggregates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();