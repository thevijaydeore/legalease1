-- Fix security vulnerability: Remove public access to guest user documents
-- Users should only access their own documents, even as guests

-- Drop existing policies for documents table
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

-- Create new secure policies for documents table
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Drop existing policies for document_chunks table
DROP POLICY IF EXISTS "Users can view their own document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can insert their own document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can update their own document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can delete their own document chunks" ON public.document_chunks;

-- Create new secure policies for document_chunks table
CREATE POLICY "Users can view their own document chunks" 
ON public.document_chunks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document chunks" 
ON public.document_chunks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document chunks" 
ON public.document_chunks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document chunks" 
ON public.document_chunks 
FOR DELETE 
USING (auth.uid() = user_id);