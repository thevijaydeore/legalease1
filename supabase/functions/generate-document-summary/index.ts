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
          // Fall back to creating a summary based on the AI's text response
          summaryData = createFallbackSummary(content, document);
        }
      } else {
        console.log('No JSON structure found, creating fallback summary from AI response');
        // Create a fallback summary when AI returns explanatory text
        summaryData = createFallbackSummary(content, document);
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

// Helper function to create a fallback summary when AI response can't be parsed as JSON
function createFallbackSummary(aiResponseText: string, document: any) {
  console.log('Creating fallback summary from AI response text');
  
  // Check if AI indicated the document is unreadable or corrupted
  const isCorrupted = aiResponseText.toLowerCase().includes('corrupted') || 
                     aiResponseText.toLowerCase().includes('unreadable') || 
                     aiResponseText.toLowerCase().includes('cannot');
  
  if (isCorrupted) {
    return {
      key_clauses: [
        "Document processing issue detected",
        "Text extraction may be incomplete",
        "Manual review recommended",
        "Consider re-uploading document in a different format"
      ],
      risks: [
        {
          level: "High",
          description: "Document text extraction failed - content may be corrupted or unreadable. Legal analysis cannot be performed reliably."
        },
        {
          level: "Medium", 
          description: "Incomplete document analysis - key terms and clauses may be missing from review."
        }
      ],
      obligations: [
        "Verify document integrity and readability",
        "Consider converting document to text format",
        "Perform manual review of original document",
        "Re-upload document if text extraction fails"
      ],
      recommendations: [
        "Upload document in text format (.txt) or Word format (.docx) for better processing",
        "Ensure PDF is text-based rather than image-based",
        "Verify document is not password-protected or encrypted",
        "Contact support if processing issues persist",
        "Perform manual legal review as backup"
      ]
    };
  }
  
  // If AI provided some analysis but not in JSON format, create a basic summary
  return {
    key_clauses: [
      `Document type: ${document.file_type || 'Unknown'}`,
      `File size: ${Math.round(document.file_size / 1024)} KB`,
      "AI analysis provided in text format",
      "Manual review recommended for accuracy"
    ],
    risks: [
      {
        level: "Medium",
        description: "Automated analysis incomplete - structured summary could not be generated from document content."
      }
    ],
    obligations: [
      "Review original document manually",
      "Verify AI analysis accuracy",
      "Consider document format optimization"
    ],
    recommendations: [
      "Review the original document for complete analysis",
      "Consider uploading in a more compatible format",
      "Perform manual legal review for important documents",
      "Contact legal counsel for complex matters"
    ]
  };
}