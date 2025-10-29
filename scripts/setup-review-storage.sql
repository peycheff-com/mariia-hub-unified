-- Review Media Storage Bucket Setup
-- Run this in Supabase SQL Editor after starting the project

-- Create review-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-media',
  'review-media',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Create policies for review-media bucket
-- 1. Allow authenticated users to upload their own review photos
CREATE POLICY "Users can upload review photos" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'review-media' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()
);

-- 2. Allow users to update their own review photos
CREATE POLICY "Users can update their review photos" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'review-media' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()
);

-- 3. Allow public access to read all review photos (they're public reviews)
CREATE POLICY "Anyone can view review photos" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'review-media'
);

-- 4. Allow users to delete their own review photos
CREATE POLICY "Users can delete their review photos" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'review-media' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()
);

-- Create service role for admin operations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
$$;

-- Grant service role full access to review-media bucket
GRANT ALL ON SCHEMA storage TO service_role;
GRANT ALL ON storage.buckets TO service_role;
GRANT ALL ON storage.objects TO service_role;

-- Create a folder structure template
-- This helps organize photos by user and date
-- Format: /review-media/{user_id}/{year}/{month}/{filename}

-- Example SQL to create a folder for a user (run in application code):
-- INSERT INTO storage.objects (bucket_id, name, owner)
-- VALUES ('review-media', 'user-uuid/2024/01/example.jpg', 'user-uuid');