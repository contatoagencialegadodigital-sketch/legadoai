import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Dev-only: ensure no old service workers are controlling the page (avoids mixed React copies)
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Unregister all service workers
  navigator.serviceWorker.getRegistrations?.().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
  
  // Force reload after clearing (only once per session)
  if (!sessionStorage.getItem('cache-cleared')) {
    sessionStorage.setItem('cache-cleared', 'true');
    window.location.reload();
  }
}

console.log('Main.tsx: Starting application...');
createRoot(document.getElementById("root")!).render(<App />);
console.log('Main.tsx: Render called.');
