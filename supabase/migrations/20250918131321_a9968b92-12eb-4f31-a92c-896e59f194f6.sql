-- Drop FK to auth.users to prevent insert failures for guest uploads
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;

-- Add a file_url column to store the storage URL (optional for private buckets)
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_url text;