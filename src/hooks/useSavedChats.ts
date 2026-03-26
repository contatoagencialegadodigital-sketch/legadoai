import { useState, useEffect, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string; // Para mensagens com imagens geradas
  imagePrompt?: string; // Prompt usado para gerar a imagem
  fileName?: string; // Nome do arquivo anexado
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
  }>; // Lista de arquivos anexados
}

export interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  previewImage?: string; // Primeira imagem do chat para preview
}

const STORAGE_KEY = 'legado_saved_chats';
const SYNC_EVENT = 'legado_saved_chats_updated';

export function useSavedChats() {
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load chats from localStorage
  const loadChatsFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setChats(parsed.sort((a: SavedChat, b: SavedChat) => b.updatedAt - a.updatedAt));
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
    }
  }, []);

  useEffect(() => {
    loadChatsFromStorage();

    // Listen to custom event for same-window sync
    const handleSync = () => loadChatsFromStorage();
    window.addEventListener(SYNC_EVENT, handleSync);

    // Listen to native storage event for cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) handleSync();
    });

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadChatsFromStorage]);

  // Wrapper to save chats and trigger sync
  const saveChatsAndSync = useCallback((newChats: SavedChat[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newChats));
      setChats(newChats);
      window.dispatchEvent(new Event(SYNC_EVENT));
    } catch (error) {
      console.error('Erro ao salvar chats:', error);
    }
  }, []);

  const createNewChat = useCallback((): string => {
    const newChat: SavedChat = {
      id: `chat_${Date.now()}`,
      title: 'Nova conversa',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setChats(prev => {
      const updated = [newChat, ...prev];
      setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event(SYNC_EVENT));
        } catch (e) {
          console.warn('Falha ao salvar novos chats no localStorage:', e);
        }
      }, 0);
      return updated;
    });

    setCurrentChatId(newChat.id);
    return newChat.id;
  }, []);

  const updateChatMessages = useCallback((chatId: string, messages: ChatMessage[]) => {
    setChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id === chatId) {
          // Gerar título a partir da primeira mensagem do usuário
          const firstUserMessage = messages.find(m => m.role === 'user');
          const title = firstUserMessage
            ? firstUserMessage.content.slice(0, 40) + (firstUserMessage.content.length > 40 ? '...' : '')
            : chat.title;

          // Encontrar primeira imagem para preview
          const firstImageMessage = messages.find(m => m.imageUrl);

          return {
            ...chat,
            title,
            messages,
            updatedAt: Date.now(),
            previewImage: firstImageMessage?.imageUrl || chat.previewImage,
          };
        }
        return chat;
      });
      const sorted = updated.sort((a, b) => b.updatedAt - a.updatedAt);
      
      setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
          window.dispatchEvent(new Event(SYNC_EVENT));
        } catch (e) {
          console.warn('Falha ao atualizar mensagens do chat no localStorage (provavelmente limite excedido por imagens 2K):', e);
        }
      }, 0);
      
      return sorted;
    });
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => {
      const filtered = prev.filter(chat => chat.id !== chatId);
      setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
          window.dispatchEvent(new Event(SYNC_EVENT));
        } catch (e) {
          console.error('Erro ao deletar chat do storage:', e);
        }
      }, 0);
      return filtered;
    });
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  }, [currentChatId]);

  const renameChat = useCallback((chatId: string, newTitle: string) => {
    setChats(prev => {
      const updated = prev.map(chat =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(SYNC_EVENT));
      return updated;
    });
  }, []);

  const getCurrentChat = useCallback((): SavedChat | null => {
    if (!currentChatId) return null;
    return chats.find(chat => chat.id === currentChatId) || null;
  }, [chats, currentChatId]);

  const loadChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  // Get recent chats (sorted by date)
  const recentChats = chats.slice(0, 5);
  const hasMoreChats = chats.length > 5;
  const remainingChats = chats.slice(5);

  const clearAllChats = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setChats([]);
    setCurrentChatId(null);
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, []);

  return {
    chats,
    recentChats,
    hasMoreChats,
    remainingChats,
    currentChatId,
    createNewChat,
    updateChatMessages,
    deleteChat,
    renameChat,
    getCurrentChat,
    loadChat,
    clearAllChats,
  };
}
