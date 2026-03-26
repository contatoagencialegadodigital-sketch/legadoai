import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Character {
  id: string;
  name: string;
  triggerKeywords: string[];
  photos: string[]; // Base64 strings
}

interface CharacterContextType {
  characters: Character[];
  addCharacter: (character: Omit<Character, 'id'>) => Character;
  removeCharacter: (id: string) => void;
  findCharactersInPrompt: (prompt: string) => Character[];
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('character_library');
    if (saved) {
      try {
        setCharacters(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load character library', e);
      }
    }
  }, []);

  const saveCharacters = (newCharacters: Character[]) => {
    setCharacters(newCharacters);
    try {
      localStorage.setItem('character_library', JSON.stringify(newCharacters));
    } catch (e) {
      console.error('Failed to save characters to localStorage', e);
    }
  };

  const addCharacter = (character: Omit<Character, 'id'>) => {
    const newChar: Character = {
      ...character,
      id: `char_${Date.now()}`
    };
    const updated = [...characters, newChar];
    saveCharacters(updated);
    return newChar;
  };

  const removeCharacter = (id: string) => {
    const updated = characters.filter(c => c.id !== id);
    saveCharacters(updated);
  };

  const findCharactersInPrompt = (prompt: string): Character[] => {
    const lowerPrompt = prompt.toLowerCase();
    // Remover pontuação para facilitar o match (ex: "Edson!" -> "edson")
    const cleanPrompt = lowerPrompt.replace(/[.,!?;:]/g, ' ');
    const promptWords = cleanPrompt.split(/\s+/).filter(w => w.length > 1);

    return characters.filter(char => {
      const nameLower = char.name.toLowerCase();
      const nameParts = nameLower.split(' ').filter(p => p.length > 2);
      
      const nameMatch = nameParts.some(part => cleanPrompt.includes(part));
      
      const fuzzyMatch = promptWords.some(word => 
        (word.length > 3 && nameLower.includes(word)) || 
        (nameLower.length > 3 && word.includes(nameLower))
      );

      const keywordMatch = char.triggerKeywords.some(kw => cleanPrompt.includes(kw.toLowerCase()));

      return nameMatch || fuzzyMatch || keywordMatch;
    });
  };

  return (
    <CharacterContext.Provider value={{ characters, addCharacter, removeCharacter, findCharactersInPrompt }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacterLibrary() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacterLibrary must be used within a CharacterProvider');
  }
  return context;
}
