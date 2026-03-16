-- Create the ai-edits storage bucket for AI-generated/edited images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-edits',
  'ai-edits',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload ai-edits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-edits');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update ai-edits"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ai-edits');

-- Allow public read access (bucket is public)
CREATE POLICY "Public read access for ai-edits"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ai-edits');
