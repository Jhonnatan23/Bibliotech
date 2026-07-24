/**
 * MÓDULO CENTRALIZADO DE CONFIGURAÇÃO DO CLIENTE (FRONT-END)
 * 
 * Centraliza e valida todas as variáveis de ambiente públicas do Vite.
 * Garante que chaves privadas nunca vazem ou sejam incluídas no bundle do navegador.
 */

export type AppEnv = 'development' | 'staging' | 'production' | 'test' | 'desenvolvimento' | 'homologação' | 'produção' | 'teste';

export interface ClientConfig {
  /** URL pública de conexão com o banco de dados Supabase */
  supabaseUrl: string;
  /** Chave pública anônima do Supabase */
  supabaseAnonKey: string;
  /** Habilitar ou desabilitar o carregamento ou preenchimento automático de dados de demonstração */
  enableDemoData: boolean;
  /** O ambiente atual do aplicativo */
  env: AppEnv;
  /** Se o monitoramento externo está ativado */
  monitoringEnabled: boolean;
  /** DSN ou URL do serviço de monitoramento (Sentry, Logtail, etc.) */
  monitoringDsn: string;
}

// Converte string/caracteres para booleano com fallback seguro
export const parseBool = (value: any, defaultValue = false): boolean => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  const str = String(value).toLowerCase().trim();
  return str === 'true' || str === '1' || str === 'yes' || str === 'on' || str === 'enabled';
};

// Helper seguro para obter variáveis de ambiente no cliente sem estourar exceção quando import.meta.env for undefined
const getSafeClientEnv = (): Record<string, any> => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      return import.meta.env;
    }
  } catch {
    // ignorar erro
  }
  if (typeof process !== 'undefined' && process && process.env) {
    return process.env;
  }
  return {};
};

// Obter e normalizar o ambiente do front-end
export const getAppEnv = (): AppEnv => {
  const envObj = getSafeClientEnv();
  const rawEnv = (envObj.VITE_APP_ENV || envObj.MODE || envObj.NODE_ENV || 'development').toString().toLowerCase().trim();
  
  if (rawEnv === 'production' || rawEnv === 'produção' || rawEnv === 'producao') {
    return 'production';
  }
  if (rawEnv === 'staging' || rawEnv === 'homologação' || rawEnv === 'homologacao') {
    return 'staging';
  }
  if (rawEnv === 'test' || rawEnv === 'teste') {
    return 'test';
  }
  return 'development';
};

const currentEnv = getAppEnv();

// Validação de URLs
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Validação de placeholders
export const isPlaceholder = (val: string): boolean => {
  if (!val) return false;
  const normalized = val.toLowerCase().trim();
  const placeholders = [
    'placeholder',
    'sua-url-do-supabase',
    'sua-chave-anon-key',
    'sua-chave-de-api-secreta',
    'seu-email-de-envio',
    'sua-senha-de-aplicativo',
    'sua-chave-anon-key-publica-do-supabase',
    'sua-chave-de-api-secreta-do-google-books'
  ];
  return placeholders.some(ph => normalized.includes(ph));
};

// Validação de formato minimamente válido da chave anon do Supabase (JWT)
export const isValidSupabaseAnonKey = (key: string): boolean => {
  if (!key) return false;
  const cleaned = key.trim();
  if (cleaned.length < 20) return false;
  // Deve possuir o formato de um JWT (3 partes separadas por pontos) ou começar com eyJ
  return cleaned.startsWith('eyJ') || cleaned.split('.').length === 3;
};

