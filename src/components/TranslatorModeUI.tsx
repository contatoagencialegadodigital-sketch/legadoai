import React, { useState, useRef } from 'react';
import { Mic, MicOff, Settings2, Globe2, Activity, Camera, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { useRealtimeTranslation, TranslationMode } from '@/hooks/useRealtimeTranslation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { getAIProvider } from '@/lib/aiProvider';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export const TranslatorModeUI = () => {
    const [subMode, setSubMode] = useState<'realtime' | 'transcribe'>('realtime');
    const [languageMode, setLanguageMode] = useState<TranslationMode>('pt-en');
    const [isProcessing, setIsProcessing] = useState(false);
    const [translationResult, setTranslationResult] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    
    const { status, error, connect, disconnect } = useRealtimeTranslation();

    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';

    const handleToggle = () => {
        if (isConnected || isConnecting) {
            disconnect();
        } else {
            connect(languageMode);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCapture = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setTranslationResult(null);
        setChatMessages([]);
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            setCapturedImage(reader.result as string);

            try {
                const provider = getAIProvider();
                const response = await provider.chat({
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: "Traduza TODO o texto presente nesta imagem (placas, cardápios, avisos, etc) para o Português do Brasil de forma clara e profissional. Se não houver texto, informe que nenhum texto foi detectado." },
                                { type: 'image', data: base64 }
                            ]
                        }
                    ],
                    temperature: 0.2
                });

                const content = response.choices[0]?.message?.content || '';
                setTranslationResult(content);
            } catch (err) {
                console.error("Erro na tradução da imagem:", err);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleChatSend = async () => {
        if (!chatInput.trim() || !translationResult || isProcessing) return;

        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsProcessing(true);

        try {
            const provider = getAIProvider();
            const response = await provider.chat({
                messages: [
                    {
                        role: 'system',
                        content: "Você é um intérprete profissional. Responda APENAS perguntas sobre o conteúdo traduzido anteriormente no contexto fornecido. NÃO aja como assistente político, orquestrador ou qualquer outra persona. Se a pergunta for irrelevante ao contexto da tradução, responda educadamente que você está no modo estrito de tradução e não pode responder sobre outros temas. NUNCA use emojis."
                    },
                    {
                        role: 'user',
                        content: `CONTEXTO DA TRADUÇÃO:\n${translationResult}\n\nPERGUNTA DO USUÁRIO: ${userMsg}`
                    }
                ],
                temperature: 0.3
            });

            const content = response.choices[0]?.message?.content || '';
            setChatMessages(prev => [...prev, { role: 'assistant', content }]);
        } catch (err) {
            console.error("Erro no chat do tradutor:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-full w-full bg-background/50 backdrop-blur pb-20 pt-10 px-4">
            {/* Sub-mode Switcher */}
            <div className="flex bg-muted p-1 rounded-xl mb-8 w-full max-w-[340px] sm:max-w-sm">
                <button
                    onClick={() => setSubMode('realtime')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        subMode === 'realtime' 
                            ? 'bg-card text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Mic className="w-4 h-4" /> RealTime
                </button>
                <button
                    onClick={() => setSubMode('transcribe')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        subMode === 'transcribe' 
                            ? 'bg-card text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Camera className="w-4 h-4" /> Transcribe
                </button>
            </div>

            <div className="flex flex-col items-center p-6 sm:p-8 bg-card rounded-2xl border border-border/50 shadow-2xl max-w-md w-full mx-auto animate-in zoom-in-95 duration-300">

                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
                    <Globe2 className={`h-10 w-10 text-primary ${isConnected ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`} />
                    {isConnected && (
                        <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-25" />
                    )}
                </div>

                <h2 className="text-2xl font-bold mb-2">
                    {subMode === 'realtime' ? 'Tradução em Tempo Real' : 'Tradutor de Imagem'}
                </h2>
                <p className="text-muted-foreground text-center mb-8 px-4">
                    {subMode === 'realtime' 
                        ? 'Converse naturalmente. A IA ouvirá tudo e traduzirá a sua voz instantaneamente.'
                        : 'Traduza placas, cardápios e avisos. Tire uma foto ou suba uma imagem para começar.'}
                </p>

                {subMode === 'realtime' ? (
                    <>
                        {error && (
                            <div className="w-full p-4 mb-6 rounded-lg bg-destructive/10 text-destructive text-sm text-center border border-destructive/20">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="w-full space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Settings2 className="w-4 h-4" /> Preferências do Tradutor
                                </label>
                                <Select
                                    value={languageMode}
                                    onValueChange={(value) => setLanguageMode(value as TranslationMode)}
                                    disabled={isConnected || isConnecting}
                                >
                                    <SelectTrigger className="w-full bg-background border-border/50">
                                        <SelectValue placeholder="Selecione a tradução" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pt-en">Português para Inglês</SelectItem>
                                        <SelectItem value="en-pt">Inglês para Português</SelectItem>
                                        <SelectItem value="pt-zh">Português para Chinês</SelectItem>
                                        <SelectItem value="zh-pt">Chinês para Português</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                size="lg"
                                className={`w-full py-6 text-lg rounded-xl transition-all ${isConnected
                                    ? 'bg-destructive hover:bg-destructive/90 text-white'
                                    : isConnecting
                                        ? 'bg-primary/50 cursor-not-allowed'
                                        : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25'
                                    }`}
                                onClick={handleToggle}
                                disabled={status === 'disconnecting'}
                            >
                                {isConnecting ? (
                                    <span className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 animate-spin" /> Conectando...
                                    </span>
                                ) : isConnected ? (
                                    <span className="flex items-center gap-2">
                                        <MicOff className="w-5 h-5" /> Parar Tradução
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Mic className="w-5 h-5" /> Iniciar Tradução
                                    </span>
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="w-full space-y-4">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={(e) => handleImageUpload(e)}
                        />
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            ref={cameraInputRef}
                            onChange={(e) => handleImageUpload(e, true)}
                        />

                        <div className="grid grid-cols-2 gap-3 w-full">
                            <Button 
                                variant="outline" 
                                className="h-24 flex flex-col gap-2 rounded-xl border-border/50"
                                onClick={() => cameraInputRef.current?.click()}
                                disabled={isProcessing}
                            >
                                <Camera className="w-6 h-6" />
                                <span className="text-xs text-center">Tirar Foto</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                className="h-24 flex flex-col gap-2 rounded-xl border-border/50"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                            >
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-xs text-center">Subir Imagem</span>
                            </Button>
                        </div>
                        
                        {(isProcessing || translationResult) && (
                            <div className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                                    <Globe2 className="w-3 h-3" /> Tradução Detectada
                                </div>
                                
                                {isProcessing && !translationResult ? (
                                    <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
                                        <Activity className="w-4 h-4 animate-spin" /> Processando imagem...
                                    </div>
                                ) : (
                                    <div className="text-sm leading-relaxed max-h-[150px] overflow-y-auto pr-2 custom-scrollbar prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {translationResult}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {translationResult && (
                                    <div className="pt-4 border-t border-border/50 space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                                            <MessageSquare className="w-3 h-3" /> Perguntar sobre este conteúdo
                                        </div>

                                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                            {chatMessages.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={cn(
                                                        "max-w-[85%] p-3 rounded-xl text-xs",
                                                        msg.role === 'user' 
                                                            ? 'bg-primary text-primary-foreground' 
                                                            : 'bg-muted text-foreground prose prose-xs dark:prose-invert max-w-none'
                                                    )}>
                                                        {msg.role === 'assistant' ? (
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        ) : (
                                                            msg.content
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {isProcessing && chatMessages.length > 0 && chatMessages[chatMessages.length-1].role === 'user' && (
                                                <div className="flex justify-start">
                                                    <div className="bg-muted p-3 rounded-xl text-xs italic text-muted-foreground animate-pulse">
                                                        Pensando...
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative flex items-center">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                                                placeholder="Tire suas dúvidas sobre a imagem..."
                                                className="w-full bg-background border border-border/50 rounded-lg py-2 pl-3 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                                disabled={isProcessing}
                                            />
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="absolute right-1 h-7 w-7"
                                                onClick={handleChatSend}
                                                disabled={isProcessing || !chatInput.trim()}
                                            >
                                                <Activity className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isProcessing && !translationResult && (
                            <div className="p-4 rounded-xl border border-dashed border-border flex flex-col items-center justify-center min-h-[120px] text-muted-foreground">
                                <Globe2 className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-xs text-center text-balance">A tradução e o chat contextual aparecerão logo após você fornecer uma imagem.</p>
                            </div>
                        )}
                    </div>
                )}

                {isConnected && subMode === 'realtime' && (
                    <div className="mt-8 flex items-center gap-2 text-sm text-primary animate-pulse">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        Tradutor Ativo - Fale agora
                    </div>
                )}

            </div>
        </div>
    );
};
