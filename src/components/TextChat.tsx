import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Copy, Trash2, FileText, Upload } from 'lucide-react';
import { useOpenAIChat } from '@/hooks/useOpenAIChat';
import { useToast } from '@/hooks/use-toast';
import { VoiceInput } from '@/components/VoiceInput';

export default function TextChat() {
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { messages, isLoading, sendMessage, clearMessages } = useOpenAIChat();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Manter o foco no textarea após o envio e resposta
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const handleSend = async () => {
    if (!input.trim() && !uploadedFile) return;

    let messageContent = input.trim();

    if (uploadedFile) {
      const fileContent = await uploadedFile.text();
      messageContent = `[Texto enviado para análise]\n\n${fileContent}\n\n${messageContent || 'Por favor, analise este texto e forneça sugestões de melhoria.'}`;
      setUploadedFile(null);
    }

    setInput('');
    await sendMessage(messageContent);
    
    // Focar no textarea após enviar
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        setUploadedFile(file);
        toast({
          title: 'Arquivo carregado',
          description: `${file.name} pronto para análise`,
        });
      } else {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, envie apenas arquivos .txt',
          variant: 'destructive',
        });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Texto copiado!',
      description: 'O texto foi copiado para a área de transferência',
    });
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Chat Messages */}
      <Card className="flex-1 overflow-hidden min-h-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground">
                <FileText className="w-16 h-16 opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Comece uma conversa</h3>
                  <p className="text-sm max-w-md">
                    Peça sugestões de textos, debata temas políticos ou envie um texto para análise
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? (
                          <>
                            <span className="text-xs font-semibold text-muted-foreground">
                              Você
                            </span>
                            <span className="text-xs text-muted-foreground/50">
                              {message.timestamp.toLocaleTimeString('pt-BR')}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-semibold text-muted-foreground">
                              Estrategista
                            </span>
                            <span className="text-xs text-muted-foreground/50">
                              {message.timestamp.toLocaleTimeString('pt-BR')}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 ml-auto"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                      <p className="text-base whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card className="flex-shrink-0">
        <CardContent className="p-3">
          <div className="space-y-2">
            {uploadedFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileText className="w-4 h-4" />
                <span className="text-sm flex-1">{uploadedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <VoiceInput 
                onTranscription={(text) => setInput(prev => prev ? `${prev} ${text}` : text)}
                disabled={isLoading}
              />
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem ou solicite a criação de um texto..."
                className="min-h-[60px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <Button onClick={handleSend} disabled={isLoading || (!input.trim() && !uploadedFile)}>
                  <Send className="h-4 w-4" />
                </Button>
                {messages.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearMessages}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
