import { useState, useCallback } from 'react';
import { createChatCompletion, ChatMessage, isOpenAIConfigured } from '@/integrations/openai/client';
import { useToast } from '@/hooks/use-toast';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const SYSTEM_PROMPT = `Você é um assistente especializado em comunicação política e criação de textos estratégicos. 

Suas principais capacidades:
- Criar discursos políticos persuasivos
- Desenvolver posts para redes sociais engajadores
- Redigir releases e notas oficiais
- Analisar e melhorar textos existentes
- Criar narrativas consistentes para campanhas

Diretrizes:
- Mantenha tom profissional mas acessível
- Adapte o estilo ao público-alvo
- Seja claro, conciso e persuasivo
- Evite linguagem excessivamente técnica
- Respeite princípios éticos de comunicação`;

export const useOpenAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string) => {
    // Verificar se OpenAI está configurada
    if (!isOpenAIConfigured()) {
      toast({
        title: '⚠️ API OpenAI não configurada',
        description: 'Adicione sua VITE_OPENAI_API_KEY no arquivo .env',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Add user message locally
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Prepare messages for API
      const apiMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content },
      ];

      // Call OpenAI API
      const response = await createChatCompletion({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.7,
        max_completion_tokens: 2000,
      });

      const assistantContent = (response.choices[0]?.message?.content as string) || 'Desculpe, não consegui gerar uma resposta.';

      // Add assistant response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);

      let errorMessage = error.message || 'Erro desconhecido';

      // Tratamento de erros específicos
      if (errorMessage.includes('401')) {
        errorMessage = 'Chave API inválida. Verifique sua VITE_OPENAI_API_KEY.';
      } else if (errorMessage.includes('429')) {
        errorMessage = 'Muitas requisições. Aguarde um momento antes de tentar novamente.';
      } else if (errorMessage.includes('insufficient_quota')) {
        errorMessage = 'Cota da API excedida. Verifique seu saldo na OpenAI.';
      }

      toast({
        title: 'Erro ao enviar mensagem',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};
