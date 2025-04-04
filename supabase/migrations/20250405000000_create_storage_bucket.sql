
-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoices', 'invoices', true, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[];

-- Create policy to allow authenticated users to read files
CREATE POLICY "Allow public read access"
  ON storage.objects FOR SELECT
  USING (true);

-- Create policy to allow users to upload their own files
CREATE POLICY "Allow users to upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow users to update their own files
CREATE POLICY "Allow users to update their own files"
  ON storage.objects FOR UPDATE
  USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy to allow users to delete their own files
CREATE POLICY "Allow users to delete their own files"
  ON storage.objects FOR DELETE
  USING (auth.uid()::text = (storage.foldername(name))[1]);
