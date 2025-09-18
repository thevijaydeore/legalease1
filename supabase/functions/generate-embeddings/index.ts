import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const pineconeApiKey = Deno.env.get('PINECONE_API_KEY');

    if (!openaiApiKey || !pineconeApiKey) {
      throw new Error('Missing required API keys');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating embeddings for document:', documentId);

    // Get document chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index');

    if (chunksError || !chunks) {
      throw new Error('Failed to retrieve document chunks');
    }

    // Update embedding status
    await supabase
      .from('documents')
      .update({ embedding_status: 'processing' })
      .eq('id', documentId);

    // Get document metadata for Pinecone
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    // Generate embeddings for each chunk
    const vectors = [];
    
    for (const chunk of chunks) {
      console.log(`Processing chunk ${chunk.chunk_index + 1}/${chunks.length}`);
      
      // Generate embedding using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunk.chunk_text,
          encoding_format: 'float'
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`OpenAI API error: ${embeddingResponse.statusText}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Prepare vector for Pinecone
      vectors.push({
        id: chunk.pinecone_id,
        values: embedding,
        metadata: {
          document_id: documentId,
          user_id: userId,
          chunk_index: chunk.chunk_index,
          chunk_text: chunk.chunk_text.substring(0, 1000), // Pinecone metadata limit
          document_title: document?.title || 'Untitled',
          file_type: document?.file_type || 'unknown',
          created_at: chunk.created_at
        }
      });
    }

    // Get Pinecone configuration from environment
    const pineconeIndexUrl = Deno.env.get('PINECONE_INDEX_URL') || 'https://your-index-name-project-id.svc.gcp-starter.pinecone.io';
    
    console.log('Using Pinecone URL:', pineconeIndexUrl);
    
    const pineconeResponse = await fetch(`${pineconeIndexUrl}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pineconeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: vectors,
        namespace: userId // Use userId as namespace for isolation
      }),
    });

    if (!pineconeResponse.ok) {
      const errorText = await pineconeResponse.text();
      console.error('Pinecone error:', errorText);
      throw new Error(`Pinecone API error: ${pineconeResponse.statusText}`);
    }

    // Update document embedding status
    await supabase
      .from('documents')
      .update({ 
        embedding_status: 'completed',
        processing_status: 'ready'
      })
      .eq('id', documentId);

    console.log('Embeddings generated and stored successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      vectorsCreated: vectors.length,
      message: 'Embeddings generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating embeddings:', error);
    
    // Update document status to failed
    try {
      const { documentId } = await req.clone().json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('documents')
        .update({ embedding_status: 'failed' })
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