import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/dashscope-api': {
        target: 'https://dashscope-intl.aliyuncs.com',
        changeOrigin: true,
        secure: false,
        headers: {
          'Authorization': `Bearer sk-4034f412baf041538894054c068d27e1`,
          'X-DashScope-ApiKey': 'sk-4034f412baf041538894054c068d27e1'
        },
        rewrite: (path) => path.replace(/^\/dashscope-api/, ''),
      },
      '/dashscope-compatible': {
        target: 'https://dashscope-intl.aliyuncs.com',
        changeOrigin: true,
        secure: false,
        headers: {
          'Authorization': `Bearer sk-4034f412baf041538894054c068d27e1`,
          'X-DashScope-ApiKey': 'sk-4034f412baf041538894054c068d27e1'
        },
        rewrite: (path) => path.replace(/^\/dashscope-compatible/, '/compatible-mode/v1'),
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-512.png', 'icon-192.png', 'favicon.png'],
      manifest: {
        name: 'Legado AI Studio',
        short_name: 'Legado AI',
        description: 'Transforme suas ideias em conteúdo incrível com o poder da IA',
        theme_color: '#40C4BB',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react-is",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "scheduler"
    ],
  },
  build: {
    sourcemap: mode === "development",
  },
}));
