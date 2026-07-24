
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * CONFIGURAÇÃO DO SUPABASE
 */
const supabaseUrl = config.supabaseUrl;
const supabaseKey = config.supabaseAnonKey;

export const supabase = createClient(
  supabaseUrl, 
  supabaseKey, 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      // Adiciona headers para facilitar o diagnóstico de rede se necessário
      headers: { 'x-application-name': 'bibliotech' },
    }
  }
);

// Expondo a chave para diagnóstico interno se existir
if (supabaseKey && supabaseKey !== 'placeholder-key') {
  (supabase as any).supabaseKey = supabaseKey;
}
