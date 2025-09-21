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
    console.log(`Starting summary generation for document: ${documentId}, user: ${userId}`);

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
      console.error('Document fetch error:', docError);
      throw new Error('Document not found');
    }
    
    console.log(`Found document: ${document.title}`);

    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('chunk_text')
      .eq('document_id', documentId)
      .order('chunk_index');

    if (chunksError || !chunks) {
      console.error('Chunks fetch error:', chunksError);
      throw new Error('Failed to retrieve document chunks');
    }
    
    console.log(`Found ${chunks.length} chunks for document`);

    // Combine all chunks into full text (limit to ~8000 chars for API limits)
    const fullText = chunks.map(chunk => chunk.chunk_text).join('\n').substring(0, 8000);
    
    console.log(`Full text length: ${fullText.length} characters`);
    
    if (fullText.length < 100) {
      console.error('Document text too short for analysis:', fullText.length);
      throw new Error('Document content is too short for meaningful analysis');
    }

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
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    console.log('OpenAI API response received successfully');

    const aiResponse = await response.json();
    let summaryData;
    
    console.log('Raw AI response:', aiResponse.choices[0].message.content);
    
    try {
      summaryData = JSON.parse(aiResponse.choices[0].message.content);
      console.log('Successfully parsed AI response to JSON');
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw content was:', aiResponse.choices[0].message.content);
      
      // Try to extract JSON from the response if it's wrapped in markdown
      const content = aiResponse.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          summaryData = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted and parsed JSON from markdown');
        } catch (extractError) {
          console.error('Failed to parse extracted JSON:', extractError);
          throw new Error('Failed to parse AI response - invalid JSON format');
        }
      } else {
        console.error('No JSON structure found in AI response');
        throw new Error('AI response does not contain valid JSON structure');
      }
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
      throw new Error('Failed to save summary to database');
    }
    
    console.log('Summary successfully generated and saved to database');

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