import React, { Component, ErrorInfo } from 'react';
import { captureException } from '../services/monitoring';
import { config } from '../services/config';
import { AlertOctagon, RotateCcw, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
  resetAttempts: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    eventId: null,
    resetAttempts: 0,
  };

  private containerRef = React.createRef<HTMLDivElement>();
  private lastResetTime = 0;
  private hasLoggedThisError = false;

  public static getDerivedStateFromError(error: Error): State {
    const eventId = typeof window !== 'undefined' && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : 'err-' + Math.random().toString(36).substring(2, 15);
    return {
      hasError: true,
      error,
      eventId,
      resetAttempts: 0,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.hasLoggedThisError) return;
    this.hasLoggedThisError = true;

    const eventId = this.state.eventId || 'err-' + Math.random().toString(36).substring(2, 15);

    // Registra o erro pelo logger central enriquecendo com os dados do ambiente
    captureException(error, {
      module: 'ReactErrorBoundary',
      action: 'componentDidCatch',
      componentStack: errorInfo.componentStack || '',
      route: typeof window !== 'undefined' ? window.location.pathname : '/',
      ambiente: config.env,
      versao: '1.0.0',
      eventId: eventId,
      // Portuguese keys for absolute compliance with metadata/audit requirements
      rota: typeof window !== 'undefined' ? window.location.pathname : '/',
      modulo: 'ReactErrorBoundary',
      versão: '1.0.0',
      identificador_evento: eventId,
    });
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.hasError && !prevState.hasError) {
      this.containerRef.current?.focus();
    }
  }

  private handleTryContinue = () => {
    const now = Date.now();
    const isRapidCrashes = now - this.lastResetTime < 3000;

    this.lastResetTime = now;
    this.hasLoggedThisError = false;

    // Incrementa tentativas locais para evitar loops infinitos de erro
    const nextAttempts = this.state.resetAttempts + 1;

    if (nextAttempts >= 3 && isRapidCrashes) {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      this.setState({
        hasError: false,
        error: null,
        eventId: null,
        resetAttempts: nextAttempts,
      });
    }
  };

  private handleReload = () => {
    this.hasLoggedThisError = false;
    this.setState({
      hasError: false,
      error: null,
      eventId: null,
      resetAttempts: 0,
    });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.hasLoggedThisError = false;
    this.setState({
      hasError: false,
      error: null,
      eventId: null,
      resetAttempts: 0,
    });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      const isProduction = config.env === 'produção';
      const eventId = this.state.eventId || 'Não disponível';

      return (
        <div
          ref={this.containerRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 focus:outline-none"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertOctagon className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Ops! Algo deu errado
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                Desculpe pelo transtorno. Ocorreu um problema inesperado ao carregar esta tela. 
                Seus dados estão protegidos e nossa equipe técnica já foi notificada.
              </p>
            </div>

            {/* Identificador de erro seguro para o usuário em qualquer ambiente */}
            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Identificador do Erro
              </span>
              <code className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all leading-normal block select-all">
                {eventId}
              </code>
            </div>

            {/* Comportamento em desenvolvimento: Detalhes técnicos apenas em ambiente seguro */}
            {!isProduction && this.state.error && (
              <details className="text-left bg-slate-100 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                <summary className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none outline-none hover:text-slate-700 dark:hover:text-slate-300">
                  Detalhes Técnicos (Apenas em Desenvolvimento)
                </summary>
                <div className="mt-3 space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300 break-all leading-relaxed">
                  <p><strong>Nome:</strong> {this.state.error.name || 'Erro Desconhecido'}</p>
                  <p><strong>Mensagem:</strong> {this.state.error.message || 'Sem mensagem'}</p>
                  {this.state.error.stack && (
                    <pre className="mt-2 p-2 bg-slate-200 dark:bg-slate-900 rounded overflow-x-auto max-h-40 text-[10px] whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Ações disponíveis de forma acessível e com bom contraste */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                onClick={this.handleTryContinue}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <RotateCcw className="w-4 h-4" />
                Tentar Novamente
              </button>

              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <Home className="w-4 h-4" />
                Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
