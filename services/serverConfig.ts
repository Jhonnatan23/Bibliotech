/**
 * MÓDULO CENTRALIZADO DE CONFIGURAÇÃO DO SERVIDOR (BACK-END)
 * 
 * Centraliza e valida todas as chaves e segredos utilizados no backend Express.
 * Este arquivo NÃO deve ser importado por componentes ou arquivos do front-end.
 */
import dotenv from 'dotenv';
import { AppEnv } from './config';

// Carrega as variáveis de ambiente a partir do arquivo .env
dotenv.config();

export interface ServerConfig {
  /** URL pública ou privada do Supabase */
  supabaseUrl: string;
  /** Chave pública anônima do Supabase */
  supabaseAnonKey: string;
  /** Chave de API secreta para o Gemini (Inteligência Artificial) */
  geminiApiKey: string;
  /** Chave de API para o Google Books (Opcional) */
  googleBooksApiKey: string;
  /** Se o serviço de envio de e-mail está ativado no servidor */
  emailEnabled: boolean;
  /** Conta SMTP/Gmail de envio de e-mails (Opcional) */
  emailUser: string;
  /** Senha de aplicativo ou senha SMTP para envio de e-mails (Opcional) */
  emailPass: string;
  /** Porta na qual o servidor Express é executado */
  port: number;
  /** O ambiente atual do aplicativo */
  env: AppEnv;
  /** Flag para controlar se dados de demonstração estão habilitados */
  enableDemoData: boolean;
  /** Se o monitoramento de erros está ativado no servidor */
  monitoringEnabled: boolean;
  /** DSN do serviço de monitoramento para o servidor */
  monitoringDsn: string;
}

export const parseBool = (value: any, defaultValue = false): boolean => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  const str = String(value).toLowerCase().trim();
  return str === 'true' || str === '1' || str === 'yes' || str === 'on' || str === 'enabled';
};

// Obter e normalizar o ambiente do servidor
export const getServerEnv = (): AppEnv => {
  const rawEnv = (process.env.NODE_ENV || process.env.VITE_APP_ENV || 'development').toLowerCase().trim();
  
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

const currentEnv = getServerEnv();

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

// Função centralizada de validação do servidor
export const validateServerConfig = (cfg: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
  googleBooksApiKey: string;
  emailEnabled: boolean;
  emailUser: string;
  emailPass: string;
  port: number;
  env: string;
  monitoringEnabled: boolean;
  monitoringDsn: string;
}): void => {
  const errors: string[] = [];

  // 1. Validar ambiente atual
  const validEnvs = ['development', 'staging', 'production', 'test', 'desenvolvimento', 'homologação', 'produção', 'teste'];
  if (!validEnvs.includes(cfg.env)) {
    errors.push(`Ambiente atual inválido: '${cfg.env}'. Deve ser um de: development, staging, production, test`);
  }

  // 2. Validar Supabase URL
  if (!cfg.supabaseUrl) {
    errors.push("A variável 'VITE_SUPABASE_URL' é obrigatória no servidor e não pode estar vazia.");
  } else if (isPlaceholder(cfg.supabaseUrl)) {
    errors.push("A variável 'VITE_SUPABASE_URL' não pode conter placeholders.");
  } else if (!isValidUrl(cfg.supabaseUrl)) {
    errors.push(`A variável 'VITE_SUPABASE_URL' possui uma URL inválida: '${cfg.supabaseUrl}'`);
  }

  // 3. Validar Supabase Anon Key
  if (!cfg.supabaseAnonKey) {
    errors.push("A variável 'VITE_SUPABASE_ANON_KEY' é obrigatória no servidor e não pode estar vazia.");
  } else if (isPlaceholder(cfg.supabaseAnonKey)) {
    errors.push("A variável 'VITE_SUPABASE_ANON_KEY' não pode conter placeholders.");
  } else if (!isValidSupabaseAnonKey(cfg.supabaseAnonKey)) {
    errors.push("A variável 'VITE_SUPABASE_ANON_KEY' não possui um formato de chave pública minimamente válido (deve ser um JWT ou iniciar com 'eyJ').");
  }

  // 4. Validar Gemini API Key (Se informada ou placeholder)
  if (isPlaceholder(cfg.geminiApiKey)) {
    errors.push("A variável 'GEMINI_API_KEY' não pode conter placeholders.");
  }

  // 5. Validar Porta (1 - 65535)
  if (isNaN(cfg.port) || cfg.port < 1 || cfg.port > 65535) {
    errors.push(`Porta inválida: '${cfg.port}'. Deve ser um número inteiro entre 1 e 65535.`);
  }

  // 6. Validar Google Books API Key (Opcional - mas se informada, não pode conter placeholders)
  if (cfg.googleBooksApiKey && isPlaceholder(cfg.googleBooksApiKey)) {
    errors.push("A variável 'GOOGLE_BOOKS_API_KEY' não pode conter placeholders.");
  }

  // 7. Validar Monitoramento Condicional
  if (cfg.monitoringEnabled) {
    if (!cfg.monitoringDsn) {
      errors.push("A variável 'VITE_MONITORING_DSN' é obrigatória quando o monitoramento está ativado ('VITE_MONITORING_ENABLED=true').");
    } else if (isPlaceholder(cfg.monitoringDsn)) {
      errors.push("A variável 'VITE_MONITORING_DSN' não pode conter placeholders quando o monitoramento está ativado.");
    } else if (!isValidUrl(cfg.monitoringDsn)) {
      errors.push(`A variável 'VITE_MONITORING_DSN' possui uma URL inválida: '${cfg.monitoringDsn}'`);
    }
  }

  // 8. Validar E-mail Condicional (Somente se EMAIL_ENABLED=true)
  if (cfg.emailEnabled) {
    if (!cfg.emailUser) {
      errors.push("A variável de e-mail 'EMAIL_USER' é obrigatória quando a funcionalidade de e-mail está ativada ('EMAIL_ENABLED=true').");
    } else if (isPlaceholder(cfg.emailUser)) {
      errors.push("A variável 'EMAIL_USER' possui um valor de placeholder.");
    } else if (!cfg.emailUser.includes('@')) {
      errors.push(`A variável 'EMAIL_USER' possui um formato de e-mail inválido: '${cfg.emailUser}'`);
    }

    if (!cfg.emailPass) {
      errors.push("A variável de e-mail 'EMAIL_PASS' é obrigatória quando a funcionalidade de e-mail está ativada ('EMAIL_ENABLED=true').");
    } else if (isPlaceholder(cfg.emailPass)) {
      errors.push("A variável 'EMAIL_PASS' possui um valor de placeholder.");
    }
  }

  if (errors.length > 0) {
    throw new Error(`[ERRO DE CONFIGURAÇÃO DO SERVIDOR]:\n${errors.map((err, i) => `  ${i + 1}. ${err}`).join('\n')}`);
  }
};

