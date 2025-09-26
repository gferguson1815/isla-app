-- Seed initial features and plan configurations
-- This script populates the features and plan_features tables

-- Insert core features
INSERT INTO features (id, key, name, description, category) VALUES
  (gen_random_uuid(), 'folders', 'Link Folders', 'Organize your links into folders for better management', 'organization'),
  (gen_random_uuid(), 'custom_domains', 'Custom Domains', 'Use your own domain for branded short links', 'branding'),
  (gen_random_uuid(), 'password_protection', 'Password Protected Links', 'Add password protection to your links', 'security'),
  (gen_random_uuid(), 'link_expiration', 'Link Expiration', 'Set expiration dates for your links', 'security'),
  (gen_random_uuid(), 'utm_builder', 'UTM Builder', 'Add UTM parameters for campaign tracking', 'analytics'),
  (gen_random_uuid(), 'qr_code_customization', 'QR Code Customization', 'Customize QR codes with colors and logos', 'branding'),
  (gen_random_uuid(), 'bulk_import', 'Bulk Import', 'Import multiple links from CSV', 'productivity'),
  (gen_random_uuid(), 'api_access', 'API Access', 'Programmatic access to create and manage links', 'developer'),
  (gen_random_uuid(), 'team_members', 'Team Members', 'Add team members to your workspace', 'collaboration'),
  (gen_random_uuid(), 'advanced_analytics', 'Advanced Analytics', 'Detailed analytics and insights', 'analytics'),
  (gen_random_uuid(), 'geo_targeting', 'Geographic Targeting', 'Redirect users based on location', 'targeting'),
  (gen_random_uuid(), 'device_targeting', 'Device Targeting', 'Different URLs for different devices', 'targeting'),
  (gen_random_uuid(), 'link_cloaking', 'Link Cloaking', 'Hide the destination URL', 'security'),
  (gen_random_uuid(), 'branded_qr_codes', 'Branded QR Codes', 'Add your logo to QR codes', 'branding')
ON CONFLICT (key) DO NOTHING;

-- Configure features for each plan
-- Free Plan (most features disabled)
INSERT INTO plan_features (plan, feature_id, enabled, limit_value, custom_message)
SELECT
  'free',
  f.id,
  CASE f.key
    WHEN 'folders' THEN false
    ELSE false
  END as enabled,
  CASE f.key
    WHEN 'folders' THEN 0
    WHEN 'custom_domains' THEN 0
    WHEN 'team_members' THEN 1
    ELSE 0
  END as limit_value,
  CASE f.key
    WHEN 'folders' THEN 'You can only use Link Folders on a Pro plan and above. Upgrade to Pro to continue.'
    WHEN 'custom_domains' THEN 'Custom domains are available on Pro plans and above.'
    WHEN 'password_protection' THEN 'Password protection is available on Pro plans and above.'
    WHEN 'link_expiration' THEN 'Link expiration is available on Pro plans and above.'
    WHEN 'utm_builder' THEN 'UTM Builder is available on Pro plans and above.'
    WHEN 'bulk_import' THEN 'Bulk import is available on Pro plans and above.'
    WHEN 'team_members' THEN 'Team collaboration is available on Pro plans and above.'
    ELSE NULL
  END as custom_message
FROM features f
ON CONFLICT (plan, feature_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  limit_value = EXCLUDED.limit_value,
  custom_message = EXCLUDED.custom_message;

-- Pro Plan (most features enabled with limits)
INSERT INTO plan_features (plan, feature_id, enabled, limit_value, custom_message)
SELECT
  'pro',
  f.id,
  CASE f.key
    WHEN 'api_access' THEN false
    ELSE true
  END as enabled,
  CASE f.key
    WHEN 'folders' THEN 50
    WHEN 'custom_domains' THEN 3
    WHEN 'team_members' THEN 5
    WHEN 'bulk_import' THEN 500 -- 500 links per import
    ELSE NULL -- No specific limit
  END as limit_value,
  CASE f.key
    WHEN 'api_access' THEN 'API access is available on Enterprise plans.'
    ELSE NULL
  END as custom_message
FROM features f
ON CONFLICT (plan, feature_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  limit_value = EXCLUDED.limit_value,
  custom_message = EXCLUDED.custom_message;

-- Enterprise Plan (everything enabled, no limits)
INSERT INTO plan_features (plan, feature_id, enabled, limit_value, custom_message)
SELECT
  'enterprise',
  f.id,
  true as enabled,
  NULL as limit_value, -- NULL means unlimited
  NULL as custom_message
FROM features f
ON CONFLICT (plan, feature_id) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  limit_value = EXCLUDED.limit_value,
  custom_message = EXCLUDED.custom_message;