-- Create features table
CREATE TABLE IF NOT EXISTS "features" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(100) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(100),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create plan_features table
CREATE TABLE IF NOT EXISTS "plan_features" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "plan" VARCHAR(50) NOT NULL,
  "feature_id" UUID NOT NULL REFERENCES "features"("id") ON DELETE CASCADE,
  "enabled" BOOLEAN DEFAULT false,
  "limit_value" INTEGER, -- NULL = unlimited, 0 = disabled, > 0 = specific limit
  "custom_message" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("plan", "feature_id")
);

-- Create feature_usage table for tracking
CREATE TABLE IF NOT EXISTS "feature_usage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "feature_id" UUID NOT NULL REFERENCES "features"("id") ON DELETE CASCADE,
  "usage_count" INTEGER DEFAULT 0,
  "last_used_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("workspace_id", "feature_id")
);

-- Create indexes for better performance
CREATE INDEX "idx_features_key" ON "features"("key");
CREATE INDEX "idx_features_category" ON "features"("category");
CREATE INDEX "idx_plan_features_plan" ON "plan_features"("plan");
CREATE INDEX "idx_plan_features_feature_id" ON "plan_features"("feature_id");
CREATE INDEX "idx_feature_usage_workspace_id" ON "feature_usage"("workspace_id");
CREATE INDEX "idx_feature_usage_feature_id" ON "feature_usage"("feature_id");

-- Enable RLS
ALTER TABLE "features" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plan_features" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feature_usage" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for features table (everyone can read features)
CREATE POLICY "Anyone can read features" ON "features"
  FOR SELECT USING (true);

-- RLS Policies for plan_features (everyone can read plan features)
CREATE POLICY "Anyone can read plan features" ON "plan_features"
  FOR SELECT USING (true);

-- RLS Policies for feature_usage (users can only see their workspace's usage)
CREATE POLICY "Users can read their workspace feature usage" ON "feature_usage"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "workspace_memberships"
      WHERE "workspace_memberships"."workspace_id" = "feature_usage"."workspace_id"
      AND "workspace_memberships"."user_id" = auth.uid()
    )
  );

CREATE POLICY "Users can update their workspace feature usage" ON "feature_usage"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "workspace_memberships"
      WHERE "workspace_memberships"."workspace_id" = "feature_usage"."workspace_id"
      AND "workspace_memberships"."user_id" = auth.uid()
    )
  );