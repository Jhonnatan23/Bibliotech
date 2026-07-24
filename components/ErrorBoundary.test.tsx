import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { config } from '../services/config';
import * as monitoring from '../services/monitoring';

// Mock de monitoramento e de window.location
vi.mock('../services/monitoring', () => ({
  captureException: vi.fn(),
}));

describe('ErrorBoundary unit tests (Node/React Virtual DOM)', () => {
  const originalEnv = config.env;
  let originalLocation: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    config.env = 'desenvolvimento';

    // Salvar e mockar objetos globais do browser com segurança
    originalLocation = global.window ? global.window.location : undefined;
    
    if (typeof global.window === 'undefined') {
      (global as any).window = {
        location: {
          reload: vi.fn(),
          pathname: '/test-route',
          href: '',
        },
        crypto: {
          randomUUID: () => 'test-uuid-1234',
        }
      };
    } else {
      vi.stubGlobal('window', {
        location: {
          reload: vi.fn(),
          pathname: '/test-route',
          href: '',
        },
        crypto: {
          randomUUID: () => 'test-uuid-1234',
        }
      });
    }
  });

  afterEach(() => {
    config.env = originalEnv;
    if (originalLocation) {
      (global as any).window.location = originalLocation;
    }
  });

  // Helper para buscar textos de forma recursiva na árvore do React virtual DOM
  function findTextInTree(node: any, text: string): boolean {
    if (!node) return false;
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node).toLowerCase().includes(text.toLowerCase());
    }
    if (Array.isArray(node)) {
      return node.some(child => findTextInTree(child, text));
    }
    if (node.props) {
      if (node.props.children) {
        return findTextInTree(node.props.children, text);
      }
    }
    return false;
  }

  // 1. Erro em componente filho
  it('should transition to error state when getDerivedStateFromError is triggered', () => {
    const error = new Error('Erro crítico do filho');
    const newState = ErrorBoundary.getDerivedStateFromError(error);

    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(error);
    expect(newState.eventId).toBe('test-uuid-1234');
    expect(newState.resetAttempts).toBe(0);
  });

  // 2. Visualização em produção
  it('should render a clean user-friendly fallback view in production with NO technical details', () => {
    config.env = 'produção';

    const boundary = new ErrorBoundary({ children: <div>Olá Mundo</div> });
    const error = new Error('Detalhe super secreto do Banco de Dados PostgreSQL postgres://user:password@localhost:5432');
    boundary.state = {
      hasError: true,
      error,
      eventId: 'evt-prod-999',
      resetAttempts: 0,
    };

    const element = boundary.render();
    
    // Verificações visuais e de textos permitidos
    expect(findTextInTree(element, 'Ops! Algo deu errado')).toBe(true);
    expect(findTextInTree(element, 'Desculpe pelo transtorno')).toBe(true);
    expect(findTextInTree(element, 'evt-prod-999')).toBe(true);

    // 4. Ausência de detalhes técnicos em produção (Não exibir mensagem técnica, stack, urls, db, etc.)
    expect(findTextInTree(element, 'postgres://user:password')).toBe(false);
    expect(findTextInTree(element, 'Detalhe super secreto')).toBe(false);
    expect(findTextInTree(element, 'Error')).toBe(false); // sem nome do erro
  });

  // 3. Visualização em desenvolvimento
  it('should render detailed technical information in development mode', () => {
    config.env = 'desenvolvimento';

    const boundary = new ErrorBoundary({ children: <div>Olá Mundo</div> });
    const error = new Error('Database password leak error');
    error.stack = 'Error: Database password leak error\n  at Object.test (file.tsx:10:5)';
    
    boundary.state = {
      hasError: true,
      error,
      eventId: 'evt-dev-111',
      resetAttempts: 0,
    };

    const element = boundary.render();

    // Em desenvolvimento, as informações técnicas são renderizadas (ex: dentro da tag details)
    expect(findTextInTree(element, 'Database password leak error')).toBe(true);
    expect(findTextInTree(element, 'Error: Database password leak error')).toBe(true);
    expect(findTextInTree(element, 'file.tsx')).toBe(true);
  });

  // 5. Acionamento do logger central
  it('should call captureException central logger once on error and enrich context', () => {
    const boundary = new ErrorBoundary({ children: <div>Olá Mundo</div> });
    const error = new Error('Crash do Componente');
    const errorInfo = { componentStack: 'App > Child > Button' };

    boundary.state = {
      hasError: true,
      error,
      eventId: 'evt-log-555',
      resetAttempts: 0,
    };

    boundary.componentDidCatch(error, errorInfo);

    // Deve chamar exatamente uma vez
    expect(monitoring.captureException).toHaveBeenCalledTimes(1);
    expect(monitoring.captureException).toHaveBeenCalledWith(error, expect.objectContaining({
      module: 'ReactErrorBoundary',
      action: 'componentDidCatch',
      route: '/test-route',
      ambiente: 'desenvolvimento',
      versao: '1.0.0',
      eventId: 'evt-log-555',
      // Portuguese matching keys
      rota: '/test-route',
      modulo: 'ReactErrorBoundary',
      versão: '1.0.0',
      identificador_evento: 'evt-log-555'
    }));

    // Testar que chamadas subsequentes ao componentDidCatch não duplicam o log
    boundary.componentDidCatch(error, errorInfo);
    expect(monitoring.captureException).toHaveBeenCalledTimes(1);
  });

  // 6. Botão de recarregar
  it('should invoke reload of window when handleReload is executed', () => {
    const boundary = new ErrorBoundary({ children: <div>Olá Mundo</div> });
    const spyReload = vi.fn();
    
    // Stub para window.location.reload
    global.window.location.reload = spyReload;

    // Acionar handleReload diretamente
    (boundary as any).handleReload();

    expect(spyReload).toHaveBeenCalledTimes(1);
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
    expect(boundary.state.eventId).toBeNull();
  });

  // 7. Botão de retorno / início
  it('should redirect to home and clear error state on handleGoHome', () => {
    const boundary = new ErrorBoundary({ children: <div>Olá Mundo</div> });
    
    // Stub para window.location.href
    global.window.location.href = '';

    (boundary as any).handleGoHome();

    expect(global.window.location.href).toBe('/');
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
  });

  // 8. Erro ocorrido dentro da própria página de fallback
  it('should render cleanly without crashing if some state properties (error or eventId) are null', () => {
    const boundary = new ErrorBoundary({ children: <div>Olá Mundo</div> });
    
    // Forçar estado onde erro é nulo para emular falha de rendering defensiva
    boundary.state = {
      hasError: true,
      error: null,
      eventId: null,
      resetAttempts: 0,
    };

    expect(() => boundary.render()).not.toThrow();
    
    const element = boundary.render();
    expect(findTextInTree(element, 'Ops! Algo deu errado')).toBe(true);
    expect(findTextInTree(element, 'Não disponível')).toBe(true);
  });

  // Teste extra: Evitar loops infinitos de erro
  it('should automatically reload the page if user crashes more than 3 times consecutively within tight timeframe', () => {
    const boundary = new ErrorBoundary({ children: <div>Olá Mundo</div> });
    boundary.state = {
      hasError: true,
      error: new Error('Repetitive Crash'),
      eventId: 'evt-111',
      resetAttempts: 2, // Já tentou 2 vezes
    };

    const spyReload = vi.fn();
    global.window.location.reload = spyReload;

    // Configura o lastResetTime recente
    (boundary as any).lastResetTime = Date.now();

    // Acionar a terceira tentativa
    (boundary as any).handleTryContinue();

    // Em vez de dar setState, deve forçar o recarregamento total da página
    expect(spyReload).toHaveBeenCalledTimes(1);
    expect(boundary.state.hasError).toBe(true); // não resetou o estado do componente pois recarregou
  });
});
