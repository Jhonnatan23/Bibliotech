
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE
 */
const supabaseUrl = 'https://rqomssyihwvbwtoyjwws.supabase.co';

// Chave 'anon public' do Supabase para acesso ao backend.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb21zc3lpaHd2Ynd0b3lqd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTY5OTksImV4cCI6MjA4MjY3Mjk5OX0.Fb1JORY5LXRhJdnnVen68_VNzhlGna5GO7xW996uaQU'; 

if (supabaseKey.startsWith('sb_')) {
  console.warn("⚠️ ALERTA BIBLIOTECH: Você configurou uma chave do Stripe em vez do Supabase. O login NÃO vai funcionar até você trocar por uma chave 'eyJ...'.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Expondo a chave para diagnóstico interno (apenas para o componente Auth)
(supabase as any).supabaseKey = supabaseKey;
