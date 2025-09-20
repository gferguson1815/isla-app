-- Create workspace-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'workspace-logos',
  'workspace-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload workspace logos
CREATE POLICY IF NOT EXISTS "Allow workspace logo upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'workspace-logos');

-- Allow public read access to workspace logos
CREATE POLICY IF NOT EXISTS "Allow public workspace logo access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'workspace-logos');

-- Allow authenticated users to update their workspace logos
CREATE POLICY IF NOT EXISTS "Allow workspace logo update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'workspace-logos');

-- Allow authenticated users to delete their workspace logos
CREATE POLICY IF NOT EXISTS "Allow workspace logo delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'workspace-logos');