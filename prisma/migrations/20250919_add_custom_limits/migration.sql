-- Add custom_limits field to workspaces table for admin overrides
ALTER TABLE "workspaces" 
ADD COLUMN "custom_limits" JSONB;

-- Create indexes for efficient usage queries on usage_metrics
CREATE INDEX IF NOT EXISTS "idx_usage_metrics_workspace_value" 
ON "usage_metrics" ("workspace_id", "value");

-- Create composite index for quick limit checks
CREATE INDEX IF NOT EXISTS "idx_usage_metrics_workspace_type_period" 
ON "usage_metrics" ("workspace_id", "metric_type", "period");

-- Add comment explaining the custom_limits structure
COMMENT ON COLUMN "workspaces"."custom_limits" IS 
'JSON field for admin overrides: {beta_user: boolean, vip_customer: boolean, temp_increases: {links: 100, expires: "2024-01-01"}}';