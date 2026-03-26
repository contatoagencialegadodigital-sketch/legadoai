import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, Loader2, Copy, Image as ImageIcon, Download, Trash2, Volume2, Square } from 'lucide-react';
import { isOpenAIConfigured } from '@/integrations/openai/client';
import { getAIProvider } from '@/lib/aiProvider';
import { VoiceInput } from '@/components/VoiceInput';
import { TranslatorModeUI } from '@/components/TranslatorModeUI';
import { FileUploadButton, useFileUpload, SelectedFilesList, UploadedFile } from '@/components/FileUploadButton';
import LoaderOne from '@/components/LoaderOne';
import { extractTextFromPdf, processImageFile } from '@/lib/pdfProcessor';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSavedChats } from '@/hooks/useSavedChats';
import { useImageGallery } from '@/hooks/useImageGallery';
import { useTranslatorMode } from '@/hooks/useTranslatorMode';
import { useCharacterLibrary } from '@/hooks/useCharacterLibrary';
import legadoLogo from '@/assets/legado-logo.png';

// Suggestion chips
const suggestions = [
  "Crie um discurso político sobre educação",
  "Gere uma imagem de um discurso político em um auditório",
  "Analise este documento PDF e faça um resumo",
  "Transcreva este áudio para texto",
  "Descreva o que há nesta imagem",
];

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const {
    chats,
    getCurrentChat,
    createNewChat,
    updateChatMessages,
    loadChat,
    currentChatId
  } = useSavedChats();
  const { addImage, downloadImage } = useImageGallery();
  const { isTranslatorMode } = useTranslatorMode();
  const { characters, findCharactersInPrompt } = useCharacterLibrary();
  const { selectedFiles, addFiles, removeFile, clearFiles } = useFileUpload();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Audio playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    imageUrl?: string;
    imagePrompt?: string;
    fileName?: string;
  }>>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastLoadedChatId = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat from URL
  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId) {
      loadChat(chatId);

      if (chatId !== lastLoadedChatId.current) {
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
          setMessages(chat.messages);
          lastLoadedChatId.current = chatId;
        } else if (chats.length > 0) {
          setMessages([]);
          lastLoadedChatId.current = chatId;
        }
      }
    } else {
      // Evita criar dezenas de chats vazios: procura se já existe um chat vazio primeiro
      const emptyChat = chats.find(c => c.messages.length === 0);
      if (emptyChat) {
        setSearchParams({ chat: emptyChat.id }, { replace: true });
      } else {
        const newChatId = createNewChat();
        setSearchParams({ chat: newChatId }, { replace: true });
      }
    }
  }, [searchParams.get('chat'), chats, setSearchParams]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Save messages when they change
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      updateChatMessages(currentChatId, messages);
    }
  }, [messages, currentChatId]);

  const processImageFile = async (file: File, prompt: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const audioCacheRef = useRef<Record<string, string>>({}); // Cache [messageId: string] -> local object URL

  const handlePlayAudio = async (messageId: string, text: string) => {
    // Se o mesmo áudio já estiver tocando, stop it.
    if (playingMessageId === messageId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingMessageId(null);
      return;
    }

    // Se houver outro tocando, para.
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      setPlayingMessageId(messageId); // Marca como tocando (mostrando state visual de loading)

      let url = audioCacheRef.current[messageId];

      if (!url) {
        // Mudado de 'opus' para 'mp3' para compatibilidade universal (especialmente iOS)
        const provider = getAIProvider();
        const audioBlob = await provider.tts(text);

        url = URL.createObjectURL(audioBlob);
        audioCacheRef.current[messageId] = url; // Cache the URL
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingMessageId(null);
      };

      await audio.play();

    } catch (error: any) {
      console.error('Error playing audio:', error);
      toast({
        title: "Erro no áudio",
        description: `Não foi possível reproduzir: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
      setPlayingMessageId(null);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;
  
    const provider = getAIProvider();
  
    if (!provider.isConfigured()) {
      toast({
        title: `⚠️ API ${provider.name} não configurada`,
        description: `Verifique as chaves de API para ${provider.name} no arquivo .env`,
        variant: "destructive",
      });
      return;
    }

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const newUserMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: userMessage || (selectedFiles.length > 0 ? `Arquivos anexados: ${selectedFiles.map(f => f.file.name).join(', ')}` : ''),
      timestamp: Date.now(),
      fileName: selectedFiles.length > 0 ? selectedFiles[0].file.name : undefined,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const imageFiles = selectedFiles.filter(f => f.type === 'image');
      const audioFiles = selectedFiles.filter(f => f.type === 'audio' || f.type === 'video');
      const documentFiles = selectedFiles.filter(f => f.type === 'document');

      let fileContent = '';
      let hasFileContent = false;

      // Processar áudio/vídeo para transcrição
      if (audioFiles.length > 0) {
        for (const audioFile of audioFiles) {
          try {
            const transcription = await provider.transcribe(audioFile.file);
            const detectedLanguage = transcription.language || 'desconhecido';
            fileContent += `\n\n[Transcrição do arquivo "${audioFile.file.name}" | Idioma nativo detectado: ${detectedLanguage}]:\n${transcription.text}`;
            hasFileContent = true;
          } catch (error) {
            console.error('Erro na transcrição:', error);
            fileContent += `\n\n[Erro ao transcrever "${audioFile.file.name}"]`;
          }
        }
      }

      // Processar documentos - PDF com OCR, outros como texto
      if (documentFiles.length > 0) {
        for (const docFile of documentFiles) {
          try {
            if (docFile.file.type === 'application/pdf') {
              // PDF - usar OCR com GPT-4o Vision
              toast({
                title: 'Processando PDF...',
                description: 'Extraindo texto com OCR. Isso pode levar alguns segundos.',
              });

              const { text, pages, usedOcr } = await extractTextFromPdf(docFile.file);
              fileContent += `\n\n[Conteúdo do PDF "${docFile.file.name}" (${pages} página(s)${usedOcr ? ' - OCR' : ''})]:\n${text.slice(0, 15000)}${text.length > 15000 ? '... (texto truncado)' : ''}`;
              hasFileContent = true;
            } else {
              // Outros documentos - ler como texto
              const text = await docFile.file.text();
              fileContent += `\n\n[Conteúdo do arquivo "${docFile.file.name}"]:\n${text.slice(0, 10000)}${text.length > 10000 ? '... (texto truncado)' : ''}`;
              hasFileContent = true;
            }
          } catch (error: any) {
            console.error('Erro detalhado ao processar documento:', error);
            toast({
              title: 'Erro ao processar documento',
              description: error?.message || 'Não foi possível extrair o texto do arquivo. Tente novamente ou use outro formato.',
              variant: 'destructive',
            });
            // Continua mesmo com erro para não travar o chat
          }
        }
      }

      // Check if user wants to generate or EDIT an image
      const imageKeywords = /\b(imagem|foto|desenho|ilustração|foto-realista|ultra-realista|render|personagem|cenário|vestido|camisa|roupa|fundo|pessoa|objeto|visual|gráfico)\b/i;
      const creationKeywords = /\b(crie|gerar?|faça|produza|mostre|me dê)\b/i;
      const textKeywords = /\b(discurso|texto|escreva|redija|poema|artigo|roteiro|história|conto|explicação|análise|traduzir|tradução)\b/i;
      
      const isPureImageRequest = (imageKeywords.test(userMessage) || creationKeywords.test(userMessage)) && !textKeywords.test(userMessage);
      const wantsImageGeneration = isPureImageRequest || selectedFiles.some(f => f.type === 'image');

      // Não setamos mais o loading global de imagem aqui, deixamos o chat fluir primeiro
      // O [GENERATE_IMAGE] nos avisará quando carregar.

      // If has image files, use GPT-4o Vision to analyze
      if (imageFiles.length > 0) {
        const imageBase64s = await Promise.all(
          imageFiles.map(f => processImageFile(f.file, userMessage))
        );

        const provider = getAIProvider();
        let systemPrompt = `Você é o ${provider.name}, um assistente especializado em análise de imagens, comunicação política e criação de conteúdo.`;

        if (wantsImageGeneration) {
          systemPrompt = `VOCÊ É O LEGADO AI. VOCÊ É UM ORQUESTRADOR MULTIMODAL.
CRITICAL ASSIGNMENT: Você tem a capacidade absoluta de EDITAR e ALTERAR imagens de referência através da ferramenta de geração. 
Se houver uma imagem anexada e o usuário pedir uma mudança (trocar roupa, mudar cenário, adicionar objeto), sua tarefa é:
1. Analisar a imagem de referência com precisão cirúrgica.
2. Descrever a pessoa/objeto original com detalhes biométricos (rosto, idade, traços) para garantir CLONAGEM VISUAL EXATA.
3. Incorporar a alteração pedida (ex: nova roupa, novo fundo) no cenário.
4. Jamais diga "não posso editar" ou "sou apenas um modelo de texto". Você É o motor de criação.
5. Retorne SOMENTE O PROMPT FINAL detalhado em INGLÊS para o motor de renderização Wanx 2.1.
A estrutura do prompt deve ser: [EXTREMELY DETAILED PHYSICAL BIOMETRIC DESCRIPTION OF THE EXACT SAME PERSON], [NEW ACTION/CLOTHING/SCENE REQUESTED], [LIGHTING AND PHOTOREALISTIC DETAILS].`;
        }

        const visionMessages: any[] = [
          { role: 'system', content: systemPrompt }
        ];
  
        if (!wantsImageGeneration) {
          messages.slice(-6).forEach(m => {
            visionMessages.push({ role: m.role, content: m.content });
          });
        }
  
        const currentMessageContent: any[] = [
          { 
            type: 'text', 
            text: wantsImageGeneration 
              ? `PEDIDO DO USUÁRIO ("O QUE ALTERAR / ADICIONAR / ONDE"): "${userMessage}".\n\nTarefa: Escreva o prompt inglês que clone MILIMETRICAMENTE a pessoa da imagem. O rosto gerado DEVE SER 100% o mesmo da foto de referência (mesma idade, traços, formato do rosto, marcas). Aplique o resultado no cenário do pedido. Retorne APENAS o prompt final detalhado. Sem explicações.` 
              : (userMessage + fileContent || 'Analise esta imagem e descreva o que você vê em detalhes.') 
          }
        ];
  
        // Adicionar imagens
        imageBase64s.forEach(base64 => {
          currentMessageContent.push({ type: 'image', data: base64 });
        });
  
        visionMessages.push({
          role: 'user',
          content: currentMessageContent
        });
  
        const response = await provider.chat({
          messages: visionMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: Array.isArray(m.content) 
              ? m.content.map(c => {
                  if (c.type === 'text') return { text: c.text }; // Google client expects {text: '...'} inside parts
                  if (c.type === 'image_url') {
                    const data = c.image_url.url.split(',')[1];
                    return { type: 'image', data, mimeType: 'image/jpeg' }; 
                  }
                  return c;
                })
              : m.content as string
          })),
          temperature: 0.7,
        });

        const assistantContent = response.choices?.[0]?.message?.content || 'Não consegui analisar a imagem.';

        if (wantsImageGeneration) {
          // Detectar se algum personagem da biblioteca foi mencionado
          const detectedChars = findCharactersInPrompt(userMessage);
          const characterPhotos = detectedChars.flatMap(c => c.photos.map(p => ({
            data: p.includes('base64,') ? p.split('base64,')[1] : p,
            mimeType: 'image/jpeg'
          })));

          // Mostrar toast se personagens foram detectados
          if (detectedChars.length > 0) {
            toast({
              title: "Identidade Detectada",
              description: `Injetando referências de: ${detectedChars.map(c => c.name).join(', ')}`,
            });
          }

          // Usamos a descrição detalhada do Qwen-VL como o prompt para o Wanx 2.1
          const finalImagePrompt = assistantContent;

          const imageResponse = await provider.generateImage({
            prompt: finalImagePrompt,
            n: 1,
            image_size: '2K',
            reference_images: [
              ...characterPhotos, 
              ...imageBase64s.map(data => ({
                data,
                mimeType: 'image/jpeg'
              }))
            ]
          });

          const responseData = imageResponse.data?.[0];
          const imageUrl = responseData?.b64_json ? `data:image/png;base64,${responseData.b64_json}` : undefined;
          const assistantText = imageResponse.text || 'Aqui está a imagem baseada na sua referência:';

          if (imageUrl) {
            const galleryImage = addImage({
              url: imageUrl,
              prompt: userMessage,
              format: '2K',
            });

            setMessages(prev => [...prev, {
              id: `msg_${Date.now()}_img`,
              role: 'assistant' as const,
              content: assistantText,
              timestamp: Date.now(),
              imageUrl,
              imagePrompt: userMessage,
            }]);
          } else {
            setMessages(prev => [...prev, {
              id: `msg_${Date.now()}_err`,
              role: 'assistant' as const,
              content: `Parece que a imagem de saída retornou vazia da API do ${provider.name}.`,
              timestamp: Date.now(),
            }]);
          }
        } else {
          setMessages(prev => [...prev, {
            id: `msg_${Date.now()}_vision`,
            role: 'assistant' as const,
            content: assistantContent,
            timestamp: Date.now(),
          }]);
        }
      }
      // Direct Image Generation (for pure image requests)
      else if (isPureImageRequest && !hasFileContent) {
        setIsGeneratingImage(true);
        try {
          const detectedChars = findCharactersInPrompt(userMessage);
          const characterPhotos = detectedChars.flatMap(c => c.photos.map(p => ({
            data: p.includes('base64,') ? p.split('base64,')[1] : p,
            mimeType: 'image/jpeg'
          })));

          if (detectedChars.length > 0) {
            toast({
              title: "Identidade Detectada",
              description: `Utilizando referências de: ${detectedChars.map(c => c.name).join(', ')}`,
            });
          }

          const imageResponse = await provider.generateImage({
            prompt: userMessage,
            n: 1,
            image_size: '2K',
            reference_images: characterPhotos
          });

          const responseData = imageResponse.data?.[0];
          const imageUrl = responseData?.b64_json ? `data:image/png;base64,${responseData.b64_json}` : undefined;

          if (imageUrl) {
            addImage({ url: imageUrl, prompt: userMessage, format: '1024x1024' });
            setMessages(prev => [...prev, {
              id: `msg_${Date.now()}_img`,
              role: 'assistant' as const,
              content: 'Imagem gerada com sucesso!',
              timestamp: Date.now(),
              imageUrl,
              imagePrompt: userMessage,
            }]);
          }
        } catch (error) {
          console.error('[ChatPage] Direct image error:', error);
          toast({
            title: `Erro na geração de imagem`,
            description: `Não foi possível gerar a imagem diretamente.`,
            variant: 'destructive',
          });
        } finally {
          setIsGeneratingImage(false);
        }
      }
      // Regular text chat with possible file content
      else {
        const fullMessage = hasFileContent
          ? `${userMessage}\n\n${fileContent}`
          : userMessage;

        const history = [
          {
            role: 'system',
            content: `- Você é o ${provider.name}, um assistente completo e orquestrador multimodal especializado em Comunicação Política, Imagens e Análise.
- Você PODE e DEVE solicitar a criação ou edição de imagens sempre que o usuário pedir uma mudança visual (trocar roupa, cenário, etc) ou quando o pedido for um comando de criação (ex: "Crie um...", "Gere um...").
- Para pedidos de discurso ou texto que também impliquem uma cena visual, primeiro entregue o texto e DEPOIS adicione a tag de imagem.
- Para gerar uma imagem, você DEVE escrever ao final da sua resposta exatamente: [GENERATE_IMAGE: prompt detalhado em inglês]. O prompt deve descrever a cena em detalhes fotográficos.
- Você nunca deve dizer que não tem ferramentas de edição, pois você controla o motor de criação de imagens.
- NUNCA use emojis em suas respostas. Mantenha um tom profissional e sério, sem "enfeites" visuais, ícones ou emojis em títulos, listas ou no corpo do texto.
 
 ${isTranslatorMode ? `REGRAS ESTRITAS DE TRADUÇÃO DE ÁUDIO VERBAL:
 O usuário está no MODO TRADUTOR. Ele vai enviar áudios transcritos com o aviso "[ÁUDIO TRANSCREVIDO | Idioma nativo detectado: X]".
 1. Se o Idioma nativo detectado for "english" ou "chinese": VOCÊ DEVE AUTOMATICAMENTE e diretamente retornar a tradução completa do texto falado para o Português-BR (sem perguntar nada).
 2. Se o Idioma nativo detectado for "portuguese": VOCÊ DEVE PRIMEIRO perguntar ao usuário: "Você gostaria de traduzir este áudio para o Inglês (US) ou Chinês?". Não traduza até ele confirmar a língua.` : `O usuário pode enviar áudios transcritos que começarão com o aviso "[ÁUDIO TRANSCREVIDO | Idioma nativo detectado: X]". Responda naturalmente e mantenha o contexto.`}`
          },
          ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: fullMessage || 'Olá' },
        ];

        const assistantMessageId = `msg_${Date.now()}_txt`;
        const assistantMessage = {
          id: assistantMessageId,
          role: 'assistant' as const,
          content: '',
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        try {
          const stream = provider.chatStream({
            messages: history.map(msg => ({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: msg.content
            })),
            temperature: 0.7,
            max_output_tokens: 4000,
          });

          let fullAssistantContent = '';
          for await (const chunk of stream) {
            fullAssistantContent += chunk;
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, content: fullAssistantContent } : m
            ));
          }

          console.log('[ChatPage] Resposta completa do assistente:', fullAssistantContent);

          if (!fullAssistantContent) {
             setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, content: 'Desculpe, não consegui gerar uma resposta.' } : m
            ));
          } else {
            // Verificar se o assistente solicitou a geração de imagem por protocolo
            const imagePromptMatch = fullAssistantContent.match(/\[GENERATE_IMAGE:\s*(.*?)\]/i);
            console.log('[ChatPage] Match de protocolo de imagem:', imagePromptMatch);
            
            if (imagePromptMatch) {
              const extractedPrompt = imagePromptMatch[1].trim();
              console.log('[ChatPage] Iniciando geração de imagem com prompt:', extractedPrompt);
              
              // Remover a tag do conteúdo visível
              const cleanContent = fullAssistantContent.replace(/\[GENERATE_IMAGE:.*?\]/gi, '').trim();
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId ? { ...m, content: cleanContent } : m
              ));

              // Disparar a geração de imagem
              setIsGeneratingImage(true);
              try {
                const detectedChars = findCharactersInPrompt(userMessage);
                const characterPhotos = detectedChars.flatMap(c => c.photos.map(p => ({
                  data: p.includes('base64,') ? p.split('base64,')[1] : p,
                  mimeType: 'image/jpeg'
                })));

                const imageResponse = await provider.generateImage({
                  prompt: extractedPrompt,
                  n: 1,
                  image_size: '2K',
                  reference_images: characterPhotos
                });

                const responseData = imageResponse.data?.[0];
                const imageUrl = responseData?.b64_json ? `data:image/png;base64,${responseData.b64_json}` : undefined;

                if (imageUrl) {
                  addImage({ url: imageUrl, prompt: extractedPrompt, format: '1024x1024' });
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId ? { ...m, imageUrl, imagePrompt: extractedPrompt } : m
                  ));
                }
              } catch (err) {
                console.error("Erro ao gerar imagem solicitada por protocolo:", err);
              } finally {
                setIsGeneratingImage(false);
              }
            }
          }
        } catch (streamError: any) {
          console.error('[ChatPage] Streaming error:', streamError);
          const errorMsg = streamError?.message || 'Erro de conexão/stream';
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId ? { ...m, content: `ERRO DE STREAM: ${errorMsg}` } : m
          ));
        }
      }

      clearFiles();
    } catch (error: any) {
      console.error('Error:', error);

      let errorMessage = error.message || 'Erro desconhecido';

      if (errorMessage.includes('401')) {
        errorMessage = 'Chave API inválida.';
      } else if (errorMessage.includes('429')) {
        errorMessage = 'Muitas requisições. Aguarde um momento.';
      } else if (errorMessage.includes('413')) {
        errorMessage = 'Arquivo muito grande. Tente um arquivo menor.';
      }

      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsGeneratingImage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Mensagem copiada' });
  };

  const handleSaveImage = (imageUrl: string, prompt: string) => {
    addImage({ url: imageUrl, prompt, format: '1024x1024' });
    toast({ title: 'Imagem salva!', description: 'A imagem foi adicionada à sua galeria' });
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {isTranslatorMode ? (
        <TranslatorModeUI />
      ) : (
        <>
          {/* Messages Area - Scrollable */}
          <ScrollArea ref={scrollRef} className="flex-1 px-4 overflow-y-auto">
            <div className="max-w-3xl mx-auto py-6 space-y-6 pb-32">
              {messages.length === 0 ? (
                // Welcome State
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  {/* Logo */}
                  <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] mb-6 flex items-center justify-center">
                    <img
                      src={legadoLogo}
                      alt="Legado AI"
                      className="w-full h-full object-contain"
                      style={{ filter: 'brightness(1.3)' }}
                    />
                  </div>

                  <h1 className="text-3xl font-semibold text-foreground mb-2">
                    Como posso ajudar?
                  </h1>

                  <p className="text-muted-foreground mb-8 max-w-md">
                    Assistente completo: chat, análise de imagens, documentos, transcrição de áudio/vídeo e geração de imagens
                  </p>

                  {/* Suggestion Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-lg px-2">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(suggestion);
                          textareaRef.current?.focus();
                        }}
                        className="p-3 sm:p-4 text-left rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  {/* Dicas */}
                  <div className="mt-8 space-y-2 text-xs text-muted-foreground">
                    <p><strong>Dicas:</strong></p>
                    <p>• Anexe imagens para eu descrever ou analisar</p>
                    <p>• Envie PDFs, Word ou Excel para eu resumir</p>
                    <p>• Envie áudio/vídeo para transcrição</p>
                    <p>• Digite "crie uma imagem de..." para gerar imagens</p>
                  </div>
                </div>
              ) : (
                // Messages
                <>
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-4 animate-fade-in group">
                      {/* Avatar */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium overflow-hidden",
                        message.role === 'user'
                          ? "bg-muted text-muted-foreground"
                          : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                      )}>
                        {message.role === 'user' ? (
                          'V'
                        ) : (
                          <img
                            src={legadoLogo}
                            alt="AI"
                            className="w-5 h-5 object-contain"
                            style={{ filter: 'brightness(1.5)' }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.role === 'user' ? 'Você' : 'Legado AI'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {message.fileName && (
                            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                              📎 {message.fileName}
                            </span>
                          )}
                        </div>

                        {message.content ? (
                          <div className="text-foreground prose prose-sm dark:prose-invert max-w-none mb-3">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : message.role === 'assistant' && !message.imageUrl && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse mb-3">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>processando...</span>
                          </div>
                        )}

                        {/* Generated Image */}
                        {message.imageUrl && (
                          <div className="mt-3 space-y-2">
                            <div className="relative group/image rounded-xl overflow-hidden border border-border/50 max-w-2xl w-full">
                              <img src={message.imageUrl} alt={message.imagePrompt || 'Imagem'} className="w-full h-auto object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 sm:group-hover/image:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-2">
                                <button onClick={() => handleSaveImage(message.imageUrl!, message.imagePrompt || '')} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm">
                                  <ImageIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => downloadImage({ url: message.imageUrl!, prompt: message.imagePrompt || '', format: '1024x1024', createdAt: Date.now(), id: '' })} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm">
                                  <Download className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveImage(message.imageUrl!, message.imagePrompt || '')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                                <ImageIcon className="w-3.5 h-3.5" />
                                Salvar na galeria
                              </button>
                              <button onClick={() => downloadImage({ url: message.imageUrl!, prompt: message.imagePrompt || '', format: '1024x1024', createdAt: Date.now(), id: '' })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-muted/80">
                                <Download className="w-3.5 h-3.5" />
                                Baixar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Actions bar (Copy, TTS) */}
                        {message.role === 'assistant' && !message.imageUrl && (
                          <div className="flex items-center gap-1 mt-2 transition-opacity">
                            <button onClick={() => copyMessage(message.content)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Copiar texto">
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handlePlayAudio(message.id, message.content as string)}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                playingMessageId === message.id
                                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                              )}
                              title={playingMessageId === message.id ? "Parar áudio" : "Ouvir em voz alta (Nova)"}
                            >
                              {playingMessageId === message.id ? (
                                <Square className="w-4 h-4 fill-current animate-pulse" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator (only shown if not already streaming into a message) */}
                  {isLoading && !messages.some(m => m.role === 'assistant' && !m.content && !m.imageUrl) && (
                    <div className="flex gap-4 animate-fade-in group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">Legado AI</span>
                          <span className="text-xs text-muted-foreground">{isGeneratingImage ? "pintando..." : "processando..."}</span>
                        </div>
                        {isGeneratingImage && (
                          <div className="mt-3">
                            <LoaderOne />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area - Fixed */}
          <div className="flex-shrink-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-4 px-4 border-t border-border/30">
            <div className="max-w-3xl mx-auto">
              {/* Selected Files */}
              <SelectedFilesList files={selectedFiles} onRemove={removeFile} />

              {/* Input container */}
              <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensagem Legado AI..."
                  className="min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3.5 pr-32 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />

                {/* Actions */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <FileUploadButton
                    onFilesSelected={addFiles}
                    selectedFiles={selectedFiles}
                    onRemoveFile={removeFile}
                    disabled={isLoading}
                  />
                  <VoiceInput onTranscription={(text) => setInput(prev => prev + text)} disabled={isLoading} />
                  <Button
                    onClick={handleSend}
                    disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-xl transition-all",
                      (input.trim() || selectedFiles.length > 0)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-xs text-muted-foreground mt-2 hidden sm:block">
                Legado AI pode cometer erros. Anexe imagens, documentos, áudio ou vídeo para análise.
              </p>
              <p className="text-center text-xs text-muted-foreground mt-2 sm:hidden">
                Legado AI pode cometer erros.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
