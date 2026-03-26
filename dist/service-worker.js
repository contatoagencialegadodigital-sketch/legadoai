// Legado AI Studio - Service Worker para PWA
const CACHE_NAME = 'legado-ai-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('[SW] Erro ao adicionar ao cache:', err);
      })
  );
  
  // Forçar ativação imediata
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deletando cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Tomar controle das páginas imediatamente
  self.clients.claim();
});

// Estratégia de cache: Network First, depois Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições de API (OpenAI, Supabase)
  if (url.pathname.includes('/api/') || 
      url.hostname.includes('openai.com') ||
      url.hostname.includes('supabase.co')) {
    return;
  }
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se resposta for válida, atualizar cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar na rede, tentar cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se não estiver no cache, retornar página offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Evento de mensagem (para comunicação com o app)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
