import * as openai from '@/integrations/openai/client';
import * as dashscope from '@/integrations/dashscope/client';

export interface AIProvider {
  name: string;
  isConfigured(): boolean;
  chat(options: any): Promise<any>;
  chatStream(options: any): AsyncGenerator<string>;
  generateImage(options: any): Promise<any>;
  transcribe(audioBlob: Blob): Promise<any>;
  tts(text: string): Promise<Blob>;
}

// Provedor Único Legado AI (DeepSeek + DashScope)
export const LegadoAIProvider: AIProvider = {
  name: 'Legado AI (DeepSeek/DashScope)',
  isConfigured: () => {
    // Agora sempre assumimos que está configurado se as chaves existirem no .env
    const hasDeepSeek = !!import.meta.env.VITE_DEEPSEEK_API_KEY;
    const hasDashScope = !!import.meta.env.VITE_DASH_SCOPE_API_KEY;
    return hasDeepSeek || hasDashScope;
  },
  chat: async (options) => {
    // Se houver imagens no conteúdo, usamos Qwen-VL (DashScope)
    const hasImages = options.messages.some((m: any) => 
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image' || c.type === 'image_url')
    );

    if (hasImages) {
      const qwenMessages = options.messages.map((m: any) => {
        let content: any[] = [];
        if (Array.isArray(m.content)) {
          content = m.content.map(c => {
            if (c.type === 'text') return { text: c.text };
            if (c.type === 'image') return { image: `data:image/jpeg;base64,${c.data}` };
            if (c.type === 'image_url') {
              const data = c.image_url.url.split(',')[1];
              return { image: `data:image/jpeg;base64,${data}` };
            }
            return c;
          });
        } else {
          content = [{ text: m.content }];
        }
        return { role: m.role, content };
      });
      
      const response = await dashscope.createQwenVisionCompletion({
        messages: qwenMessages
      });

      const content = response.output?.choices?.[0]?.message?.content?.[0]?.text || '';
      return {
        choices: [{
          message: { content, role: 'assistant' }
        }]
      };
    }

    // DeepSeek para texto (compatível com OpenAI)
    const deepseekOptions = {
      ...options,
      model: 'deepseek-chat', 
      max_completion_tokens: options.max_output_tokens
    };
    return openai.createChatCompletion(deepseekOptions as any);
  },
  chatStream: (options) => {
    const deepseekOptions = {
      ...options,
      model: 'deepseek-chat',
      max_completion_tokens: options.max_output_tokens
    };
    return openai.createChatCompletionStream(deepseekOptions as any);
  },
  generateImage: async (options) => {
    const response = await dashscope.createWanxImage({
      prompt: options.prompt,
      size: '1024*1024',
      n: 1
    });

    const taskId = response.output?.task_id;
    console.log('[Wanx] Task ID iniciada:', taskId);
    if (!taskId) {
      console.error('[Wanx] Resposta sem taskId:', response);
      throw new Error('Falha ao iniciar geração de imagem Wanx.');
    }

    // Polling
    let taskStatus = 'PENDING';
    let finalOutput = null;
    let attempts = 0;
    while (taskStatus === 'PENDING' || taskStatus === 'RUNNING') {
      if (attempts > 60) throw new Error('Timeout na geração de imagem Wanx (120s).');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await dashscope.getTaskStatus(taskId);
      taskStatus = statusResponse?.output?.task_status;
      console.log(`[Wanx] Task ${taskId} status:`, taskStatus);
      
      if (taskStatus === 'SUCCEEDED') {
        finalOutput = statusResponse.output;
      } else if (taskStatus === 'FAILED') {
        console.error('[Wanx] Geração falhou:', statusResponse);
        throw new Error(`Geração Wanx falhou: ${statusResponse.output?.message || 'Erro desconhecido'}`);
      }
      attempts++;
    }

    if (!finalOutput || !finalOutput.results || finalOutput.results.length === 0) {
      throw new Error('Nenhum resultado retornado da Wanx.');
    }

    const imageUrl = finalOutput.results[0].url;
    console.log('[Wanx] Geração concluída. URL da imagem:', imageUrl);
    
    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Erro ao baixar imagem: ${imgRes.status}`);
      const blob = await imgRes.blob();
      console.log('[Wanx] Blob baixado com sucesso, convertendo para base64...');
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({
            data: [{ b64_json: base64 }],
            text: 'Imagem gerada via Alibaba Wanx 2.1 (Legado AI).'
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err: any) {
      console.error('[Wanx] Erro ao baixar ou converter imagem:', err);
      throw err;
    }
  },
  transcribe: async (audioBlob) => {
    return dashscope.createTranscription(audioBlob);
  },
  tts: async (text) => {
    // Migrado para DashScope (Sambert/CosyVoice)
    const audioContent = await dashscope.createTTS(text);
    return new Blob([audioContent], { type: 'audio/mp3' });
  },
};

export const getAIProvider = (): AIProvider => {
  return LegadoAIProvider;
};

// Funções de conveniência removidas ou simplificadas
export const isChinaMode = () => true; 
export const getAppRegion = () => 'china';
