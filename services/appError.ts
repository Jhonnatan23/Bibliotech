import { Request, Response, NextFunction } from 'express';

/**
 * Classe customizada para representação de erros controlados do Bibliotech.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly safeMessage: string;
  public readonly details: any;

  constructor(
    statusCode: number,
    code: string,
    safeMessage: string,
    originalMessage?: string,
    isOperational = true,
    details?: any
  ) {
    super(originalMessage || safeMessage);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.code = code;
    this.safeMessage = safeMessage;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Função utilitária para capturar e encaminhar erros assíncronos no Express.
 */
export const asyncHandler = (fn: (req: any, res: any, next: NextFunction) => Promise<any>) => {
  return (req: any, res: any, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Normaliza erros brutos vindos de diferentes fontes (Supabase, Google Books, Gemini, de rede, etc.)
 * para instâncias uniformes de AppError.
 */
export function normalizeError(err: any): AppError {
  if (err instanceof AppError) {
    return err;
  }

  const message = err?.message || String(err || '');
  const lowerMessage = message.toLowerCase();
  const code = err?.code || '';
  const status = err?.status || err?.statusCode || 500;

  // 1. Erros do Supabase ou Postgres
  if (code && typeof code === 'string') {
    // Códigos SQL de violação de integridade (Ex: Foreign Key ou Unique constraint) -> CONFLICT
    if (code.startsWith('23')) {
      return new AppError(
        409,
        'CONFLICT',
        'Operação em conflito com o estado atual do banco de dados.',
        message,
        true,
        { pgCode: code }
      );
    }
    // Código SQL 42P01 (relation/table does not exist) ou similar -> NOT_FOUND ou INTEGRATION_ERROR
    if (code === '42P01') {
      return new AppError(
        404,
        'NOT_FOUND',
        'O recurso solicitado não pôde ser encontrado no banco de dados.',
        message,
        true,
        { pgCode: code }
      );
    }
  }

  // Mensagens típicas do Supabase ou de autenticação
  if (
    lowerMessage.includes('jwt') ||
    lowerMessage.includes('token') ||
    lowerMessage.includes('invalid_grant') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('auth') ||
    lowerMessage.includes('não autorizado') ||
    lowerMessage.includes('autenticação') ||
    status === 401
  ) {
    const isUnauthenticated =
      lowerMessage.includes('expired') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('ausente') ||
      lowerMessage.includes('não fornecido') ||
      lowerMessage.includes('expirado') ||
      lowerMessage.includes('401');

    return new AppError(
      isUnauthenticated ? 401 : 403,
      isUnauthenticated ? 'UNAUTHENTICATED' : 'UNAUTHORIZED',
      isUnauthenticated
        ? 'Token de autorização não fornecido ou inválido.'
        : 'Acesso negado: você não tem permissão para acessar este recurso.',
      message
    );
  }

  // 2. Erros de APIs externas (Gemini, Google Books, etc.)
  if (
    lowerMessage.includes('gemini') ||
    lowerMessage.includes('google books') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('nodemailer') ||
    lowerMessage.includes('smtp') ||
    lowerMessage.includes('api-key') ||
    err?.name === 'FetchError' ||
    status === 502
  ) {
    const isRateLimit =
      lowerMessage.includes('resource_exhausted') ||
      lowerMessage.includes('429') ||
      status === 429;

    return new AppError(
      isRateLimit ? 429 : 502,
      isRateLimit ? 'LIMIT_EXCEEDED' : 'INTEGRATION_ERROR',
      isRateLimit
        ? 'Limite de requisições excedido. Tente novamente mais tarde.'
        : 'Falha na comunicação com o serviço externo.',
      message
    );
  }

  // 3. Erro de validação
  if (
    status === 400 ||
    err?.name === 'ValidationError' ||
    message.includes('obrigatório') ||
    message.includes('ausente')
  ) {
    return new AppError(
      400,
      'VALIDATION_ERROR',
      message || 'Dados de entrada inválidos ou malformados.',
      message
    );
  }

  // 4. Recurso não encontrado genérico
  if (status === 404) {
    return new AppError(
      404,
      'NOT_FOUND',
      'O recurso solicitado não foi encontrado.',
      message
    );
  }

  // 5. Erro interno inesperado por padrão
  return new AppError(
    500,
    'INTERNAL_ERROR',
    'Não foi possível concluir a operação.',
    message,
    false
  );
}
