import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { serverConfig } from './serverConfig';
import { normalizeError } from './appError';

/**
 * Níveis de log do servidor.
 */
export type ServerLogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Lista de campos considerados confidenciais no backend para sanitização automática.
 */
const SENSITIVE_KEYS = [
  'password', 'senha', 'contrasena',
  'token', 'jwt', 'access_token', 'refresh_token', 'accessToken', 'refreshToken',
  'key', 'api_key', 'apiKey', 'secret', 'secretKey', 'chavesecreta',
  'cookie', 'session', 'session_id', 'sessionId',
  'notes', 'notas', 'review', 'resenha', 'summary', 'resumo', 'journal', 'diario',
  'comment_text', 'comentario', 'text', 'texto',
  'address', 'endereco', 'phone', 'telefone', 'full_name', 'nome', 'authorization'
];

const MAX_DEPTH = 5;
const MAX_KEYS = 50;
const MAX_ARRAY_LENGTH = 50;
const MAX_STRING_LENGTH = 1000;

function truncateServerString(str: string): string {
  if (str.length > MAX_STRING_LENGTH) {
    return str.substring(0, MAX_STRING_LENGTH) + '... [TRUNCATED]';
  }
  return str;
}

import { sanitizeString, sanitizeObject, sanitizeError, SanitizedError } from './monitoring';

export const sanitizeServerString = sanitizeString;
export const sanitizeServerData = sanitizeObject;
export { sanitizeString, sanitizeObject, sanitizeError };
export type { SanitizedError };

/**
 * Envia um erro/exceção do servidor para o serviço de monitoramento.
 */
export function serverCaptureException(error: any, context: Record<string, any> = {}): void {
  const sanitizedError = sanitizeError(error);
  const sanitizedContext = sanitizeObject(context);

  const payload = {
    timestamp: new Date().toISOString(),
    type: 'exception',
    environment: serverConfig.env,
    version: '1.0.0',
    platform: 'node',
    error: sanitizedError,
    context: sanitizedContext,
  };

  if (serverConfig.monitoringEnabled && serverConfig.env === 'produção') {
    sendToServerMonitoringService(payload);
  }

  if (serverConfig.env !== 'produção') {
    console.error(`\x1b[31m[Servidor - EXCEÇÃO]\x1b[0m ${sanitizedError.name || 'Erro'}: ${sanitizedError.message || 'Erro interno'}`);
    if (sanitizedError.stack) {
      console.error(sanitizedError.stack);
    }
    console.error('Contexto:', sanitizedContext);
  } else {
    console.error(`[Servidor - EXCEÇÃO] ${sanitizedError.name || 'Erro'}: ${sanitizedError.message || 'Erro interno'}`);
  }
}

/**
 * Envia uma mensagem estruturada de log para o serviço de monitoramento.
 */
export function serverCaptureMessage(message: string, level: ServerLogLevel = 'info', context: Record<string, any> = {}): void {
  const sanitizedMessage = sanitizeServerString(message);
  const sanitizedContext = sanitizeServerData(context);

  const payload = {
    timestamp: new Date().toISOString(),
    type: 'message',
    level,
    environment: serverConfig.env,
    version: '1.0.0',
    platform: 'node',
    message: sanitizedMessage,
    context: sanitizedContext,
  };

  if (serverConfig.monitoringEnabled && serverConfig.env === 'produção') {
    sendToServerMonitoringService(payload);
  }

  if (serverConfig.env !== 'produção') {
    const colors = {
      debug: '\x1b[90m', // cinza
      info: '\x1b[36m',  // ciano
      warn: '\x1b[33m',  // amarelo
      error: '\x1b[31m', // vermelho
    };
    console.log(`${colors[level]}[Servidor - ${level.toUpperCase()}]\x1b[0m ${sanitizedMessage}`, sanitizedContext);
  } else if (level === 'error' || level === 'warn') {
    console.warn(`[Servidor - ${level.toUpperCase()}] ${sanitizedMessage}`);
  }
}

/**
 * Envia dados formatados para o DSN ou endpoint do monitoramento.
 */
async function sendToServerMonitoringService(payload: any): Promise<void> {
  try {
    const url = serverConfig.monitoringDsn || 'https://placeholder-url.monitoring.io';
    // Se não for um placeholder real, podemos enviar uma chamada de rede real
    if (!url.includes('placeholder')) {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(err => {
        console.error('[Monitoramento Servidor] Falha ao enviar para o DSN:', sanitizeString(err?.message));
      });
    }
  } catch (err) {
    // Falha silenciosa em produção
  }
}

