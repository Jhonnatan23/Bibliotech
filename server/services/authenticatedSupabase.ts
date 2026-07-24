import { createClient } from "@supabase/supabase-js";
import { serverConfig } from "../../services/serverConfig";

const supabaseUrl = serverConfig.supabaseUrl;
const supabaseKey = serverConfig.supabaseAnonKey;

let supabaseInstance: any = null;

export function getGlobalSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas no servidor.");
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

export function getSupabaseClient(token?: string) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas no servidor.");
  }
  if (token) {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return getGlobalSupabase();
}
