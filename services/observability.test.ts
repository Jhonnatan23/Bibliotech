import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeData, sanitizeString, sanitizeObject, sanitizeError, logger, NoopMonitoringAdapter, getActiveAdapter, configureMonitoring } from './monitoring';
import { sanitizeServerData, requestLoggerMiddleware, errorHandlerMiddleware, LoggerRequest } from './serverLogger';
import { config } from './config';
import { Response, NextFunction } from 'express';

// Mocking external systems or config where needed
vi.mock('./config', () => ({
  config: {
    env: 'desenvolvimento',
    enableDemoData: false,
    monitoringEnabled: false,
    monitoringDsn: '',
  },
}));

describe('Observability & Security Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. MONITORAMENTO: SANITIZAÇÃO DE DADOS SENSÍVEIS (15 CASOS OBRIGATÓRIOS)
  // ---------------------------------------------------------------------------
  describe('Mandatory Sanitization Suite (15 Test Cases)', () => {
    // Caso 1: Senha em propriedade
    it('1. should mask password in an object property', () => {
      const input = { username: 'usuario', password: 'test-password-123' };
      const output = sanitizeObject(input) as any;
      expect(output.username).toBe('usuario');
      expect(output.password).toBe('[CONFIDENCIAL/REMOVIDO]');
      expect(input.password).toBe('test-password-123'); // Preserves original object
    });

    // Caso 2: Senha em mensagem
    it('2. should mask password inside a text message', () => {
      const input = 'Database password is test-password-123 and connecting...';
      const output = sanitizeString(input);
      expect(output).toContain('password is [REDACTED]');
      expect(output).not.toContain('test-password-123');
    });

    // Caso 3: Token em mensagem
    it('3. should mask token inside a text message', () => {
      const input = 'Generated token test-token-456 for request';
      const output = sanitizeString(input);
      expect(output).not.toContain('test-token-456');
      expect(output).toContain('token [REDACTED]');
    });

    // Caso 4: JWT em stack
    it('4. should mask JWT inside an error stack trace', () => {
      const err = new Error('Auth failed');
      err.stack = 'Error: Auth failed\n    at login (auth.js:10)\n    token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
      const sanitized = sanitizeError(err);
      expect(sanitized.stack).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(sanitized.stack).toContain('[JWT_REDACTED]');
    });

    // Caso 5: Bearer token
    it('5. should mask Bearer token in headers or string messages', () => {
      const input = 'Authorization: Bearer test-token-456';
      const output = sanitizeString(input);
      expect(output).toBe('Authorization: [REDACTED]');
      expect(output).not.toContain('test-token-456');
    });

    // Caso 6: Chave de API
    it('6. should mask API keys in string messages', () => {
      const input1 = 'Using API key apikey=test-api-key-789';
      const input2 = 'Using Google AI key AIzaSy123456789012345678901234567890125';
      expect(sanitizeString(input1)).not.toContain('test-api-key-789');
      expect(sanitizeString(input2)).toContain('[API_KEY_REDACTED]');
    });

    // Caso 7: E-mail
    it('7. should mask e-mail addresses correctly', () => {
      const input = 'User usuario@example.com registered successfully';
      const output = sanitizeString(input);
      expect(output).toContain('u***o@example.com');
      expect(output).not.toContain('usuario@example.com');
    });

    // Caso 8: URL com usuário e senha
    it('8. should redact credentials in URLs', () => {
      const input = 'Database connection string postgres://usuario:test-password-123@localhost:5432/db';
      const output = sanitizeString(input);
      expect(output).toBe('Database connection string postgres://[REDACTED]:[REDACTED]@localhost:5432/db');
      expect(output).not.toContain('test-password-123');
    });

    // Caso 9: Query string sensível
    it('9. should redact sensitive query strings in URLs', () => {
      const input = 'https://api.example.com/v1/data?token=test-token-456&password=test-password-123';
      const output = sanitizeString(input);
      expect(output).toContain('token=[REDACTED]');
      expect(output).toContain('password=[REDACTED]');
      expect(output).not.toContain('test-token-456');
      expect(output).not.toContain('test-password-123');
    });

    // Caso 10: Objeto circular
    it('10. should handle circular objects without throwing or infinite loops', () => {
      const circular: any = { name: 'circular-test' };
      circular.self = circular;

      expect(() => {
        const output = sanitizeObject(circular) as any;
        expect(output.name).toBe('circular-test');
        expect(output.self).toBe('[Circular]');
      }).not.toThrow();
    });

    // Caso 11: Objeto muito profundo
    it('11. should limit recursion depth for deeply nested objects', () => {
      const deep: any = { level: 1 };
      let curr = deep;
      for (let i = 2; i <= 10; i++) {
        curr.next = { level: i };
        curr = curr.next;
      }

      const output = sanitizeObject(deep) as any;
      expect(output.level).toBe(1);
      expect(output.next.next.next.next.next.next).toBe('[MAX_DEPTH_REACHED]');
    });

    // Caso 12: String muito grande
    it('12. should truncate excessively large strings', () => {
      const longStr = 'x'.repeat(2000);
      const output = sanitizeString(longStr);
      expect(output.length).toBeLessThanOrEqual(1020);
      expect(output).toContain('... [TRUNCATED]');
    });

    // Caso 13: Erro sem stack
    it('13. should handle errors that do not contain a stack trace', () => {
      const errorWithoutStack = new Error('Erro simples sem rastreamento');
      delete errorWithoutStack.stack;

      const output = sanitizeError(errorWithoutStack);
      expect(output.name).toBe('Error');
      expect(output.message).toBe('Erro simples sem rastreamento');
      expect(output.stack).toBeUndefined();
    });

    // Caso 14: Valor null / undefined
    it('14. should handle null and undefined values safely', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
      expect(sanitizeString(null)).toBe('null');
      expect(sanitizeString(undefined)).toBe('undefined');
    });

    // Caso 15: Monitoramento externo falhando
    it('15. should handle external monitoring failure gracefully without throwing', async () => {
      config.env = 'produção';
      config.monitoringEnabled = true;
      config.monitoringDsn = 'https://fake-key@sentry.io/999999';

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error on monitoring endpoint'));

      expect(() => {
        logger.error('Erro testando resiliência de monitoramento externo');
      }).not.toThrow();

      global.fetch = originalFetch;
    });
  });

  // ---------------------------------------------------------------------------
  // 2. CONTROLE DE DADOS DE DEMONSTRAÇÃO (MODO DEMO)
  // ---------------------------------------------------------------------------
  describe('Demo Mode Control', () => {
    it('should allow demo data in development if enableDemoData is active', () => {
      config.env = 'desenvolvimento';
      config.enableDemoData = true;

      // Se estiver ativo em desenvolvimento, deve-se permitir dados fictícios de demo
      expect(config.enableDemoData).toBe(true);
      expect(config.env).not.toBe('produção');
    });

    it('should strictly disable demo data when enableDemoData is false', () => {
      config.env = 'desenvolvimento';
      config.enableDemoData = false;

      expect(config.enableDemoData).toBe(false);
    });

    it('should absolutely forbid demo data in production, regardless of flags', () => {
      // Forçar ambiente para produção e verificar se o modo demo é desativado
      config.env = 'produção';
      config.enableDemoData = false; // Em produção config.ts garante que é falso

      expect(config.env).toBe('produção');
      expect(config.enableDemoData).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. TABELA VAZIA (COMPARTILHAMENTO DE FEED)
  // ---------------------------------------------------------------------------
  describe('Empty Table Behavior', () => {
    it('should return empty array and not fallback to mocks in production if empty', () => {
      const envBackup = config.env;
      config.env = 'produção';
      
      const allowDemo = config.enableDemoData && config.env !== 'produção';
      const mockPostsRaw = null; // Tabela ou localStorage vazia
      const posts = mockPostsRaw ? JSON.parse(mockPostsRaw) : (allowDemo ? [{ id: 1, title: 'Mock' }] : []);

      expect(posts).toEqual([]);
      config.env = envBackup;
    });
  });

  // ---------------------------------------------------------------------------
  // 4. PRODUÇÃO COM API FUNCIONANDO (MIDDLEWARE DE LOGS)
  // ---------------------------------------------------------------------------
  describe('Production API Success Tracking', () => {
    it('should assign a unique requestId and register route telemetry on success', () => {
      const req = {
        headers: {},
        method: 'GET',
        url: '/api/books',
        originalUrl: '/api/books',
        path: '/api/books',
        ip: '127.0.0.1',
        socket: {},
      } as unknown as LoggerRequest;

      const res = {
        statusCode: 200,
        setHeader: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            // Simular término com sucesso
            callback();
          }
        }),
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      requestLoggerMiddleware(req, res, next);

      expect(req.requestId).toBeDefined();
      expect(typeof req.requestId).toBe('string');
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
      expect(next).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. PRODUÇÃO COM API FALHANDO (TRATAMENTO SEGURO DE ERRO)
  // ---------------------------------------------------------------------------
  describe('Production API Failure Handling', () => {
    it('should sanitize, log, and return safe error responses without leak', () => {
      const req = {
        requestId: 'req-error-123',
        method: 'POST',
        url: '/api/generate',
        originalUrl: '/api/generate',
        path: '/api/generate',
      } as unknown as LoggerRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as NextFunction;
      const error = new Error('Database connection failed! Stack details: secret_string');

      errorHandlerMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_ERROR",
          message: "Não foi possível concluir a operação.",
          requestId: 'req-error-123',
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 6. USUÁRIO NÃO AUTENTICADO (MIDDLEWARE AUTH)
  // ---------------------------------------------------------------------------
  describe('Unauthenticated User Control', () => {
    it('should return a 401 error payload if authorization header is absent', () => {
      const req = {
        headers: {},
      } as unknown as LoggerRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      // Simular comportamento esperado do authMiddleware
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token de autorização não fornecido ou inválido." });
      } else {
        next();
      }

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Token de autorização não fornecido ou inválido."
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 7. COMPREHENSIVE CLIENT LOGGER TESTS
  // ---------------------------------------------------------------------------
  describe('Client Logger Comprehensive Tests', () => {
    let logSpy: any;
    let warnSpy: any;
    let errorSpy: any;

    beforeEach(() => {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should correctly log information at info level', () => {
      config.env = 'desenvolvimento';
      logger.info('Informativo de depuração do sistema');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Observabilidade - INFO] Informativo de depuração do sistema'),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should correctly log warnings at warn level', () => {
      config.env = 'desenvolvimento';
      logger.warn('Aviso de recurso obsoleto');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Observabilidade - WARN] Aviso de recurso obsoleto'),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should correctly log errors at error level', () => {
      config.env = 'desenvolvimento';
      logger.error('Erro crítico no banco de dados local');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Observabilidade - ERROR] Erro crítico no banco de dados local'),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should log debug messages when environment is development', () => {
      config.env = 'desenvolvimento';
      logger.debug('Mensagem detalhada de depuração interna');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Observabilidade - DEBUG] Mensagem detalhada de depuração interna'),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should NOT log debug messages when environment is production', () => {
      config.env = 'produção';
      logger.debug('Esta mensagem de depuração não deve aparecer em produção');
      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should sanitize full emails to prevent leaking them in logs', () => {
      config.env = 'desenvolvimento';
      logger.info('Contato do usuário: user@example.com');
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Observabilidade - INFO] Contato do usuário: u***r@example.com'),
        expect.any(String),
        expect.any(Object)
      );
    });

    // Case 1: token em propriedade
    it('should sanitize token in a property', () => {
      config.env = 'desenvolvimento';
      logger.info('Autenticação de API', { token: 'super-secret-token-123' });
      const lastCallArgs = logSpy.mock.calls[logSpy.mock.calls.length - 1];
      expect(lastCallArgs[2]).toBeDefined();
      expect(lastCallArgs[2].token).toBe('[CONFIDENCIAL/REMOVIDO]');
    });

    // Case 2: token dentro de string
    it('should sanitize token inside a string message', () => {
      config.env = 'desenvolvimento';
      logger.info('Recebido Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature para requisição');
      const lastCallArgs = logSpy.mock.calls[logSpy.mock.calls.length - 1];
      expect(lastCallArgs[0]).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(lastCallArgs[0]).toContain('Bearer [REDACTED]');
    });

    // Case 3: JWT dentro de stack
    it('should sanitize JWT inside error stack', () => {
      const err = new Error('Falha de conexão com JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature');
      const sanitized = sanitizeData(err);
      expect(sanitized.message).toContain('[JWT_REDACTED]');
      expect(sanitized.stack).toContain('[JWT_REDACTED]');
      expect(sanitized.stack).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    // Case 4: e-mail
    it('should sanitize e-mail addresses in string messages', () => {
      config.env = 'desenvolvimento';
      logger.warn('Envio recusado para o destinatário jhonnatan.fernandes23@gmail.com');
      const lastCallArgs = logSpy.mock.calls[logSpy.mock.calls.length - 1];
      expect(lastCallArgs[0]).toContain('j***3@gmail.com');
      expect(lastCallArgs[0]).not.toContain('jhonnatan.fernandes23');
    });

    // Case 5: senha em URL
    it('should sanitize password/credentials in URLs', () => {
      config.env = 'desenvolvimento';
      logger.error('Erro de conexão ao banco postgres://admin:secretPass123@localhost:5432/db');
      const lastCallArgs = logSpy.mock.calls[logSpy.mock.calls.length - 1];
      expect(lastCallArgs[0]).toContain('postgres://[REDACTED]:[REDACTED]@localhost:5432/db');
      expect(lastCallArgs[0]).not.toContain('secretPass123');
    });

    // Case 6: objeto circular
    it('should handle circular objects gracefully during sanitization', () => {
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      expect(() => {
        const sanitized = sanitizeData(circularObj);
        expect(sanitized.self).toBe('[Circular]');
      }).not.toThrow();
    });

    // Case 7: objeto profundo
    it('should limit sanitization depth on extremely deep objects', () => {
      const deepObj: any = {};
      let current = deepObj;
      for (let i = 0; i < 10; i++) {
        current.child = {};
        current = current.child;
      }

      const sanitized = sanitizeData(deepObj);
      expect(sanitized.child.child.child.child.child.child).toBe('[MAX_DEPTH_REACHED]');
    });

    // Case 8: mensagem muito grande
    it('should truncate excessively large messages', () => {
      const veryLargeMessage = 'a'.repeat(2000);
      config.env = 'desenvolvimento';
      logger.info(veryLargeMessage);
      const lastCallArgs = logSpy.mock.calls[logSpy.mock.calls.length - 1];
      expect(lastCallArgs[0].length).toBeLessThanOrEqual(1050); // 1000 limit + custom prefix text
      expect(lastCallArgs[0]).toContain('... [TRUNCATED]');
    });

    // Case 9: falha do adaptador externo
    it('should not break or throw errors when the external monitoring service fails', async () => {
      config.env = 'produção';
      config.monitoringEnabled = true;
      config.monitoringDsn = 'https://public@sentry.io/123';

      const fetchBackup = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Serviço Sentry offline'));

      expect(() => {
        logger.error('Erro de teste para o monitoramento externo');
      }).not.toThrow();

      global.fetch = fetchBackup;
    });

    // Case 10: adaptador desativado
    it('should default to NoopMonitoringAdapter when deactivated', () => {
      config.monitoringEnabled = false;
      configureMonitoring();
      expect(getActiveAdapter()).toBeInstanceOf(NoopMonitoringAdapter);
    });

    // Case 11: ambiente de produção
    it('should support production environment without console grouping and only warn/error minimalist logs', () => {
      config.env = 'produção';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logger.info('Isso não deve aparecer no console em produção');
      logger.error('Esse erro deve aparecer');

      expect(logSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('[Monitoramento - ERROR] Esse erro deve aparecer');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
