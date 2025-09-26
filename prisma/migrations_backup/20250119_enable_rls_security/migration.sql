-- Enable RLS on analytics_aggregates table
ALTER TABLE analytics_aggregates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Enable RLS on utm_templates table if it exists (added in story 3.3)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'utm_templates') THEN
    ALTER TABLE utm_templates ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- ============================================
-- Analytics Aggregates RLS Policies
-- ============================================

-- Policy: Workspace members can view their analytics aggregates
CREATE POLICY "Workspace members can view analytics"
ON analytics_aggregates FOR SELECT
USING (
  link_id IN (
    SELECT l.id
    FROM links l
    INNER JOIN workspace_memberships wm ON l.workspace_id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

-- Policy: System can insert analytics aggregates (for cron jobs)
CREATE POLICY "System can insert analytics"
ON analytics_aggregates FOR INSERT
WITH CHECK (true);

-- Policy: System can update analytics aggregates (for cron jobs)
CREATE POLICY "System can update analytics"
ON analytics_aggregates FOR UPDATE
USING (true);

-- ============================================
-- Campaigns RLS Policies
-- ============================================

-- Policy: Workspace members can view campaigns in their workspace
CREATE POLICY "Workspace members can view campaigns"
ON campaigns FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- Policy: Workspace members can create campaigns in their workspace
CREATE POLICY "Workspace members can create campaigns"
ON campaigns FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- Policy: Workspace members can update campaigns in their workspace
CREATE POLICY "Workspace members can update campaigns"
ON campaigns FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- Policy: Workspace members can delete campaigns in their workspace
CREATE POLICY "Workspace members can delete campaigns"
ON campaigns FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_memberships
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- UTM Templates RLS Policies (if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'utm_templates') THEN
    -- Policy: Workspace members can view UTM templates in their workspace
    EXECUTE 'CREATE POLICY "Workspace members can view UTM templates"
    ON utm_templates FOR SELECT
    USING (
      workspace_id IN (
        SELECT workspace_id
        FROM workspace_memberships
        WHERE user_id = auth.uid()
      )
    )';

    -- Policy: Workspace members can create UTM templates in their workspace
    EXECUTE 'CREATE POLICY "Workspace members can create UTM templates"
    ON utm_templates FOR INSERT
    WITH CHECK (
      workspace_id IN (
        SELECT workspace_id
        FROM workspace_memberships
        WHERE user_id = auth.uid()
      )
    )';

    -- Policy: Workspace members can update UTM templates in their workspace
    EXECUTE 'CREATE POLICY "Workspace members can update UTM templates"
    ON utm_templates FOR UPDATE
    USING (
      workspace_id IN (
        SELECT workspace_id
        FROM workspace_memberships
        WHERE user_id = auth.uid()
      )
    )';

    -- Policy: Workspace members can delete UTM templates in their workspace
    EXECUTE 'CREATE POLICY "Workspace members can delete UTM templates"
    ON utm_templates FOR DELETE
    USING (
      workspace_id IN (
        SELECT workspace_id
        FROM workspace_memberships
        WHERE user_id = auth.uid()
      )
    )';
  END IF;
END
$$;

-- ============================================
-- Add indexes for better RLS performance
-- ============================================

-- Index for analytics_aggregates RLS policy performance
CREATE INDEX IF NOT EXISTS idx_links_workspace_id ON links(workspace_id);

-- Index for workspace_memberships lookups
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_user_id ON workspace_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_workspace_id ON workspace_memberships(workspace_id);

-- Index for campaigns workspace lookup
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);

-- Index for utm_templates workspace lookup (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'utm_templates') THEN
    CREATE INDEX IF NOT EXISTS idx_utm_templates_workspace_id ON utm_templates(workspace_id);
  END IF;
END
$$;