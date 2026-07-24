/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ENABLE_DEMO_DATA?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_MONITORING_ENABLED?: string;
  readonly VITE_MONITORING_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
