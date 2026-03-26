import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle, Smartphone, Monitor, Tablet, Share, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import legadoLogo from '@/assets/legado-logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(userAgent);
    const android = /Android/.test(userAgent);
    
    setIsIOS(iOS);
    setIsAndroid(android);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
    
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // iOS doesn't support beforeinstallprompt
    if (iOS) {
      setIsInstallable(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-primary/20">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={legadoLogo} 
            alt="Legado AI Studio" 
            className="h-32 w-auto object-contain animate-glow"
            style={{ filter: 'brightness(1.3)' }}
          />
        </div>

        {/* Main Card */}
        <Card className="border-primary/20 shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Instale o App</CardTitle>
            <CardDescription>
              Acesse suas ferramentas de IA direto da tela inicial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isInstalled ? (
              <div className="text-center space-y-4 py-6">
                <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">✅ App Instalado!</h3>
                  <p className="text-muted-foreground">
                    O Legado AI Studio foi adicionado ao seu dispositivo
                  </p>
                </div>
              </div>
            ) : isIOS ? (
              <div className="space-y-6">
                <Alert className="bg-primary/10 border-primary/20">
                  <AlertDescription className="text-sm">
                    <strong>iPhone/iPad:</strong> O Safari não mostra botão de instalação automático
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4 text-left">
                  <h4 className="font-semibold">Como Instalar no iOS:</h4>
                  <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">1.</span>
                      <span>Toque no botão <Share className="inline w-4 h-4 mx-1" /> (Compartilhar) na barra inferior do Safari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">2.</span>
                      <span>Role para baixo e selecione "Adicionar à Tela de Início"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">3.</span>
                      <span>Toque em "Adicionar" no canto superior direito</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">4.</span>
                      <span>O app aparecerá na sua tela inicial!</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Dica: Use apenas no Safari. Outros navegadores no iOS não suportam PWA.
                  </p>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="space-y-6">
                {isInstallable && deferredPrompt ? (
                  <>
                    <div className="text-center space-y-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        ✨ Pronto para instalação
                      </Badge>
                    </div>
                    
                    <Button 
                      onClick={handleInstallClick}
                      size="lg"
                      className="w-full"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Instalar Aplicativo
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 text-left">
                    <h4 className="font-semibold">Como Instalar no Android:</h4>
                    <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">1.</span>
                        <span>Toque no menu <MoreVertical className="inline w-4 h-4 mx-1" /> (três pontos) no canto superior</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">2.</span>
                        <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5">3.</span>
                        <span>Confirme a instalação</span>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {isInstallable && deferredPrompt ? (
                  <>
                    <div className="text-center space-y-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        ✨ Pronto para instalação
                      </Badge>
                    </div>
                    
                    <Button 
                      onClick={handleInstallClick}
                      size="lg"
                      className="w-full"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Instalar Aplicativo
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-muted-foreground">
                      Procure pelo ícone de instalação <Download className="inline w-4 h-4" /> na barra de endereço
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center space-y-2">
                    <Smartphone className="w-8 h-8 mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground">Celular</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Tablet className="w-8 h-8 mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground">Tablet</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Monitor className="w-8 h-8 mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground">Desktop</p>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="border-t pt-6 space-y-3">
              <h4 className="font-semibold text-center mb-4">Benefícios do App</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Acesso rápido pela tela inicial</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Funciona offline após instalação</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Experiência nativa em todos os dispositivos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Sem necessidade de app store</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}