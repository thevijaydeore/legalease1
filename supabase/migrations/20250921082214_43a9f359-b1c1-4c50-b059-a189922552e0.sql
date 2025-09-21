-- Add summary fields to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS summary_data JSONB,
ADD COLUMN IF NOT EXISTS summary_generated BOOLEAN DEFAULT FALSE;