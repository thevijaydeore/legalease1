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
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Cleaning up and reprocessing document: ${documentId}`);

    // Delete existing chunks
    const { error: deleteError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) {
      console.error('Error deleting chunks:', deleteError);
    }

    // Reset document status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        processing_status: 'pending',
        embedding_status: 'pending',
        chunks_count: 0,
        analysis_status: 'pending',
        summary_generated: false,
        summary_data: null
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document:', updateError);
      throw new Error('Failed to reset document status');
    }

    // Trigger reprocessing
    const { error: processError } = await supabase.functions.invoke('process-document', {
      body: { documentId, userId }
    });

    if (processError) {
      console.error('Error triggering reprocessing:', processError);
      throw new Error('Failed to trigger document reprocessing');
    }

    console.log('Document cleanup and reprocessing triggered successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Document cleanup and reprocessing started'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cleanup-and-reprocess:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});