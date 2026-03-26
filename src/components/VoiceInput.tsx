import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createTranscription, isOpenAIConfigured } from '@/integrations/openai/client';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInput({
  onTranscription,
  disabled,
  className
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Erro ao acessar microfone. Verifique as permissões do navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    // Verificar se OpenAI está configurada
    if (!isOpenAIConfigured()) {
      alert('⚠️ API OpenAI não configurada. Adicione sua VITE_OPENAI_API_KEY no arquivo .env');
      return;
    }

    setIsTranscribing(true);

    try {
      // Usar Whisper da OpenAI para transcrição com auto-detecção de idioma
      const response = await createTranscription({
        audioBlob,
        model: 'whisper-1',
        // Removido language: 'pt' para forçar auto-detecção
        response_format: 'verbose_json',
      });

      if (response.text) {
        // Obter idioma detectado pela API do Whisper (ex: 'english', 'portuguese', 'chinese')
        const detectedLanguage = response.language || 'desconhecido';

        // Passa o idioma detectado como um metadado interno
        onTranscription(`[ÁUDIO TRANSCREVIDO | Idioma nativo detectado: ${detectedLanguage}]\n\n${response.text.trim()}`);
      } else {
        throw new Error('Nenhum texto foi transcrito');
      }
    } catch (error: any) {
      console.error('Error transcribing audio:', error);

      let errorMessage = error.message || 'Erro desconhecido';

      // Tratamento de erros específicos
      if (errorMessage.includes('401')) {
        errorMessage = 'Chave API inválida. Verifique sua VITE_OPENAI_API_KEY.';
      } else if (errorMessage.includes('429')) {
        errorMessage = 'Muitas requisições. Aguarde um momento.';
      } else if (errorMessage.includes('413')) {
        errorMessage = 'Arquivo de áudio muito grande. Tente gravar por menos tempo.';
      }

      alert(`Erro na transcrição: ${errorMessage}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      className={cn(
        "p-2 rounded-full transition-all duration-300 flex items-center justify-center",
        !isRecording && "text-muted-foreground hover:text-foreground hover:bg-muted",
        isRecording && "text-destructive bg-destructive/15 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={isRecording ? "Parar gravação" : "Gravar áudio"}
    >
      {isTranscribing ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : (
        <Mic className={cn("w-4 h-4 flex-shrink-0 transition-transform", isRecording && "scale-110")} />
      )}
    </button>
  );
}
