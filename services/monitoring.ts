import { config } from './config';

/**
 * Níveis de log suportados pelo sistema de observabilidade.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Interface para contextos adicionais de log ou exceções.
 */
export interface MonitoringContext {
  module?: string;
  action?: string;
  route?: string;
  userId?: string;
  errorCategory?: string;
  [key: string]: any;
}

/**
 * Contexto de usuário seguro (sem dados confidenciais extras).
 */
export interface SafeUserContext {
  id: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Interface desacoplada de monitoramento.
 */
export interface MonitoringAdapter {
  initialize(): Promise<void> | void;
  captureException(error: unknown, context?: MonitoringContext): void;
  captureMessage(message: string, level: LogLevel, context?: MonitoringContext): void;
  setUser(user: SafeUserContext | null): void;
}

/**
 * Lista de chaves consideradas confidenciais/sensíveis que devem ser limpas ou ofuscadas.
 */
const SENSITIVE_KEYS = [
  'password', 'senha', 'contrasena',
  'token', 'jwt', 'access_token', 'refresh_token', 'accessToken', 'refreshToken',
  'key', 'api_key', 'apiKey', 'secret', 'secretKey', 'chavesecreta', 'service_role',
  'cookie', 'session', 'session_id', 'sessionId',
  'notes', 'notas', 'review', 'resenha', 'summary', 'resumo', 'journal', 'diario',
  'comment_text', 'comentario', 'text', 'texto',
  'address', 'endereco', 'phone', 'telefone', 'full_name', 'nome', 'authorization'
];

const MAX_DEPTH = 5;
const MAX_KEYS = 50;
const MAX_ARRAY_LENGTH = 50;
const MAX_STRING_LENGTH = 1000;

export interface SanitizedError {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  statusCode?: number;
  details?: unknown;
  [key: string]: unknown;
}

/**
 * Funcao pura para sanitizar strings, identificando e mascarando dados sensiveis.
 */
export function sanitizeString(value: unknown, keyName?: string): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  let str: string;
  if (typeof value !== 'string') {
    try {
      str = String(value);
    } catch {
      return '[UNSTRINGIFIABLE_VALUE]';
    }
  } else {
    str = value;
  }

  if (!str) return str;

  try {
    // Se a propria chave for considerada sensivel, ofuscar totalmente o valor
    if (keyName) {
      const lowerKey = keyName.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sens => lowerKey.includes(sens));
      if (isSensitive) {
        return '[CONFIDENCIAL/REMOVIDO]';
      }
    }

    // 1. Truncar strings muito grandes
    if (str.length > MAX_STRING_LENGTH) {
      str = str.substring(0, MAX_STRING_LENGTH) + '... [TRUNCATED]';
    }

    // 2. Chaves Privadas
    const pkHeader = '-----' + 'BEGIN';
    const pkFooter = 'PRIVATE' + ' KEY-----';
    const pkPattern = new RegExp(`${pkHeader} [A-Z\\s]+${pkFooter}[\\s\\S]*?-----END [A-Z\\s]+${pkFooter}`, 'gi');
    str = str.replace(pkPattern, '[PRIVATE_KEY_REDACTED]');

    // 3. URLs com credenciais (e.g. postgres://usuario:senha@host:5432/db)
    str = str.replace(/([a-zA-Z0-9+-.]+:\/\/)[^/:\s@]+:[^/:\s@]+@([^\s/]+)/gi, '$1[REDACTED]:[REDACTED]@$2');

    // 4. Query strings sensiveis
    str = str.replace(/(?:\?|&)(password|senha|token|secret|key|apiKey|jwt|cookie|api_key|access_token|refresh_token|accessToken|refreshToken)=([^&\s]+)/gi, (match, p1, p2) => {
      return match.replace(p2, '[REDACTED]');
    });

    // 5. Headers de autorizacao e Bearer tokens
    str = str.replace(/(Authorization:\s*)(Bearer\s+[^\s\r\n]+|Basic\s+[^\s\r\n]+|[^\s\r\n]+)/gi, '$1[REDACTED]');
    str = str.replace(/(Bearer\s+)[A-Za-z0-9-_\.\/+=]+/gi, '$1[REDACTED]');

