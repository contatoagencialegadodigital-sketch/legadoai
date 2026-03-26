import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Smartphone, Check, X, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hasPermanentDismiss, setHasPermanentDismiss] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

useEffect(() => {
  // Detect iframe context (preview environments may block install prompt)
  const inIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  setIsInIframe(inIframe);

  // Check if user already dismissed permanently
  const dismissed = localStorage.getItem('pwa-dismissed-permanently');
  if (dismissed === 'true') {
    setHasPermanentDismiss(true);
    return;
  }

  // Check if already installed
  const installed = localStorage.getItem('pwa-installed');
  if (installed === 'true') {
    return;
  }

  // Detect iOS
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  setIsIOS(iOS);
  
  // Detect Android
  const android = /Android/.test(navigator.userAgent);
  setIsAndroid(android);
  
  // Check if already in standalone mode
  const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;
  setIsStandalone(standalone);

  if (standalone) {
    localStorage.setItem('pwa-installed', 'true');
    return;
  }
  
  // Capture install prompt event (Android/Desktop)
  const handleBeforeInstall = (e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    setIsInstallable(true);
    
    // Show modal after 2 seconds delay
    setTimeout(() => {
      setShowModal(true);
    }, 2000);
  };

  const handleAppInstalled = () => {
    localStorage.setItem('pwa-installed', 'true');
    setShowModal(false);
  };
  
  window.addEventListener('beforeinstallprompt', handleBeforeInstall);
  window.addEventListener('appinstalled', handleAppInstalled);
  
  // For iOS, show modal after delay if not installed
  if (iOS && !standalone) {
    setTimeout(() => {
      setShowModal(true);
    }, 2000);
  } else if (inIframe && !standalone) {
    // Fallback: in preview/iframe, auto-show instructions since the prompt may be blocked
    setTimeout(() => {
      setShowModal(true);
    }, 2000);
  }
  
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
}, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "✅ App instalado com sucesso!",
          description: "Agora você pode acessar o Legado AI Studio diretamente da sua tela inicial",
        });
        localStorage.setItem('pwa-installed', 'true');
        setIsInstallable(false);
        setShowModal(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Erro ao instalar:', error);
    }
  };

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('pwa-dismissed-permanently', 'true');
    }
    setShowModal(false);
  };

  const handleNotNow = () => {
    setShowModal(false);
    toast({
      title: "Você pode instalar depois",
      description: "Acesse este modal novamente através das configurações",
    });
  };

  // Don't show anything if already installed or permanently dismissed
  if (isStandalone || hasPermanentDismiss) {
    return null;
  }

  return (
    <>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-primary/30">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <img 
                src="/icon-192.png" 
                alt="Legado AI Studio" 
                className="w-12 h-12 rounded-full"
              />
            </div>
            <DialogTitle className="text-2xl text-center">
              Instale o Legado AI Studio
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Tenha acesso rápido e uma experiência nativa completa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Acesso rápido direto da tela inicial
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Funciona offline para consultas já carregadas
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Experiência nativa como aplicativo
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Sem ocupar espaço na barra do navegador
              </p>
            </div>
          </div>

          {/* Instruções específicas por plataforma */}
          {isIOS ? (
            <Alert className="bg-primary/10 border-primary/30">
              <Share className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Como instalar no iOS (Safari):</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1">
                  <li>Toque no ícone de compartilhar <Share className="w-3 h-3 inline mx-1" /> na barra inferior</li>
                  <li>Role para baixo e selecione <strong>"Adicionar à Tela Inicial"</strong></li>
                  <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
                </ol>
              </AlertDescription>
            </Alert>
          ) : isAndroid ? (
            <Alert className="bg-primary/10 border-primary/30">
              <Smartphone className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Como instalar no Android:</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1">
                  <li>Toque no menu (⋮) no canto superior direito do Chrome</li>
                  <li>Selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></li>
                  <li>Confirme a instalação</li>
                </ol>
                {!isInstallable && (
                  <p className="mt-2 text-xs opacity-80">
                    Em ambientes de preview, abra em uma nova aba para habilitar a instalação.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-primary/10 border-primary/30">
              <Download className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Como instalar no Desktop:</strong>
                <p className="mt-2">Use o menu do navegador (Chrome/Edge: Menu → Instalar app).</p>
                {!isInstallable && (
                  <p className="mt-2 text-xs opacity-80">
                    Em ambientes de preview, abra em uma nova aba para habilitar o botão de instalação automática.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="dont-show" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <Label 
              htmlFor="dont-show" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Não mostrar novamente
            </Label>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Agora Não
            </Button>
            {!isIOS && isInstallable && (
              <Button
                onClick={handleInstall}
                className="w-full sm:w-auto gradient-primary"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar Agora
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Install Button - Show whenever available and not dismissed */}
      {!showModal && !isStandalone && !hasPermanentDismiss && (
        <Button
          onClick={() => setShowModal(true)}
          size="sm"
          className="gradient-primary gap-2"
          variant="outline"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Instalar App</span>
        </Button>
      )}
    </>
  );
}
