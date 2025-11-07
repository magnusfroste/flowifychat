-- Create storage buckets for chat branding assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('chat-logos', 'chat-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']),
  ('chat-avatars', 'chat-avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

-- Create RLS policies for logo uploads
CREATE POLICY "Users can upload their own chat logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own chat logos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own chat logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for avatar uploads
CREATE POLICY "Users can upload their own chat avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own chat avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own chat avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view logos and avatars
CREATE POLICY "Public can view chat logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-logos');

CREATE POLICY "Public can view chat avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-avatars');