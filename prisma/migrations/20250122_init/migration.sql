-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."analytics_aggregates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "link_id" UUID,
    "period" VARCHAR(10) NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "unique_visitors" INTEGER NOT NULL DEFAULT 0,
    "device_breakdown" JSONB,
    "browser_breakdown" JSONB,
    "os_breakdown" JSONB,
    "country_breakdown" JSONB,
    "referrer_type_breakdown" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(255),
    "metadata" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."click_events" (
    "id" UUID NOT NULL,
    "link_id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referer" TEXT,
    "device" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "browser_version" VARCHAR(20),
    "os_version" VARCHAR(20),
    "referrer_type" VARCHAR(20),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "utm_term" VARCHAR(100),
    "utm_content" VARCHAR(100),

    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."domains" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "verification_token" VARCHAR(255),
    "verified_at" TIMESTAMPTZ(6),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "ssl_status" VARCHAR(20),
    "dns_configured" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."folders" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "description" TEXT,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "stripe_invoice_id" TEXT NOT NULL,
    "invoice_number" TEXT,
    "amount_due" INTEGER NOT NULL,
    "amount_paid" INTEGER NOT NULL,
    "amount_remaining" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "status" VARCHAR(50) NOT NULL,
    "due_date" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "invoice_pdf" TEXT,
    "hosted_invoice_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."link_imports" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "success_count" INTEGER NOT NULL,
    "error_count" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."links" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "folder_id" UUID,
    "campaign_id" UUID,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "image" TEXT,
    "favicon" TEXT,
    "password" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "click_limit" INTEGER,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "last_clicked_at" TIMESTAMPTZ(6),
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "ios_url" TEXT,
    "android_url" TEXT,
    "enable_geolocation" BOOLEAN NOT NULL DEFAULT false,
    "enable_device_targeting" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMPTZ(6),
    "import_id" UUID,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "card_brand" VARCHAR(20),
    "card_last4" VARCHAR(4),
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "stripe_subscription_id" TEXT NOT NULL,
    "stripe_price_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_period_start" TIMESTAMPTZ(6) NOT NULL,
    "current_period_end" TIMESTAMPTZ(6) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMPTZ(6),
    "trial_start" TIMESTAMPTZ(6),
    "trial_end" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."link_drafts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "destination_url" TEXT,
    "slug" TEXT,
    "domain" TEXT DEFAULT 'dub.sh',
    "folder_id" UUID,
    "title" TEXT,
    "description" TEXT,
    "image" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "comments" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_term" TEXT,
    "utm_content" TEXT,
    "password" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "click_limit" INTEGER,
    "ios_url" TEXT,
    "android_url" TEXT,
    "geo_targeting" JSONB,
    "device_targeting" JSONB,
    "qr_code_settings" JSONB,
    "conversion_tracking" JSONB,
    "form_data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at_draft" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() + '30 days'::interval),

    CONSTRAINT "link_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usage_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "metric_type" VARCHAR(50) NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "period" VARCHAR(20) NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."utm_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "utm_source" VARCHAR(255),
    "utm_medium" VARCHAR(255),
    "utm_campaign" VARCHAR(255),
    "utm_term" VARCHAR(255),
    "utm_content" VARCHAR(255),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utm_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL,
    "invited_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "max_links" INTEGER NOT NULL DEFAULT 50,
    "max_clicks" INTEGER NOT NULL DEFAULT 5000,
    "max_users" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "custom_limits" JSONB,
    "logo_url" TEXT,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed_at" TIMESTAMPTZ(6),
    "onboarding_steps" JSONB,
    "getting_started_dismissed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."features" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plan_features" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan" VARCHAR(50) NOT NULL,
    "feature_id" UUID NOT NULL,
    "enabled" BOOLEAN DEFAULT false,
    "limit_value" INTEGER,
    "custom_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feature_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "feature_id" UUID NOT NULL,
    "usage_count" INTEGER DEFAULT 0,
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_analytics_aggregates_link_period" ON "public"."analytics_aggregates"("link_id", "period", "period_start");

-- CreateIndex
CREATE INDEX "idx_analytics_aggregates_period_start" ON "public"."analytics_aggregates"("period_start");

-- CreateIndex
CREATE UNIQUE INDEX "unique_link_period_start" ON "public"."analytics_aggregates"("link_id", "period", "period_start");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_idx" ON "public"."audit_logs"("workspace_id");

-- CreateIndex
CREATE INDEX "campaigns_workspace_id_idx" ON "public"."campaigns"("workspace_id");

-- CreateIndex
CREATE INDEX "click_events_link_id_idx" ON "public"."click_events"("link_id");

-- CreateIndex
CREATE INDEX "click_events_timestamp_idx" ON "public"."click_events"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "domains_domain_key" ON "public"."domains"("domain");

-- CreateIndex
CREATE INDEX "domains_domain_idx" ON "public"."domains"("domain");

-- CreateIndex
CREATE INDEX "domains_status_idx" ON "public"."domains"("status");

-- CreateIndex
CREATE INDEX "domains_workspace_id_idx" ON "public"."domains"("workspace_id");

-- CreateIndex
CREATE INDEX "folders_parent_id_idx" ON "public"."folders"("parent_id");

-- CreateIndex
CREATE INDEX "folders_workspace_id_idx" ON "public"."folders"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripe_invoice_id_key" ON "public"."invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "public"."invoices"("due_date");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "public"."invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_workspace_id_idx" ON "public"."invoices"("workspace_id");

-- CreateIndex
CREATE INDEX "link_imports_created_at_idx" ON "public"."link_imports"("created_at");

