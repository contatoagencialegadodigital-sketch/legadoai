import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'legado_translator_mode';
const SYNC_EVENT = 'legado_translator_mode_updated';

export function useTranslatorMode() {
    const [isTranslatorMode, setIsTranslatorMode] = useState<boolean>(false);

    // Load state from localStorage
    const loadStateFromStorage = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored !== null) {
                setIsTranslatorMode(stored === 'true');
            } else {
                setIsTranslatorMode(false);
            }
        } catch (error) {
            console.error('Erro ao carregar modo tradutor:', error);
        }
    }, []);

    useEffect(() => {
        loadStateFromStorage();

        // Listen to custom event for same-window sync
        const handleSync = () => loadStateFromStorage();
        window.addEventListener(SYNC_EVENT, handleSync);

        // Listen to native storage event for cross-tab sync
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) handleSync();
        });

        return () => {
            window.removeEventListener(SYNC_EVENT, handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, [loadStateFromStorage]);

    const toggleTranslatorMode = useCallback(() => {
        setIsTranslatorMode(prev => {
            const newState = !prev;
            localStorage.setItem(STORAGE_KEY, String(newState));
            window.dispatchEvent(new Event(SYNC_EVENT));
            return newState;
        });
    }, []);

    return {
        isTranslatorMode,
        toggleTranslatorMode
    };
}
