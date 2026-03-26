import { useEffect, useState } from 'react';

interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  deferredPrompt: any;
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    deferredPrompt: null,
  });

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('[PWA] SW registrado:', registration.scope);
          })
          .catch((error) => {
            console.error('[PWA] Erro ao registrar SW:', error);
          });
      });
    }

    // Verificar se está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    setStatus((prev) => ({ ...prev, isInstalled: isStandalone }));

    // Evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setStatus((prev) => ({ 
        ...prev, 
        isInstallable: true,
        deferredPrompt: e 
      }));
    };

    // Evento de app instalado
    const handleAppInstalled = () => {
      setStatus((prev) => ({ 
        ...prev, 
        isInstallable: false,
        isInstalled: true,
        deferredPrompt: null 
      }));
      console.log('[PWA] App instalado!');
    };

    // Monitorar status online/offline
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Função para instalar o app
  const installApp = async () => {
    if (status.deferredPrompt) {
      status.deferredPrompt.prompt();
      const { outcome } = await status.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] Usuário aceitou instalação');
      } else {
        console.log('[PWA] Usuário recusou instalação');
      }
      
      setStatus((prev) => ({ ...prev, deferredPrompt: null }));
    }
  };

  return { ...status, installApp };
}

export default usePWA;
