const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, duration, quality } = await req.json();
    console.log('Received request:', { prompt, duration, quality });

    if (!prompt || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt é obrigatório' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const validDurations = ['4', '8', '12'];
    if (!validDurations.includes(duration)) {
      return new Response(
        JSON.stringify({ error: 'Duração inválida. Use 4, 8 ou 12 segundos.' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const sizeMap: Record<string, string> = {
      'sd': '720x1280',
      'hd': '1024x1792',
      'landscape_sd': '1280x720',
      'landscape_hd': '1792x1024',
    };

    const finalSize = sizeMap[quality] || '1792x1024';
    const seconds = parseInt(duration);

    console.log('Mapped parameters:', { size: finalSize, seconds });

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
    formData.append('model', 'sora-2-pro');
    formData.append('size', finalSize);
    formData.append('seconds', seconds.toString());

    console.log('Calling OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/videos', {
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
      let errorMessage = 'Erro ao gerar vídeo';
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('OpenAI error:', errorData);
        
        if (response.status === 500) {
          errorMessage = '⚠️ Erro temporário da API Sora 2. Tente novamente em alguns minutos ou simplifique seu prompt.';
        } else if (response.status === 429) {
          errorMessage = '⏱️ Muitas requisições. Aguarde alguns minutos e tente novamente.';
        } else if (response.status === 503) {
          errorMessage = '🔧 API Sora 2 em manutenção. Tente novamente mais tarde.';
        } else if (errorData.error?.type === 'content_policy_violation') {
          errorMessage = '🚫 Conteúdo bloqueado pela política de moderação.';
        } else {
          errorMessage = errorData.error?.message || errorMessage;
        }
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
    console.log('Video generation started:', data);

    return new Response(
      JSON.stringify({
        jobId: data.id,
        status: data.status || 'queued',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-video function:', error);
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