    // 6. Tokens JWT
    str = str.replace(/\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+/gi, '[JWT_REDACTED]');

    // 7. Chaves de API e Secrets conhecidos
    str = str.replace(/\bsk-(?:proj-)?[a-zA-Z0-9-_]{15,}\b/gi, '[API_KEY_REDACTED]');
    str = str.replace(/\bAIzaSy[a-zA-Z0-9-_]{20,45}\b/gi, '[API_KEY_REDACTED]');
    str = str.replace(/\bsb-[a-zA-Z0-9-_]{10,}\b/gi, '[API_KEY_REDACTED]');
    str = str.replace(/\bsbp_[a-zA-Z0-9-_]{10,}\b/gi, '[API_KEY_REDACTED]');

    // 8. Key-value pairs mantendo formatacao exata (password=xxx, password: xxx, password is xxx)
    str = str.replace(/\b(password|senha|contrasena|secret|secret_string|secret_key|secretKey|chavesecreta|service_role|api[_-]?key|apikey)\s*(=|:|\bis\b)\s*["']?([^\s"'`\,;]+)["']?/gi, (match, k, op, v) => {
      if (op === '=') return `${k}=[REDACTED]`;
      if (op === ':') return `${k}: [REDACTED]`;
      return `${k} ${op} [REDACTED]`;
    });
    str = str.replace(/\b(token|access_token|refresh_token)\s+(is|=)\s+([^\s"'`\,;]+)/gi, (match, k, op, v) => {
      if (op === '=') return `${k}=[REDACTED]`;
      return `${k} ${op} [REDACTED]`;
    });
    str = str.replace(/\b(token)\s+([A-Za-z0-9-_\.\/+=]{8,})\b/gi, '$1 [REDACTED]');

    // 9. Cookies em strings
    str = str.replace(/\b(session_id|sessionId|session|cookie|jwt)=[^;\s]+/gi, '$1=[REDACTED]');

    // 10. E-mails (usuario@provedor.com -> u***o@provedor.com)
    str = str.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, p1, p2) => {
      if (p1.length <= 2) return `*@${p2}`;
      return `${p1[0]}***${p1[p1.length - 1]}@${p2}`;
    });

    return str;
  } catch {
    return '[SANITIZATION_FAILED]';
  }
}

/**
 * Função de sanitização profunda para objetos e valores genéricos.
 * Preserva o objeto original, trata referências circulares e limita profundidade.
 */
export function sanitizeObject(data: unknown, depth = 0, seen = new WeakSet()): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object' && typeof data !== 'function') {
    if (typeof data === 'string') {
      return sanitizeString(data);
    }
    return data;
  }

  if (depth > MAX_DEPTH) {
    return '[MAX_DEPTH_REACHED]';
  }

  try {
    if (data instanceof Error) {
      return sanitizeError(data);
    }

    if (seen.has(data as object)) {
      return '[Circular]';
    }
    seen.add(data as object);

    if (Array.isArray(data)) {
      const truncatedArray = data.slice(0, MAX_ARRAY_LENGTH);
      const sanitizedArray = truncatedArray.map(item => sanitizeObject(item, depth + 1, seen));
      if (data.length > MAX_ARRAY_LENGTH) {
        sanitizedArray.push(`[... ${data.length - MAX_ARRAY_LENGTH} elements truncated]`);
      }
      return sanitizedArray;
    }

    const sanitized: Record<string, unknown> = {};
    const keys = Object.keys(data as object);
    const truncatedKeys = keys.slice(0, MAX_KEYS);

    for (const key of truncatedKeys) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sens => lowerKey.includes(sens));

      if (isSensitive) {
        sanitized[key] = '[CONFIDENCIAL/REMOVIDO]';
      } else {
        const val = (data as Record<string, unknown>)[key];
        sanitized[key] = sanitizeObject(val, depth + 1, seen);
      }
    }

    if (keys.length > MAX_KEYS) {
      sanitized['__truncated_keys__'] = `${keys.length - MAX_KEYS} keys truncated`;
    }

    return sanitized;
  } catch {
    return '[SANITIZATION_FAILED]';
  }
}

