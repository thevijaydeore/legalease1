-- Update RLS policies for documents table to allow guest user
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;  
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

-- Allow authenticated users and guest user for documents table
CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR 
    (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  );

CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  );

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (
    (auth.uid() = user_id) OR 
    (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  );

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (
    (auth.uid() = user_id) OR 
    (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  );

-- Update storage policies for documents bucket to allow guest user
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents in storage" ON storage.objects;

-- Allow authenticated users and guest user for storage
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND (
      (auth.uid())::text = (storage.foldername(name))[1] OR
      (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
    )
  );

CREATE POLICY "Users can view their own documents in storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND (
      (auth.uid())::text = (storage.foldername(name))[1] OR
      (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
    )
  );

CREATE POLICY "Users can update their own documents in storage" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND (
      (auth.uid())::text = (storage.foldername(name))[1] OR
      (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
    )
  );

CREATE POLICY "Users can delete their own documents in storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND (
      (auth.uid())::text = (storage.foldername(name))[1] OR
      (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
    )
  );