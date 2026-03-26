import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChatLayout } from "@/components/ChatLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { CharacterProvider } from "@/contexts/CharacterContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt, NetworkStatus } from "@/components/PWAInstallPrompt";
import Auth from "./pages/Auth";
import ChatPage from "./pages/ChatPage";
import ImageGalleryPage from "./pages/ImageGalleryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.log('App: Rendering common providers...');
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CharacterProvider>
            <Routes>
            {/* Auth page (tela de entrada) */}
            <Route path="/auth" element={<Auth />} />

            {/* Main app with ChatLayout */}
            <Route path="/" element={
              <ProtectedRoute>
                <ChatLayout>
                  <ChatPage />
                </ChatLayout>
              </ProtectedRoute>
            } />

            <Route path="/images" element={
              <ProtectedRoute>
                <ChatLayout>
                  <ImageGalleryPage />
                </ChatLayout>
              </ProtectedRoute>
            } />

            {/* Redirect old routes */}
            <Route path="/image" element={<Navigate to="/" replace />} />
            <Route path="/video" element={<Navigate to="/" replace />} />
            <Route path="/text" element={<Navigate to="/" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CharacterProvider>
          <Toaster />
          <PWAInstallPrompt />
          <NetworkStatus />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
  );
};

export default App;
