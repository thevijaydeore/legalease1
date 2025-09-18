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
    const { query, userId, conversationHistory = [] } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const pineconeApiKey = Deno.env.get('PINECONE_API_KEY');

    if (!openaiApiKey || !pineconeApiKey) {
      throw new Error('Missing required API keys');
    }

    console.log('Processing RAG query:', query);

    // Step 1: Generate embedding for the query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float'
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Step 2: Search Pinecone for relevant chunks
    const pineconeIndexUrl = 'https://your-index-name-project-id.svc.gcp-starter.pinecone.io'; // Replace with your actual index URL
    
    const searchResponse = await fetch(`${pineconeIndexUrl}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pineconeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        namespace: userId,
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
        includeValues: false
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Pinecone search error: ${searchResponse.statusText}`);
    }

    const searchResults = await searchResponse.json();
    const relevantChunks = searchResults.matches || [];

    console.log(`Found ${relevantChunks.length} relevant chunks`);

    // Step 3: Prepare context from retrieved chunks
    const context = relevantChunks
      .filter((match: any) => match.score > 0.7) // Filter by relevance score
      .map((match: any, index: number) => {
        const metadata = match.metadata;
        return `[Document: ${metadata.document_title}]\n${metadata.chunk_text}`;
      })
      .join('\n\n---\n\n');

    if (!context) {
      return new Response(JSON.stringify({
        answer: "I couldn't find any relevant information in your documents to answer that question. Please try rephrasing your query or upload more relevant documents.",
        sources: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 4: Generate response using GPT with context
    const systemPrompt = `You are a helpful AI assistant that answers questions based on the user's uploaded documents. Use only the information provided in the context to answer questions. If the context doesn't contain enough information to answer the question, say so clearly.

Context from user's documents:
${context}

Guidelines:
- Only use information from the provided context
- Be specific and cite which documents you're referencing
- If the context doesn't contain relevant information, say so
- Provide direct quotes when helpful
- Be concise but thorough`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: query }
    ];

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`OpenAI chat error: ${chatResponse.statusText}`);
    }

    const chatData = await chatResponse.json();
    const answer = chatData.choices[0].message.content;

    // Prepare sources information
    const sources = relevantChunks
      .filter((match: any) => match.score > 0.7)
      .map((match: any) => ({
        document_title: match.metadata.document_title,
        chunk_text: match.metadata.chunk_text.substring(0, 200) + '...',
        score: match.score,
        document_id: match.metadata.document_id
      }));

    console.log('RAG response generated successfully');

    return new Response(JSON.stringify({
      answer,
      sources,
      query
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat with documents:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});