import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, normalizeError } from './appError';
import { errorHandlerMiddleware } from './serverLogger';
import { serverConfig } from './serverConfig';
import { Response, Request } from 'express';

describe('AppError, normalizeError and errorHandlerMiddleware Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. erro conhecido de validação
  it('should correctly normalize and handle a known validation error', () => {
    const error = new Error('Parâmetro obrigatório ausente: title');
    error.name = 'ValidationError';
    const appError = normalizeError(error);

    expect(appError.statusCode).toBe(400);
    expect(appError.code).toBe('VALIDATION_ERROR');
    expect(appError.safeMessage).toBe('Parâmetro obrigatório ausente: title');
  });

  // 2. token ausente
  it('should correctly normalize and handle an unauthenticated error (missing token)', () => {
    const error = new Error('Token de autorização ausente ou não fornecido');
    const appError = normalizeError(error);

    expect(appError.statusCode).toBe(401);
    expect(appError.code).toBe('UNAUTHENTICATED');
    expect(appError.safeMessage).toBe('Token de autorização não fornecido ou inválido.');
  });

  // 3. acesso a recurso de outro usuário
  it('should correctly normalize and handle an unauthorized access error', () => {
    const error = new AppError(403, 'UNAUTHORIZED', 'Acesso negado: você não tem permissão para acessar este recurso.');
    const appError = normalizeError(error);

    expect(appError.statusCode).toBe(403);
    expect(appError.code).toBe('UNAUTHORIZED');
    expect(appError.safeMessage).toBe('Acesso negado: você não tem permissão para acessar este recurso.');
  });

  // 4. registro não encontrado
  it('should correctly normalize and handle a resource not found error', () => {
    const error = new AppError(404, 'NOT_FOUND', 'O recurso solicitado não foi encontrado.');
    const appError = normalizeError(error);

    expect(appError.statusCode).toBe(404);
    expect(appError.code).toBe('NOT_FOUND');
    expect(appError.safeMessage).toBe('O recurso solicitado não foi encontrado.');
  });

  // 5. erro do Supabase
  it('should correctly normalize and handle a Supabase database error (integrity constraint)', () => {
    const error = {
      message: 'duplicate key value violates unique constraint "books_isbn_key"',
      code: '23505'
    };
    const appError = normalizeError(error);

    expect(appError.statusCode).toBe(409);
    expect(appError.code).toBe('CONFLICT');
    expect(appError.safeMessage).toContain('Operação em conflito com o estado atual do banco de dados.');
  });

  // 6. falha de API externa (Google Books or Gemini API limit)
  it('should correctly normalize and handle an external integration rate limit error', () => {
    const error = new Error('GEMINI API - RESOURCE_EXHAUSTED: Quota exceeded.');
    (error as any).status = 429;
    const appError = normalizeError(error);

    expect(appError.statusCode).toBe(429);
    expect(appError.code).toBe('LIMIT_EXCEEDED');
    expect(appError.safeMessage).toBe('Limite de requisições excedido. Tente novamente mais tarde.');
  });

  it('should correctly normalize and handle a general external API failure', () => {
    const error = new Error('Google Books fetch failed with status 502');
    const appError = normalizeError(error);

    expect(appError.statusCode).toBe(502);
    expect(appError.code).toBe('INTEGRATION_ERROR');
    expect(appError.safeMessage).toBe('Falha na comunicação com o serviço externo.');
  });

  // 7. erro inesperado contendo uma mensagem sensível
  // 8. presença de requestId
  // 9. ausência de stack e mensagem técnica em produção
  it('should correctly handle unexpected errors with sensitive messages in production without leaks and include requestId', () => {
    // Force environment to production
    const originalEnv = serverConfig.env;
    serverConfig.env = 'produção';

    const req = {
      requestId: 'test-req-id-abc',
      method: 'GET',
      url: '/api/any-route',
      originalUrl: '/api/any-route',
      path: '/api/any-route',
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    const next = vi.fn();
    const sensitiveError = new Error('Database password is "secretPass123" and table "secrets" does not exist in postgres://admin@localhost:5432');

    errorHandlerMiddleware(sensitiveError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível concluir a operação.',
        requestId: 'test-req-id-abc',
      }
    });

    // Restore original config
    serverConfig.env = originalEnv;
  });
});
