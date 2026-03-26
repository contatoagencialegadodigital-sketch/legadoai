const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId } = await req.json();
    console.log('Checking status for job:', jobId);

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID é obrigatório' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Configuração inválida do servidor' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching job status from OpenAI...');
    const statusResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
    });

    const statusText = await statusResponse.text();
    console.log('Status response:', statusResponse.status, statusText);

    if (!statusResponse.ok) {
      console.error('Error fetching status:', statusText);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao verificar status',
          status: 'failed',
          progress: 0
        }),
        { 
          status: statusResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const statusData = JSON.parse(statusText);
    console.log('Job status:', statusData.status);

    if (statusData.status === 'completed') {
      console.log('Video completed, fetching content...');
      
      const contentResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}/content`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
      });

      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();
        console.error('Error fetching video content:', errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao baixar vídeo',
            status: 'failed',
            progress: 0
          }),
          { 
            status: contentResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Converting video to base64...');
      const videoBlob = await contentResponse.blob();
      const arrayBuffer = await videoBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const videoUrl = `data:video/mp4;base64,${base64}`;

      console.log('Video converted successfully, size:', base64.length);

      return new Response(
        JSON.stringify({
          status: 'completed',
          videoUrl,
          progress: 100,
          error: null,
          errorCode: null,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else if (statusData.status === 'failed') {
      console.error('Video generation failed:', statusData.error);
      
      const errorMessage = statusData.error?.message || 'Erro desconhecido';
      const errorCode = statusData.error?.code || statusData.error?.type || null;

      return new Response(
        JSON.stringify({
          status: 'failed',
          videoUrl: null,
          progress: 0,
          error: errorMessage,
          errorCode: errorCode,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const progress = statusData.status === 'queued' ? 10 : 45;
      
      return new Response(
        JSON.stringify({
          status: statusData.status,
          videoUrl: null,
          progress,
          error: null,
          errorCode: null,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error: any) {
    console.error('Error in check-video-status function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        status: 'failed',
        progress: 0,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
