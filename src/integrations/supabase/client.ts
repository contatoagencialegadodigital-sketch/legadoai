import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use as variáveis do .env (preferindo as de China se existirem, fallback para as padrão)
const SUPABASE_URL = import.meta.env.VITE_CHINA_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_CHINA_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn('Supabase: Credenciais incompletas no .env. O aplicativo pode apresentar problemas.');
}

export const supabase = createClient<Database>(
  SUPABASE_URL || '', 
  SUPABASE_PUBLISHABLE_KEY || '', 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);