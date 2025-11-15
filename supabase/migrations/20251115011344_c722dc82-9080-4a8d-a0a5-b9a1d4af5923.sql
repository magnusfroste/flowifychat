-- Ensure chat-logos bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-logos', 'chat-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for chat logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat logos" ON storage.objects;

-- Allow public read access to all files in chat-logos bucket
CREATE POLICY "Public read access for chat logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-logos');

-- Allow authenticated users to upload their own logos
CREATE POLICY "Authenticated users can upload chat logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-logos' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update their own logos
CREATE POLICY "Users can update their own chat logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chat-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete their own chat logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);