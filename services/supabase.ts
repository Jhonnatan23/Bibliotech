
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE
 */
const supabaseUrl = 'https://rqomssyihwvbwtoyjwws.supabase.co';

// Chave 'anon public' do Supabase para acesso ao backend.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb21zc3lpaHd2Ynd0b3lqd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTY5OTksImV4cCI6MjA4MjY3Mjk5OX0.Fb1JORY5LXRhJdnnVen68_VNzhlGna5GO7xW996uaQU'; 

if (supabaseKey.startsWith('sb_')) {
  console.warn("⚠️ ALERTA BIBLIOTECH: Chave do Stripe detectada em vez do Supabase.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    // Adiciona headers para facilitar o diagnóstico de rede se necessário
    headers: { 'x-application-name': 'bibliotech' },
  }
});

// Expondo a chave para diagnóstico interno
(supabase as any).supabaseKey = supabaseKey;
