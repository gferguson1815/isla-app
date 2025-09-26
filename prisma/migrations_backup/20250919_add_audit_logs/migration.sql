-- Create audit_logs table for tracking workspace invitation actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Add RLS policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Workspace admins and owners can view audit logs
CREATE POLICY "Workspace admins can view audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_memberships
      WHERE workspace_memberships.workspace_id = audit_logs.workspace_id
        AND workspace_memberships.user_id = auth.uid()
        AND workspace_memberships.role IN ('owner', 'admin')
    )
  );

-- Comment on table
COMMENT ON TABLE audit_logs IS 'Audit log for tracking workspace actions including invitations, member management, and settings changes';