/**
 * Sanitiza exceções/erros garantindo que mensagens e stack traces estejam livres de dados confidenciais.
 */
export function sanitizeError(error: unknown): SanitizedError {
  if (!error) {
    return {
      name: 'Error',
      message: 'Unknown error',
    };
  }

  try {
    if (error instanceof Error) {
      const sanitizedMsg = sanitizeString(error.message);
      const sanitizedStack = error.stack ? sanitizeString(error.stack) : undefined;

      const result: SanitizedError = {
        name: error.name || 'Error',
        message: sanitizedMsg,
        stack: sanitizedStack,
      };

      if ((error as any).code !== undefined) {
        result.code = (error as any).code;
      }
      if ((error as any).statusCode !== undefined) {
        result.statusCode = (error as any).statusCode;
      }

      for (const key of Object.keys(error)) {
        if (['name', 'message', 'stack', 'code', 'statusCode'].includes(key)) continue;
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some(sens => lowerKey.includes(sens))) {
          result[key] = '[CONFIDENCIAL/REMOVIDO]';
        } else {
          result[key] = sanitizeObject((error as any)[key]);
        }
      }

      return result;
    }

    if (typeof error === 'object') {
      const obj = error as Record<string, unknown>;
      const sanitizedObj = sanitizeObject(obj) as Record<string, unknown>;
      return {
        name: typeof obj.name === 'string' ? obj.name : 'Error',
        message: typeof obj.message === 'string' ? sanitizeString(obj.message) : sanitizeString(String(obj)),
        stack: typeof obj.stack === 'string' ? sanitizeString(obj.stack) : undefined,
        ...sanitizedObj,
      };
    }

    const strMsg = sanitizeString(String(error));
    return {
      name: 'Error',
      message: strMsg,
    };
  } catch {
    return {
      name: 'Error',
      message: '[SANITIZATION_FAILED]',
    };
  }
}

/**
 * Wrapper para manter retrocompatibilidade com chamadas de sanitizeData.
 */
export function sanitizeData(data: any, depth = 0, seen = new WeakSet()): any {
  return sanitizeObject(data, depth, seen);
}

/**
 * ---------------------------------------------------------------------------
 * ADAPTADORES DE MONITORAMENTO
 * ---------------------------------------------------------------------------
 */

/**
 * Adaptador Nulo Seguro
 */
export class NoopMonitoringAdapter implements MonitoringAdapter {
  initialize() {}
  captureException(error: unknown, context?: MonitoringContext) {}
  captureMessage(message: string, level: LogLevel, context?: MonitoringContext) {}
  setUser(user: SafeUserContext | null) {}
}

/**
 * Auxiliar para analisar a Sentry DSN
 */
export function parseSentryDsn(dsn: string) {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, '');
    const host = url.host;
    const protocol = url.protocol;
    const storeUrl = `${protocol}//${host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`;
    return { storeUrl, publicKey, projectId };
  } catch {
    return null;
  }
}

/**
 * Adaptador Real Sentry via HTTP Direto (Envelope / Store API)
 */
export class SentryHttpMonitoringAdapter implements MonitoringAdapter {
  private storeUrl: string | null = null;
  private currentUser: SafeUserContext | null = null;

  constructor(private dsn: string) {
    const parsed = parseSentryDsn(dsn);
    if (parsed) {
      this.storeUrl = parsed.storeUrl;
    }
  }

  initialize() {}

