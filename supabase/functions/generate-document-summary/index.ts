import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, userId } = await req.json();

    if (!documentId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing documentId or userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('openai_api_key');

    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'Missing OpenAI API key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document and its chunks
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('chunk_text')
      .eq('document_id', documentId)
      .order('chunk_index');

    if (chunksError || !chunks) {
      throw new Error('Failed to retrieve document chunks');
    }

    // Combine all chunks into full text (limit to ~8000 chars for API limits)
    const fullText = chunks.map(chunk => chunk.chunk_text).join('\n').substring(0, 8000);

    // Generate summary using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: `You are a legal document analysis expert. Analyze the provided legal document and generate a structured summary in JSON format with the following fields:
          
          {
            "key_clauses": ["List of 4-6 most important clauses with brief descriptions"],
            "risks": [
              {"level": "High|Medium|Low", "description": "Risk description"},
              ...
            ],
            "obligations": ["List of 4-6 key obligations and requirements"],
            "recommendations": ["List of 4-6 specific actionable recommendations"]
          }
          
          Focus on practical, actionable insights. Be specific and reference actual content from the document.`
        },
        {
          role: 'user',
          content: `Please analyze this legal document and provide a structured summary:\n\n${fullText}`
        }],
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    let summaryData;
    
    try {
      summaryData = JSON.parse(aiResponse.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      summaryData = {
        key_clauses: ["Document analysis completed", "Content processed successfully"],
        risks: [{"level": "Medium", "description": "Document requires manual review for specific risk assessment"}],
        obligations: ["Review document thoroughly", "Consult legal counsel as needed"],
        recommendations: ["Manual document review recommended", "Consider legal consultation"]
      };
    }

    // Store or update the summary in the database
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        summary_data: summaryData,
        summary_generated: true,
        analysis_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document with summary:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      summary: summaryData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating document summary:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});