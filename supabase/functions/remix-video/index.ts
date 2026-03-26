const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId, prompt } = await req.json();
    console.log('Remix request:', { videoId, prompt });

    if (!videoId || !prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Video ID e prompt são obrigatórios' }),
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

    const formData = new FormData();
    formData.append('prompt', prompt.trim());

    console.log('Calling OpenAI remix API...');
    
    const response = await fetch(`https://api.openai.com/v1/videos/${videoId}/remix`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response body:', responseText);

    if (!response.ok) {
      let errorMessage = 'Erro ao remixar vídeo';
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('OpenAI error:', errorData);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          originalError: responseText,
          status: response.status
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = JSON.parse(responseText);
    console.log('Remix started:', data);

    return new Response(
      JSON.stringify({
        jobId: data.id,
        status: data.status || 'queued',
        remixed_from_video_id: videoId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in remix-video function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
