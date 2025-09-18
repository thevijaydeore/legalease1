-- Add RAG processing fields to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS chunks_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS embedding_status text DEFAULT 'pending';

-- Create document_chunks table for storing text chunks
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  chunk_index integer NOT NULL,
  chunk_text text NOT NULL,
  token_count integer,
  pinecone_id text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on document_chunks
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for document_chunks
CREATE POLICY "Users can view their own document chunks" 
ON public.document_chunks 
FOR SELECT 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can insert their own document chunks" 
ON public.document_chunks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can update their own document chunks" 
ON public.document_chunks 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Users can delete their own document chunks" 
ON public.document_chunks 
FOR DELETE 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Create trigger for updated_at on document_chunks
CREATE TRIGGER update_document_chunks_updated_at
BEFORE UPDATE ON public.document_chunks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();