import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract text from PDF - improved text cleaning
async function extractPdfText(pdfBuffer: Blob): Promise<string> {
  try {
    const arrayBuffer = await pdfBuffer.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let rawText = decoder.decode(arrayBuffer);
    
    // More aggressive PDF text cleaning
    let cleanText = rawText
      // Remove PDF structure markers and commands
      .replace(/<<[^>]*>>/g, ' ')
      .replace(/\/[A-Za-z]+\s*/g, ' ')
      .replace(/\b\d+\s+\d+\s+obj\b/g, ' ')
      .replace(/\bendobj\b/g, ' ')
      .replace(/\bstream\b[\s\S]*?\bendstream\b/g, ' ')
      .replace(/\bxref\b[\s\S]*?\btrailer\b/g, ' ')
      .replace(/%%[^%\n]*%%/g, ' ')
      // Remove control characters but keep line breaks
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      // Remove sequences of non-printable characters
      .replace(/[^\x20-\x7E\n\r\t]+/g, ' ')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract meaningful sentences (words with spaces)
    const sentences = cleanText.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => {
        // Keep sentences that have at least 3 words and reasonable length
        const words = s.split(/\s+/).filter(w => w.length > 2);
        return words.length >= 3 && s.length >= 20 && s.length <= 1000;
      });
    
    if (sentences.length === 0) {
      throw new Error('No readable sentences found in PDF');
    }
    
    const finalText = sentences.join('. ').trim();
    
    if (finalText.length < 100) {
      throw new Error('Extracted text is too short for meaningful analysis');
    }
    
    console.log(`Cleaned PDF text: ${finalText.substring(0, 200)}...`);
    return finalText;
    
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract readable text from PDF: ${error.message}. Please try uploading a text-based PDF or convert to a text file.`);
  }
}

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
    
    try {
      if (document.file_type?.includes('text') || document.file_type?.includes('plain')) {
        textContent = await fileData.text();
      } else if (document.file_type?.includes('pdf')) {
        console.log('Extracting text from PDF...');
        textContent = await extractPdfText(fileData);
      } else {
        // For other file types, try to read as text
        textContent = await fileData.text();
      }

      // Sanitize text content to remove null bytes and other problematic characters
      textContent = sanitizeText(textContent);
      
      console.log(`Extracted text length: ${textContent.length} characters`);
      
      if (!textContent || textContent.trim().length === 0) {
        throw new Error('No readable text content found in document');
      }
      
      if (textContent.length < 100) {
        throw new Error('Document content is too short for meaningful analysis (minimum 100 characters required)');
      }
    } catch (textError) {
      console.error('Error extracting text:', textError);
      throw new Error(`Failed to extract text from document: ${textError.message}`);
    }

    // Chunk the text (simple approach - split by sentences with overlap)
    const chunks = chunkText(textContent, 800, 200); // 800 tokens with 200 overlap
    
    console.log(`Created ${chunks.length} chunks for document ${documentId}`);

    // Store chunks in database
    const chunkInserts = chunks.map((chunk, index) => ({
      document_id: documentId,
      user_id: userId,
      chunk_index: index,
      chunk_text: sanitizeText(chunk), // Ensure chunks are sanitized too
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
    let docId = null;
    try {
      const requestBody = await req.json();
      docId = requestBody.documentId;
    } catch (parseError) {
      console.error('Could not parse request body for error handling:', parseError);
    }
    
    if (docId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('documents')
          .update({ processing_status: 'failed' })
          .eq('id', docId);
      } catch (e) {
        console.error('Failed to update document status:', e);
      }
    }

    // Return user-friendly error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Document processing failed. Please try again with a different file or contact support.',
      code: 'PROCESSING_FAILED'
    }), {
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

function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove null bytes and other problematic Unicode characters
  return text
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/\uFFFD/g, '') // Remove replacement characters
    .trim();
}

function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}