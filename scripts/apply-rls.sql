-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for workspaces table
CREATE POLICY "Users can read workspaces they are members of" ON workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_memberships.workspace_id = workspaces.id
            AND workspace_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace owners and admins can update workspace" ON workspaces
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_memberships.workspace_id = workspaces.id
            AND workspace_memberships.user_id = auth.uid()
            AND workspace_memberships.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can create workspaces" ON workspaces
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Workspace owners can delete workspace" ON workspaces
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_memberships.workspace_id = workspaces.id
            AND workspace_memberships.user_id = auth.uid()
            AND workspace_memberships.role = 'owner'
        )
    );

-- RLS Policies for workspace_memberships table
CREATE POLICY "Users can read memberships for their workspaces" ON workspace_memberships
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM workspace_memberships AS wm
            WHERE wm.workspace_id = workspace_memberships.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace owners and admins can manage memberships" ON workspace_memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships AS wm
            WHERE wm.workspace_id = workspace_memberships.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('owner', 'admin')
        )
    );

-- RLS Policies for folders table
CREATE POLICY "Users can read folders in their workspaces" ON folders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_memberships.workspace_id = folders.workspace_id
            AND workspace_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage folders in their workspaces" ON folders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_memberships.workspace_id = folders.workspace_id
            AND workspace_memberships.user_id = auth.uid()
        )
    );

-- RLS Policies for campaigns table
CREATE POLICY "Users can read campaigns in their workspaces" ON campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_memberships.workspace_id = campaigns.workspace_id
            AND workspace_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage campaigns in their workspaces" ON campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_memberships.workspace_id = campaigns.workspace_id
            AND workspace_memberships.user_id = auth.uid()
        )
    );

-- RLS Policies for links table
CREATE POLICY "Users can read links in their workspaces" ON links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_memberships.workspace_id = links.workspace_id
            AND workspace_memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage links in their workspaces" ON links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_memberships
            WHERE workspace_memberships.workspace_id = links.workspace_id
            AND workspace_memberships.user_id = auth.uid()
        )
    );

-- RLS Policies for click_events table
-- Anyone can write click events (for tracking)
CREATE POLICY "Public can write click events" ON click_events
    FOR INSERT WITH CHECK (true);

-- Only workspace members can read click events
CREATE POLICY "Users can read click events for their links" ON click_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM links
            JOIN workspace_memberships ON workspace_memberships.workspace_id = links.workspace_id
            WHERE links.id = click_events.link_id
            AND workspace_memberships.user_id = auth.uid()
        )
    );