import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, userId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing document:', documentId);

    // Get document from database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Update processing status
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file');
    }

    // Extract text content based on file type
    let textContent = '';
    
    if (document.file_type?.includes('text') || document.file_type?.includes('plain')) {
      textContent = await fileData.text();
    } else if (document.file_type?.includes('pdf')) {
      // For PDF processing, we'll need a more sophisticated approach
      // For now, just handle text files and add PDF processing later
      textContent = await fileData.text();
    } else {
      // Try to read as text anyway
      textContent = await fileData.text();
    }

    // Chunk the text (simple approach - split by sentences with overlap)
    const chunks = chunkText(textContent, 800, 200); // 800 tokens with 200 overlap
    
    console.log(`Created ${chunks.length} chunks for document ${documentId}`);

    // Store chunks in database
    const chunkInserts = chunks.map((chunk, index) => ({
      document_id: documentId,
      user_id: userId,
      chunk_index: index,
      chunk_text: chunk,
      token_count: estimateTokenCount(chunk),
      pinecone_id: `${documentId}-chunk-${index}`
    }));

    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkInserts);

    if (chunksError) {
      console.error('Error inserting chunks:', chunksError);
      throw new Error('Failed to store chunks');
    }

    // Update document with chunk count and processing status
    await supabase
      .from('documents')
      .update({ 
        chunks_count: chunks.length,
        processing_status: 'chunked',
        embedding_status: 'pending'
      })
      .eq('id', documentId);

    console.log('Document processing completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      chunksCreated: chunks.length,
      message: 'Document processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update document status to failed if we have the documentId
    try {
      const { documentId } = await req.clone().json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId);
    } catch (e) {
      console.error('Failed to update document status:', e);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function chunkText(text: string, maxTokens: number, overlap: number): string[] {
  // Simple chunking by sentences with overlap
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  let tokenCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim() + '.';
    const sentenceTokens = estimateTokenCount(sentence);

    if (tokenCount + sentenceTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      
      // Create overlap by including last few sentences
      const overlapSentences = currentChunk.split(/[.!?]+/).slice(-2);
      currentChunk = overlapSentences.join('.') + '.' + sentence;
      tokenCount = estimateTokenCount(currentChunk);
    } else {
      currentChunk += ' ' + sentence;
      tokenCount += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}