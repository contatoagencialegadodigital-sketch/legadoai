import { useState, useEffect, useCallback } from 'react';

export interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  format: string;
  createdAt: number;
  downloaded?: boolean;
}

const STORAGE_KEY = 'legado_image_gallery';
const SYNC_EVENT = 'legado_image_gallery_updated';

export function useImageGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);

  // Load images from localStorage
  const loadImagesFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setImages(parsed.sort((a: GalleryImage, b: GalleryImage) => b.createdAt - a.createdAt));
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    }
  }, []);

  useEffect(() => {
    loadImagesFromStorage();

    // Listen to custom event for same-window sync
    const handleSync = () => loadImagesFromStorage();
    window.addEventListener(SYNC_EVENT, handleSync);

    // Listen to native storage event for cross-tab sync
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) handleSync();
    });

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadImagesFromStorage]);

  const addImage = useCallback((image: Omit<GalleryImage, 'id' | 'createdAt'>) => {
    const newImage: GalleryImage = {
      ...image,
      id: `img_${Date.now()}`,
      createdAt: Date.now(),
    };

    setImages(prev => {
      const updated = [newImage, ...prev];
      // Side effect moved out of the synchronous update to avoid blocking React
      setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event(SYNC_EVENT));
        } catch (e) {
          console.warn('Falha ao salvar imagem na galeria local (provavelmente limite de espaço excedido):', e);
          // Ainda assim disparar o evento para sync local mas sem o backup no localStorage
          window.dispatchEvent(new Event(SYNC_EVENT));
        }
      }, 0);
      return updated;
    });

    return newImage;
  }, []);

  const deleteImage = useCallback((imageId: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event(SYNC_EVENT));
      return filtered;
    });
  }, []);

  const markAsDownloaded = useCallback((imageId: string) => {
    setImages(prev => {
      const updated = prev.map(img =>
        img.id === imageId ? { ...img, downloaded: true } : img
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(SYNC_EVENT));
      return updated;
    });
  }, []);

  const downloadImage = useCallback(async (image: GalleryImage) => {
    try {
      // Fetch a imagem
      const response = await fetch(image.url);
      const blob = await response.blob();

      // Criar URL do blob
      const blobUrl = URL.createObjectURL(blob);

      // Criar link de download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `legado_${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar URL do blob
      URL.revokeObjectURL(blobUrl);

      // Marcar como baixada
      markAsDownloaded(image.id);

      return true;
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      return false;
    }
  }, [markAsDownloaded]);

  // Get recent images (sorted by date)
  const recentImages = images.slice(0, 5);
  const hasMoreImages = images.length > 5;
  const remainingImages = images.slice(5);

  return {
    images,
    recentImages,
    hasMoreImages,
    remainingImages,
    addImage,
    deleteImage,
    downloadImage,
    markAsDownloaded,
  };
}