/**
 * Logger estruturado do servidor para depuração local e em nuvem.
 */
export const serverLogger = {
  debug(message: any, ...args: any[]): void {
    if (serverConfig.env !== 'produção') {
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
      serverCaptureMessage(msg, 'debug', context);
    }
  },
  info(message: any, ...args: any[]): void {
    if (serverConfig.env !== 'produção') {
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
      serverCaptureMessage(msg, 'info', context);
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
    serverCaptureMessage(msg, 'warn', context);
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
    serverCaptureMessage(msg, 'error', context);
  },
};

/**
 * Interface estendida para requisições Express de modo a anexar o Request ID e horário de início.
 */
export interface LoggerRequest extends Request {
  requestId?: string;
  startTime?: [number, number];
}

/**
 * Middleware Express para interceptação, geração de Correlation ID (Request ID) e monitoramento de performance de rotas.
 */
export function requestLoggerMiddleware(req: LoggerRequest, res: Response, next: NextFunction): void {
  // Gera e anexa Request ID único para correlação de eventos
  req.requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  req.startTime = process.hrtime();

  // Responder no cabeçalho para facilitar suporte técnico e correlação externa
  res.setHeader('x-request-id', req.requestId);

  // Interceptar encerramento da resposta para registrar status e duração se for uma rota de API
  const isApi = req.path.startsWith('/api') || (req.originalUrl && req.originalUrl.startsWith('/api'));
  if (isApi) {
    res.on('finish', () => {
      let durationMs = 0;
      if (req.startTime) {
        const diff = process.hrtime(req.startTime);
        durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);
      }

      // Anonimizar identificação de usuário autenticado caso exista
      const authHeader = req.headers.authorization;
      let anonymizedUser = 'Anonymous';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Usar hash rápido do token para representá-lo de forma segura e anônima
        const tokenTail = authHeader.substring(authHeader.length - 12);
        anonymizedUser = `UserHash-${crypto.createHash('sha256').update(tokenTail).digest('hex').substring(0, 10)}`;
      }

      // Identificar serviço afetado com base no caminho do endpoint
      const serviceAffected = req.baseUrl || req.path.split('/')[2] || 'core';

      // Montar log estruturado
      const logContext = {
        requestId: req.requestId,
        method: req.method,
        endpoint: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: parseFloat(durationMs.toFixed(2)),
        user: anonymizedUser,
        service: serviceAffected,
        ip: req.ip || req.socket.remoteAddress || 'unknown',
      };

      if (res.statusCode >= 500) {
        serverLogger.error(`API_FAILURE: ${req.method} ${logContext.endpoint} respondeu com status ${res.statusCode}`, logContext);
      } else if (res.statusCode >= 400) {
        serverLogger.warn(`API_WARNING: ${req.method} ${logContext.endpoint} respondeu com status ${res.statusCode}`, logContext);
      } else {
        serverLogger.info(`API_REQUEST: ${req.method} ${logContext.endpoint} concluída com sucesso`, logContext);
      }
    });
  }

  next();
}

/**
 * Middleware de manipulação centralizada de erros do Express.
 * Captura falhas internas, reporta ao monitoramento de produção e retorna uma mensagem segura para o cliente.
 */
export function errorHandlerMiddleware(err: any, req: LoggerRequest, res: Response, next: NextFunction): void {
  const requestId = req.requestId || crypto.randomUUID();
  const serviceAffected = req.baseUrl || req.path.split('/')[2] || 'core';

  // Registrar exceção técnica completa de forma sanitizada no log
  serverCaptureException(err, {
    requestId,
    endpoint: req.originalUrl || req.url,
    method: req.method,
    service: serviceAffected,
    category: 'express_middleware_error',
  });

  // Normalizar erro para nossa estrutura controlada AppError
  const appError = normalizeError(err);
  const statusCode = appError.statusCode;
  const isProduction = serverConfig.env === 'produção';

  // Determinar mensagem pública segura
  let message = appError.safeMessage;
  if (statusCode === 500) {
    message = "Não foi possível concluir a operação.";
  } else if (!isProduction) {
    // Em ambientes não-produção, podemos usar a mensagem original ou safeMessage
    message = appError.safeMessage || appError.message;
  }

  // Retornar a resposta no formato consistente exigido
  res.status(statusCode).json({
    error: {
      code: appError.code,
      message: message,
      requestId: requestId
    }
  });
}