// Função centralizada de validação
export const validateClientConfig = (cfg: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  monitoringEnabled: boolean;
  monitoringDsn: string;
  env: string;
}): void => {
  const errors: string[] = [];

  // 1. Validar ambiente atual
  const validEnvs = ['development', 'staging', 'production', 'test', 'desenvolvimento', 'homologação', 'produção', 'teste'];
  if (!validEnvs.includes(cfg.env)) {
    errors.push(`Ambiente atual inválido: '${cfg.env}'. Deve ser um de: development, staging, production, test`);
  }

  // 2. Validar Supabase URL
  if (!cfg.supabaseUrl) {
    errors.push("A variável 'VITE_SUPABASE_URL' é obrigatória e não pode estar vazia.");
  } else if (isPlaceholder(cfg.supabaseUrl)) {
    errors.push("A variável 'VITE_SUPABASE_URL' não pode conter valores fictícios ou placeholders.");
  } else if (!isValidUrl(cfg.supabaseUrl)) {
    errors.push(`A variável 'VITE_SUPABASE_URL' possui uma URL inválida: '${cfg.supabaseUrl}'`);
  }

  // 3. Validar Supabase Anon Key
  if (!cfg.supabaseAnonKey) {
    errors.push("A variável 'VITE_SUPABASE_ANON_KEY' é obrigatória e não pode estar vazia.");
  } else if (isPlaceholder(cfg.supabaseAnonKey)) {
    errors.push("A variável 'VITE_SUPABASE_ANON_KEY' não pode conter valores fictícios ou placeholders.");
  } else if (!isValidSupabaseAnonKey(cfg.supabaseAnonKey)) {
    errors.push("A variável 'VITE_SUPABASE_ANON_KEY' não possui um formato minimamente válido de chave pública (deve ser um JWT ou iniciar com 'eyJ').");
  }

  // 4. Validar Monitoramento Condicional
  if (cfg.monitoringEnabled) {
    if (!cfg.monitoringDsn) {
      errors.push("A variável 'VITE_MONITORING_DSN' é obrigatória quando o monitoramento está ativado ('VITE_MONITORING_ENABLED=true').");
    } else if (isPlaceholder(cfg.monitoringDsn)) {
      errors.push("A variável 'VITE_MONITORING_DSN' não pode conter placeholders quando o monitoramento está ativado.");
    } else if (!isValidUrl(cfg.monitoringDsn)) {
      errors.push(`A variável 'VITE_MONITORING_DSN' possui uma URL inválida: '${cfg.monitoringDsn}'`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`[ERRO DE CONFIGURAÇÃO DO CLIENTE]:\n${errors.map((err, i) => `  ${i + 1}. ${err}`).join('\n')}`);
  }
};

// Extrair variáveis brutas
const clientEnvObj = getSafeClientEnv();
const rawSupabaseUrl = (clientEnvObj.VITE_SUPABASE_URL || '').trim();
const rawSupabaseAnonKey = (clientEnvObj.VITE_SUPABASE_ANON_KEY || '').trim();
const rawEnableDemoData = clientEnvObj.VITE_ENABLE_DEMO_DATA;
const rawMonitoringEnabled = clientEnvObj.VITE_MONITORING_ENABLED;
const rawMonitoringDsn = (clientEnvObj.VITE_MONITORING_DSN || '').trim();

// Executa validação de avisos apenas se não estiver em ambiente de teste
if (currentEnv !== 'test' && currentEnv !== 'teste') {
  try {
    validateClientConfig({
      supabaseUrl: rawSupabaseUrl,
      supabaseAnonKey: rawSupabaseAnonKey,
      monitoringEnabled: parseBool(rawMonitoringEnabled, false),
      monitoringDsn: rawMonitoringDsn,
      env: currentEnv
    });
  } catch (err: any) {
    console.warn("⚠️ Aviso de configuração do cliente:", err.message);
  }
}

const isProdOrStaging = currentEnv === 'production' || currentEnv === 'staging' || currentEnv === 'produção' || currentEnv === 'homologação';

const DEFAULT_SUPABASE_URL = 'https://rqomssyihwvbwtoyjwws.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb21zc3lpaHd2Ynd0b3lqd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTY5OTksImV4cCI6MjA4MjY3Mjk5OX0.Fb1JORY5LXRhJdnnVen68_VNzhlGna5GO7xW996uaQU';

export const config: ClientConfig = {
  supabaseUrl: rawSupabaseUrl || DEFAULT_SUPABASE_URL,
  supabaseAnonKey: rawSupabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY,
  enableDemoData: isProdOrStaging ? false : parseBool(rawEnableDemoData, false),
  env: currentEnv,
  monitoringEnabled: parseBool(rawMonitoringEnabled, false),
  monitoringDsn: rawMonitoringDsn,
};
