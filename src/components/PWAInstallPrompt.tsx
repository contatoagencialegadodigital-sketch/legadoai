import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já dispensou anteriormente
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Só mostrar novamente após 7 dias
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
        return;
      }
    }

    // Mostrar após 3 segundos se for instalável
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    await installApp();
    setIsVisible(false);
  };

  // Detectar iOS (não suporta beforeinstallprompt)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-50 animate-fade-in">
      <div className="bg-card border border-border/50 rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {isIOS ? (
              <Share2 className="w-6 h-6 text-primary" />
            ) : (
              <Download className="w-6 h-6 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1">
              {isIOS ? 'Adicione à Tela Inicial' : 'Instale o Legado AI'}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3">
              {isIOS ? (
                <>Toque em <Share2 className="inline w-4 h-4 mx-1" /> e depois em "Adicionar à Tela Inicial" para acesso rápido.</>
              ) : (
                'Instale o app no seu celular para acesso rápido e melhor experiência.'
              )}
            </p>
            
            <div className="flex items-center gap-2">
              {!isIOS && (
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Instalar Agora
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDismiss}
              >
                Depois
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Indicador de status online/offline
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div 
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium z-50 animate-fade-in",
        isOnline 
          ? "bg-green-500/90 text-white" 
          : "bg-yellow-500/90 text-black"
      )}
    >
      {isOnline ? '🟢 Conectado' : '🟡 Modo Offline'}
    </div>
  );
}

export default PWAInstallPrompt;
