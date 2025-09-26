-- Create link-previews bucket for storing link preview images
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES (
  'link-previews',
  'link-previews',
  true, -- Public bucket so images can be accessed directly
  false,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  5242880 -- 5MB limit
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- Create RLS policies for link-previews bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload link preview images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'link-previews'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own link preview images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'link-previews'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own link preview images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'link-previews'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to view images (since bucket is public)
CREATE POLICY "Public can view link preview images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'link-previews');