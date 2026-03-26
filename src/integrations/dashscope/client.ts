// Alibaba Cloud DashScope API Client (Qwen)
// Used for Vision and Image Generation in China Mode

const DASHSCOPE_API_KEY = import.meta.env.VITE_DASH_SCOPE_API_KEY;
const DASHSCOPE_BASE_URL = '/dashscope-api/api/v1';

export interface QwenVisionOptions {
  model?: string;
  messages: any[];
}

export interface QwenImageOptions {
  model?: string;
  prompt: string;
  n?: number;
  size?: string;
}

async function dashscopeRequest<T>(endpoint: string, body: unknown): Promise<T> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('VITE_DASH_SCOPE_API_KEY não configurada.');
  }

  const maskedKey = DASHSCOPE_API_KEY.slice(0, 6) + '...' + DASHSCOPE_API_KEY.slice(-4);
  console.log(`[DashScope] Fetching ${endpoint} using key: ${maskedKey}`);

  const response = await fetch(`${DASHSCOPE_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
      'X-DashScope-SSE': 'disable'
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro DashScope ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Qwen-VL for Vision
export async function createQwenVisionCompletion(options: QwenVisionOptions): Promise<any> {
  const body = {
    model: options.model || 'qwen-vl-plus',
    input: {
      messages: options.messages
    },
    parameters: {
      result_format: 'message'
    }
  };

  return dashscopeRequest('/services/aigc/multimodal-generation/generation', body);
}

// Wanx for Image Generation
export async function createWanxImage(options: QwenImageOptions): Promise<any> {
  const body = {
    model: options.model || 'wanx-2.1',
    input: {
      prompt: options.prompt
    },
    parameters: {
      n: options.n || 1,
      size: options.size || '1024*1024'
    }
  };

  return dashscopeRequest('/services/aigc/text2image/image-synthesis', body);
}

export async function getTaskStatus(taskId: string): Promise<any> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('VITE_DASH_SCOPE_API_KEY não configurada.');
  }

  const response = await fetch(`${DASHSCOPE_BASE_URL}/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'X-DashScope-ApiKey': DASHSCOPE_API_KEY || ''
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro DashScope Task ${response.status}`);
  }

  return response.json() as Promise<any>;
}

// Qwen3-TTS (High Reliability with Fallback)
export async function createTTS(text: string): Promise<ArrayBuffer> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('VITE_DASH_SCOPE_API_KEY não configurada.');
  }

  try {
    // Tenta primeiro o Qwen3-TTS-Flash (Internacional OpenAI-compatible)
    const response = await fetch('/dashscope-compatible/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen3-tts-flash',
        input: text,
        voice: 'gentle', 
        response_format: 'mp3'
      }),
    });

    if (response.ok) return response.arrayBuffer();
    
    // Fallback: Sambert (Native DashScope API)
    const fallbackResponse = await fetch('/dashscope-api/api/v1/services/audio/tts/synthesis', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'X-DashScope-ApiKey': DASHSCOPE_API_KEY || '',
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      },
      body: JSON.stringify({
        model: 'sambert-v1',
        input: { text },
        parameters: { volume: 50, sample_rate: 16000, format: 'mp3' }
      }),
    });

    if (fallbackResponse.ok) return fallbackResponse.arrayBuffer();
    
    const errorData = await fallbackResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro DashScope TTS ${fallbackResponse.status}`);
  } catch (error) {
    console.error('[DashScope TTS Error]', error);
    throw error;
  }
}

// Qwen-ASR for Transcription
export async function createTranscription(audioBlob: Blob): Promise<string> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('VITE_DASH_SCOPE_API_KEY não configurada.');
  }

  // Nota: Transcrição via DashScope geralmente requer upload prévio para OSS ou multipart
  // Para simplificar, assumimos que o backend ou o proxy lida com isso, ou enviamos base64
  // Como fallback de desenvolvimento, retornamos um erro claro se precisar de infra extra
  throw new Error('Transcrição via DashScope requer configuração de Bucket OSS ou suporte a multipart via Proxy.');
}

export const isDashScopeConfigured = () => !!DASHSCOPE_API_KEY;
