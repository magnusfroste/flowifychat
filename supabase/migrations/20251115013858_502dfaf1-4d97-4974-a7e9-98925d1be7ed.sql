-- Make chat-avatars bucket public and configure access policies
UPDATE storage.buckets 
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
WHERE id = 'chat-avatars';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for chat avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat avatars" ON storage.objects;

-- Allow public read access to all files in chat-avatars bucket
CREATE POLICY "Public read access for chat avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-avatars');

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Authenticated users can upload chat avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own chat avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chat-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own chat avatars
CREATE POLICY "Users can delete their own chat avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);