// Extrair variáveis
const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
const googleBooksApiKey = (process.env.GOOGLE_BOOKS_API_KEY || '').trim();
const emailEnabled = parseBool(process.env.EMAIL_ENABLED, false);
const emailUser = (process.env.EMAIL_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || '').trim();
const port = parseInt(process.env.PORT || '3000', 10);
const enableDemoData = parseBool(process.env.VITE_ENABLE_DEMO_DATA, false);
const monitoringEnabled = parseBool(process.env.VITE_MONITORING_ENABLED, false);
const monitoringDsn = (process.env.VITE_MONITORING_DSN || '').trim();

export let serverConfigError: Error | null = null;

// Executa validação fail-fast apenas se não estiver em ambiente de teste
if (currentEnv !== 'test' && currentEnv !== 'teste') {
  try {
    validateServerConfig({
      supabaseUrl,
      supabaseAnonKey,
      geminiApiKey,
      googleBooksApiKey,
      emailEnabled,
      emailUser,
      emailPass,
      port,
      env: currentEnv,
      monitoringEnabled,
      monitoringDsn
    });
  } catch (err: any) {
    serverConfigError = err;
    console.error(`
======================================================================
⚠️ [ALERTA DE CONFIGURAÇÃO CRÍTICA DO SERVIDOR NA INICIALIZAÇÃO]
O servidor continuará iniciando para permitir o deploy e o diagnóstico de rede,
mas as seguintes inconsistências de variáveis de ambiente foram identificadas:

${err.message}
======================================================================
    `);
  }
}

const DEFAULT_SUPABASE_URL = 'https://rqomssyihwvbwtoyjwws.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb21zc3lpaHd2Ynd0b3lqd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTY5OTksImV4cCI6MjA4MjY3Mjk5OX0.Fb1JORY5LXRhJdnnVen68_VNzhlGna5GO7xW996uaQU';

export const serverConfig: ServerConfig = {
  supabaseUrl: supabaseUrl || DEFAULT_SUPABASE_URL,
  supabaseAnonKey: supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY,
  geminiApiKey,
  googleBooksApiKey,
  emailEnabled,
  emailUser,
  emailPass,
  port,
  env: currentEnv,
  enableDemoData,
  monitoringEnabled,
  monitoringDsn,
};
