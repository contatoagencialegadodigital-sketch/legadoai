import { useState, useRef, useCallback, useEffect } from 'react';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnecting';
export type TranslationMode = 'pt-zh' | 'zh-pt' | 'pt-en' | 'en-pt';

export function useRealtimeTranslation() {
    const [status, setStatus] = useState<ConnectionStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const disconnect = useCallback(() => {
        setStatus('disconnecting');

        if (dcRef.current) {
            dcRef.current.close();
            dcRef.current = null;
        }

        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioElementRef.current) {
            audioElementRef.current.srcObject = null;
            audioElementRef.current = null;
        }

        setStatus('idle');
    }, []);

    const getInstructions = (mode: TranslationMode) => {
        const base = `Você é uma intérprete simultânea de idiomas extremamente profissional. 
REGRAS CRÍTICAS: 
1. NUNCA converse, explique ou responda como assistente. Sua única função é traduzir áudio.
2. Não adicione comentários, saudações ou explicações. Apenas a tradução direta.
3. Sua resposta deve ser apenas o áudio traduzido.`;

        switch (mode) {
            case 'pt-zh':
                return `${base}\n4. Traduza TUDO que ouvir em Português para o Chinês (Mandarim) imediatamente.`;
            case 'zh-pt':
                return `${base}\n4. Traduza TUDO que ouvir em Chinês para o Português do Brasil imediatamente.`;
            case 'pt-en':
                return `${base}\n4. Traduza TUDO que ouvir em Português para o Inglês imediatamente.`;
            case 'en-pt':
                return `${base}\n4. Traduza TUDO que ouvir em Inglês para o Português do Brasil imediatamente.`;
            default:
                return base;
        }
    };

    const connect = useCallback(async (mode: TranslationMode) => {
        try {
            setStatus('connecting');
            setError(null);

            if (!OPENAI_API_KEY) {
                throw new Error("Chave da API da OpenAI não encontrada");
            }

            const instructions = getInstructions(mode);

            // 1. Obter o WebRTC Ephemeral Token da OpenAI via endpoint GA
            const sessionConfig = {
                model: "gpt-4o-realtime-preview-2024-12-17",
                voice: "alloy",
                instructions: instructions,
            };

            const tokenResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(sessionConfig)
            });

            let tokenData;
            if (tokenResponse.status === 404) {
                // fallback to the new GA endpoint
                const secretResponse = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENAI_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-realtime-preview-2024-12-17",
                        instructions: instructions,
                        voice: "alloy"
                    })
                });

                if (!secretResponse.ok) {
                    throw new Error(`Falha ao obter token (client_secrets): ${secretResponse.statusText}`);
                }
                tokenData = await secretResponse.json();
            } else if (!tokenResponse.ok) {
                throw new Error(`Falha ao obter token (sessions): ${await tokenResponse.text()}`);
            } else {
                tokenData = await tokenResponse.json();
            }

            // the ephemeral key is either under tokenData.client_secret.value or tokenData.value depending on the exact schema
            const ephemeralKey = tokenData?.client_secret?.value || tokenData?.value;
            if (!ephemeralKey) {
                throw new Error("Chave efêmera não retornada pela OpenAI." + JSON.stringify(tokenData));
            }

            // 2. Criar a conexão WebRTC
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            // 3. Configurar recepção de áudio
            const audioEl = new Audio();
            audioEl.autoplay = true;
            audioElementRef.current = audioEl;

            pc.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    audioEl.srcObject = event.streams[0];
                }
            };

            // 4. Capturar e adicionar áudio do microfone do usuário
            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = ms;
            pc.addTrack(ms.getTracks()[0]);

            // 5. Configurar o Data Channel
            const dc = pc.createDataChannel("oai-events");
            dcRef.current = dc;

            dc.addEventListener("open", () => {
                setStatus('connected');
            });

            dc.addEventListener("close", () => {
                // Only reset if we didn't voluntarily disconnect
                if (pcRef.current) {
                    setStatus('idle');
                }
            });

            dc.addEventListener("message", (e) => {
                const event = JSON.parse(e.data);
                console.log("Realtime event:", event);
            });

            // 6. Negociar o SDP offer/answer usando o Token
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const sdpResponse = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", {
                method: "POST",
                body: offer.sdp,
                headers: {
                    "Authorization": `Bearer ${ephemeralKey}`,
                    "Content-Type": "application/sdp"
                }
            });

            if (!sdpResponse.ok) {
                throw new Error(`Erro na negociação SDP: ${sdpResponse.statusText}`);
            }

            const answerSdp = await sdpResponse.text();
            const answer = {
                type: "answer" as RTCSdpType,
                sdp: answerSdp,
            };

            await pc.setRemoteDescription(answer);

        } catch (err: any) {
            console.error("Erro no tradutor realtime:", err);
            setError(err?.message || "Erro desconhecido");
            disconnect();
        }
    }, [disconnect]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        status,
        error,
        connect,
        disconnect
    };
}
