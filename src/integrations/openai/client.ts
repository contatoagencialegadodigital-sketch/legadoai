// OpenAI API Client (Hardcoded for DeepSeek in Legado AI)
// Este cliente atua como um wrapper para a API do DeepSeek e outras compatíveis.

// Use DeepSeek Key for domestic stack (Legado AI)
const OPENAI_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const OPENAI_BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

// Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | any[];
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_completion_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finish_reason: string;
  }[];
}

// Build headers
function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  };
}

// Base request function
async function openaiRequest<T>(endpoint: string, body: unknown): Promise<T> {
  if (!OPENAI_API_KEY) {
    throw new Error('Chave API (DeepSeek) não configurada no arquivo .env');
  }

  const response = await fetch(`${OPENAI_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `Erro ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// Chat API
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  return openaiRequest<ChatCompletionResponse>('/chat/completions', {
    model: options.model || 'deepseek-chat',
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_completion_tokens ?? 2000,
  });
}

// Streaming Chat API
export async function* createChatCompletionStream(
  options: ChatCompletionOptions
): AsyncGenerator<string> {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: options.model || 'deepseek-chat',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_completion_tokens ?? 2000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro Stream ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Falha ao obter stream reader.');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
      
      if (trimmedLine.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmedLine.slice(6));
          const content = json.choices[0]?.delta?.content || '';
          if (content) yield content;
        } catch (e) {
          // Chunk parcial, ignora
        }
      }
    }
  }
}

// Legacies (Manteve stubs para evitar erros de importação em outros arquivos se houver)
export async function createTranscription(options: { audioBlob: Blob }) {
  // DeepSeek não suporta Whisper nativamente ainda, mas o endpoint pode ser compatível se for proxy
  return { text: "[Transcrição não disponível no motor DeepSeek puro]" };
}

export async function createSpeech(options: { input: string }): Promise<Blob> {
  throw new Error('TTS não disponível no motor DeepSeek puro.');
}

export const isOpenAIConfigured = () => !!OPENAI_API_KEY;