-- CreateIndex
CREATE INDEX "link_imports_workspace_id_idx" ON "public"."link_imports"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "links_slug_key" ON "public"."links"("slug");

-- CreateIndex
CREATE INDEX "links_campaign_id_idx" ON "public"."links"("campaign_id");

-- CreateIndex
CREATE INDEX "links_created_by_idx" ON "public"."links"("created_by");

-- CreateIndex
CREATE INDEX "links_folder_id_idx" ON "public"."links"("folder_id");

-- CreateIndex
CREATE INDEX "links_slug_idx" ON "public"."links"("slug");

-- CreateIndex
CREATE INDEX "links_workspace_id_idx" ON "public"."links"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_stripe_payment_method_id_key" ON "public"."payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE INDEX "payment_methods_is_default_idx" ON "public"."payment_methods"("is_default");

-- CreateIndex
CREATE INDEX "payment_methods_workspace_id_idx" ON "public"."payment_methods"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_workspace_id_key" ON "public"."subscriptions"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "public"."subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "public"."subscriptions"("current_period_end");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "public"."subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_workspace_id_idx" ON "public"."subscriptions"("workspace_id");

-- CreateIndex
CREATE INDEX "link_drafts_user_id_workspace_id_idx" ON "public"."link_drafts"("user_id", "workspace_id");

-- CreateIndex
CREATE INDEX "link_drafts_updated_at_idx" ON "public"."link_drafts"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "link_drafts_expires_at_draft_idx" ON "public"."link_drafts"("expires_at_draft");

-- CreateIndex
CREATE UNIQUE INDEX "link_drafts_user_id_workspace_id_id_key" ON "public"."link_drafts"("user_id", "workspace_id", "id");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "public"."tags"("name");

-- CreateIndex
CREATE INDEX "tags_workspace_id_idx" ON "public"."tags"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_id_name" ON "public"."tags"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "usage_metrics_metric_type_idx" ON "public"."usage_metrics"("metric_type");

-- CreateIndex
CREATE INDEX "usage_metrics_period_start_period_end_idx" ON "public"."usage_metrics"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "usage_metrics_workspace_id_idx" ON "public"."usage_metrics"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_workspace_metric_period" ON "public"."usage_metrics"("workspace_id", "metric_type", "period", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "utm_templates_workspace_id_idx" ON "public"."utm_templates"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invitations_token_key" ON "public"."workspace_invitations"("token");

-- CreateIndex
CREATE INDEX "workspace_invitations_email_idx" ON "public"."workspace_invitations"("email");

-- CreateIndex
CREATE INDEX "workspace_invitations_expires_at_idx" ON "public"."workspace_invitations"("expires_at");

-- CreateIndex
CREATE INDEX "workspace_invitations_token_idx" ON "public"."workspace_invitations"("token");

-- CreateIndex
CREATE INDEX "workspace_invitations_workspace_id_idx" ON "public"."workspace_invitations"("workspace_id");

-- CreateIndex
CREATE INDEX "workspace_memberships_user_id_idx" ON "public"."workspace_memberships"("user_id");

-- CreateIndex
CREATE INDEX "workspace_memberships_workspace_id_idx" ON "public"."workspace_memberships"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_memberships_user_id_workspace_id_key" ON "public"."workspace_memberships"("user_id", "workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "public"."workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_stripe_customer_id_key" ON "public"."workspaces"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_stripe_subscription_id_key" ON "public"."workspaces"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "workspaces_deleted_at_idx" ON "public"."workspaces"("deleted_at");

-- CreateIndex
CREATE INDEX "workspaces_slug_idx" ON "public"."workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "features_key_key" ON "public"."features"("key");

-- CreateIndex
CREATE INDEX "idx_features_category" ON "public"."features"("category");

-- CreateIndex
CREATE INDEX "idx_features_key" ON "public"."features"("key");

-- CreateIndex
CREATE INDEX "idx_plan_features_feature_id" ON "public"."plan_features"("feature_id");

-- CreateIndex
CREATE INDEX "idx_plan_features_plan" ON "public"."plan_features"("plan");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_plan_feature_id_key" ON "public"."plan_features"("plan", "feature_id");

-- CreateIndex
CREATE INDEX "idx_feature_usage_feature_id" ON "public"."feature_usage"("feature_id");

-- CreateIndex
CREATE INDEX "idx_feature_usage_workspace_id" ON "public"."feature_usage"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_usage_workspace_id_feature_id_key" ON "public"."feature_usage"("workspace_id", "feature_id");

-- AddForeignKey
ALTER TABLE "public"."analytics_aggregates" ADD CONSTRAINT "analytics_aggregates_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."click_events" ADD CONSTRAINT "click_events_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."domains" ADD CONSTRAINT "domains_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."domains" ADD CONSTRAINT "domains_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folders" ADD CONSTRAINT "folders_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."link_imports" ADD CONSTRAINT "link_imports_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."links" ADD CONSTRAINT "links_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."links" ADD CONSTRAINT "links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."links" ADD CONSTRAINT "links_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."links" ADD CONSTRAINT "links_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "public"."link_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."links" ADD CONSTRAINT "links_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."link_drafts" ADD CONSTRAINT "link_drafts_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."link_drafts" ADD CONSTRAINT "link_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."link_drafts" ADD CONSTRAINT "link_drafts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tags" ADD CONSTRAINT "tags_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usage_metrics" ADD CONSTRAINT "usage_metrics_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."utm_templates" ADD CONSTRAINT "utm_templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."plan_features" ADD CONSTRAINT "plan_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."feature_usage" ADD CONSTRAINT "feature_usage_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."feature_usage" ADD CONSTRAINT "feature_usage_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

