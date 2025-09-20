-- Fix Storage Policies for workspace-logos bucket
-- Run this in Supabase SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow workspace logo upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public workspace logo access" ON storage.objects;
DROP POLICY IF EXISTS "Allow workspace logo update" ON storage.objects;
DROP POLICY IF EXISTS "Allow workspace logo delete" ON storage.objects;

-- Create new policies with proper permissions

-- 1. Allow authenticated users to upload files to workspace-logos bucket
CREATE POLICY "Authenticated users can upload workspace logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'workspace-logos'
);

-- 2. Allow public read access to workspace logos (since they're public assets)
CREATE POLICY "Public can view workspace logos"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'workspace-logos'
);

-- 3. Allow authenticated users to update their own workspace logos
CREATE POLICY "Authenticated users can update workspace logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'workspace-logos'
)
WITH CHECK (
    bucket_id = 'workspace-logos'
);

-- 4. Allow authenticated users to delete workspace logos
CREATE POLICY "Authenticated users can delete workspace logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'workspace-logos'
);

-- Verify the bucket exists and is public
UPDATE storage.buckets
SET public = true
WHERE id = 'workspace-logos';

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;