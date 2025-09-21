-- Enable RLS on Critical Financial Tables
-- This script enables Row Level Security on tables that contain sensitive financial and user data

-- ============================================
-- 1. PAYMENT_METHODS TABLE
-- ============================================
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view payment methods for their workspaces
CREATE POLICY "Users can view payment methods for their workspaces" ON payment_methods
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Only workspace admins can manage payment methods
CREATE POLICY "Workspace admins can manage payment methods" ON payment_methods
    FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view subscriptions for their workspaces
CREATE POLICY "Users can view subscriptions for their workspaces" ON subscriptions
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Only workspace owners can manage subscriptions
CREATE POLICY "Workspace owners can manage subscriptions" ON subscriptions
    FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- ============================================
-- 3. INVOICES TABLE
-- ============================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invoices for their workspaces
CREATE POLICY "Users can view invoices for their workspaces" ON invoices
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Policy: System can create invoices (for webhook handling)
CREATE POLICY "System can create invoices" ON invoices
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 4. WORKSPACE_INVITATIONS TABLE
-- ============================================
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations for their email
CREATE POLICY "Users can view their own invitations" ON workspace_invitations
    FOR SELECT
    USING (
        email = (SELECT email FROM users WHERE id = auth.uid())
        OR invited_by = auth.uid()
        OR workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Policy: Workspace admins can create invitations
CREATE POLICY "Workspace admins can create invitations" ON workspace_invitations
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Policy: Workspace admins can update invitations (revoke)
CREATE POLICY "Workspace admins can update invitations" ON workspace_invitations
    FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 5. DOMAINS TABLE
-- ============================================
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view domains for their workspaces
CREATE POLICY "Users can view domains for their workspaces" ON domains
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Workspace admins can manage domains
CREATE POLICY "Workspace admins can manage domains" ON domains
    FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 6. LINK_IMPORTS TABLE
-- ============================================
ALTER TABLE link_imports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view imports for their workspaces
CREATE POLICY "Users can view imports for their workspaces" ON link_imports
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Workspace members can create imports
CREATE POLICY "Workspace members can create imports" ON link_imports
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 7. TAGS TABLE
-- ============================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tags for their workspaces
CREATE POLICY "Users can view tags for their workspaces" ON tags
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Workspace members can manage tags
CREATE POLICY "Workspace members can manage tags" ON tags
    FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 8. USAGE_METRICS TABLE
-- ============================================
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view metrics for their workspaces
CREATE POLICY "Users can view metrics for their workspaces" ON usage_metrics
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- Policy: System can write metrics
CREATE POLICY "System can write metrics" ON usage_metrics
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update metrics" ON usage_metrics
    FOR UPDATE
    USING (true);

-- ============================================
-- 9. UTM_TEMPLATES TABLE
-- ============================================
ALTER TABLE utm_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view templates for their workspaces
CREATE POLICY "Users can view templates for their workspaces" ON utm_templates
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Workspace members can manage templates
CREATE POLICY "Workspace members can manage templates" ON utm_templates
    FOR ALL
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM workspace_memberships
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify all tables now have RLS enabled:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY rowsecurity DESC, tablename;