import { createClient } from '@supabase/supabase-js';

// Lê as chaves de forma segura do "ambiente" (do seu arquivo .env.local )
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cria e exporta a conexão
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