  async captureException(error: unknown, context?: MonitoringContext): Promise<void> {
    if (!this.storeUrl) return;

    try {
      const errObj = error instanceof Error ? error : new Error(String(error));
      const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hex32 = uuid.padEnd(32, '0').substring(0, 32);

      const payload = {
        event_id: hex32,
        timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        platform: 'javascript',
        level: 'error',
        logger: 'javascript',
        exception: {
          values: [
            {
              type: errObj.name || 'Error',
              value: errObj.message,
              stacktrace: errObj.stack ? {
                frames: errObj.stack.split('\n').map(line => ({ instruction_addr: '0x0', function: line.trim() })).reverse()
              } : undefined
            }
          ]
        },
        user: this.currentUser ? {
          id: this.currentUser.id,
          email: this.currentUser.email
        } : undefined,
        extra: context
      };

      await fetch(this.storeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Falha silenciosa
    }
  }

  async captureMessage(message: string, level: LogLevel, context?: MonitoringContext): Promise<void> {
    if (!this.storeUrl) return;

    try {
      const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hex32 = uuid.padEnd(32, '0').substring(0, 32);

      const payload = {
        event_id: hex32,
        timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        platform: 'javascript',
        level: level === 'warn' ? 'warning' : level,
        logger: 'javascript',
        message: {
          formatted: message
        },
        user: this.currentUser ? {
          id: this.currentUser.id,
          email: this.currentUser.email
        } : undefined,
        extra: context
      };

      await fetch(this.storeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Falha silenciosa
    }
  }

  setUser(user: SafeUserContext | null) {
    this.currentUser = user;
  }
}

/**
 * Adaptador HTTP Genérico para Webhooks ou endpoints customizados estruturados
 */
export class GenericHttpMonitoringAdapter implements MonitoringAdapter {
  private currentUser: SafeUserContext | null = null;

  constructor(private url: string) {}

  initialize() {}

  async captureException(error: unknown, context?: MonitoringContext): Promise<void> {
    try {
      const errObj = error instanceof Error ? error : new Error(String(error));
      const payload = {
        timestamp: new Date().toISOString(),
        type: 'exception',
        error: {
          name: errObj.name,
          message: errObj.message,
          stack: errObj.stack
        },
        user: this.currentUser,
        context
      };

      await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Falha silenciosa
    }
  }

  async captureMessage(message: string, level: LogLevel, context?: MonitoringContext): Promise<void> {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        type: 'message',
        level,
        message,
        user: this.currentUser,
        context
      };

      await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Falha silenciosa
    }
  }

  setUser(user: SafeUserContext | null) {
    this.currentUser = user;
  }
}

// Adaptador ativo
let activeAdapter: MonitoringAdapter = new NoopMonitoringAdapter();

export function getActiveAdapter(): MonitoringAdapter {
  return activeAdapter;
}

export function configureMonitoring() {
  if (!config.monitoringEnabled) {
    activeAdapter = new NoopMonitoringAdapter();
    return;
  }

  const dsn = config.monitoringDsn;
  if (!dsn) {
    activeAdapter = new NoopMonitoringAdapter();
    return;
  }

  if (dsn.includes('sentry.io')) {
    activeAdapter = new SentryHttpMonitoringAdapter(dsn);
  } else {
    activeAdapter = new GenericHttpMonitoringAdapter(dsn);
  }
}

// Inicializar adaptador
configureMonitoring();

/**
 * Captura e envia uma exceção de forma segura.
 */
export function captureException(error: any, context: MonitoringContext = {}): void {
  const sanitizedErr = sanitizeError(error);
  const sanitizedContext = sanitizeData(context);
  
  try {
    activeAdapter.captureException(sanitizedErr, sanitizedContext);
  } catch (e) {
    // Falha silenciosa
  }

  if (config.env !== 'produção') {
    console.group(`%c[Observabilidade - EXCEÇÃO] ${sanitizedErr.name || 'Erro'}: ${sanitizedErr.message || 'Erro sem mensagem'}`, 'color: #ef4444; font-weight: bold;');
    console.error(`[Observabilidade - EXCEÇÃO] ${sanitizedErr.name || 'Erro'}: ${sanitizedErr.message || 'Erro sem mensagem'}`, sanitizedErr);
    console.log('Contexto:', sanitizedContext);
    console.groupEnd();
  } else {
    console.error(`[Monitoramento] Erro capturado (${sanitizedErr.name || 'Erro'}): ${sanitizedErr.message || 'Erro interno'}`);
  }
}

/**
 * Captura e envia mensagens estruturadas de auditoria ou telemetria operacional.
 */
export function captureMessage(message: string, level: LogLevel = 'info', context: MonitoringContext = {}): void {
  const sanitizedMessage = sanitizeString(message);
  const sanitizedContext = sanitizeData(context);

  try {
    activeAdapter.captureMessage(sanitizedMessage, level, sanitizedContext);
  } catch (e) {
    // Falha silenciosa
  }

  if (config.env !== 'produção') {
    const colors = {
      debug: 'color: #94a3b8;',
      info: 'color: #3b82f6; font-weight: bold;',
      warn: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;',
    };
    console.log(`%c[Observabilidade - ${level.toUpperCase()}] ${sanitizedMessage}`, colors[level], sanitizedContext);
  } else if (level === 'error' || level === 'warn') {
    console.warn(`[Monitoramento - ${level.toUpperCase()}] ${sanitizedMessage}`);
  }
}

/**
 * Define o usuário ativo nas ferramentas de monitoramento.
 */
export function setUser(user: SafeUserContext | null): void {
  try {
    activeAdapter.setUser(user);
  } catch (e) {
    // Falha silenciosa
  }
}

/**
 * Logger centralizado do cliente para evitar console.log avulso em produção.
 */
export const logger = {
  debug(message: any, ...args: any[]): void {
    if (config.env !== 'produção') {
      const msg = typeof message === 'string' ? message : (message?.message || String(message));
      const context: Record<string, any> = {};
      args.forEach((curr, index) => {
        if (curr && typeof curr === 'object') {
          if (curr instanceof Error) {
            context.error = curr.message || String(curr);
          } else {
            Object.assign(context, curr);
          }
        } else if (curr !== undefined) {
          context[`arg${index}`] = curr;
        }
      });
      captureMessage(msg, 'debug', context);
    }
  },
  info(message: any, ...args: any[]): void {
    if (config.env !== 'produção') {
      const msg = typeof message === 'string' ? message : (message?.message || String(message));
      const context: Record<string, any> = {};
      args.forEach((curr, index) => {
        if (curr && typeof curr === 'object') {
          if (curr instanceof Error) {
            context.error = curr.message || String(curr);
          } else {
            Object.assign(context, curr);
          }
        } else if (curr !== undefined) {
          context[`arg${index}`] = curr;
        }
      });
      captureMessage(msg, 'info', context);
    }
  },
  warn(message: any, ...args: any[]): void {
    const msg = typeof message === 'string' ? message : (message?.message || String(message));
    const context: Record<string, any> = {};
    args.forEach((curr, index) => {
      if (curr && typeof curr === 'object') {
        if (curr instanceof Error) {
          context.error = curr.message || String(curr);
        } else {
          Object.assign(context, curr);
        }
      } else if (curr !== undefined) {
        context[`arg${index}`] = curr;
      }
    });
    captureMessage(msg, 'warn', context);
  },
  error(message: any, ...args: any[]): void {
    const msg = typeof message === 'string' ? message : (message?.message || String(message));
    const context: Record<string, any> = {};
    args.forEach((curr, index) => {
      if (curr && typeof curr === 'object') {
        if (curr instanceof Error) {
          context.error = curr.message || String(curr);
        } else {
          Object.assign(context, curr);
        }
      } else if (curr !== undefined) {
        context[`arg${index}`] = curr;
      }
    });
    captureMessage(msg, 'error', context);
  },
};

// Ouvintes globais
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('vite') || event.message?.includes('ws')) return;
    
    captureException(event.error || new Error(event.message), {
      category: 'unhandled_exception',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason || new Error('Rejeição de promessa não tratada'), {
      category: 'unhandled_rejection',
    });
  });
}
