-- ============================================================================
-- Migração de Otimização de Performance: Índices para o Dashboard e Acervo
-- Data: 2026-07-21
-- Descrição: Índices compostos e parciais estrategicamente projetados para
-- acelerar as queries do Dashboard (getAllBooks, getQuickStatsSummary, 
-- filtros por status de leitura e ordenação cronológica) com respeito às
-- políticas de Row Level Security (RLS).
-- ============================================================================

-- 1. Otimização do carregamento principal do Dashboard:
-- Elimina a operação de ordenação (Sort) em memória para a query:
-- SELECT ... FROM public.books WHERE user_id = $1 ORDER BY date_added DESC
CREATE INDEX IF NOT EXISTS idx_books_user_date_added 
  ON public.books(user_id, date_added DESC);

-- 2. Otimização da contagem de status e leitura ativa:
-- Acelera queries como:
-- SELECT status, is_loaned FROM public.books WHERE user_id = $1
-- SELECT ... FROM public.books WHERE user_id = $1 AND status = 'Lendo'
CREATE INDEX IF NOT EXISTS idx_books_user_status 
  ON public.books(user_id, status);

-- 3. Otimização dos cálculos analíticos anuais do Dashboard:
-- Índice parcial superleve para livros concluídos com ordenação por data de término.
-- Acelera gráficos de evolução mensal, ritmo diário e meta anual:
CREATE INDEX IF NOT EXISTS idx_books_user_read_finished 
  ON public.books(user_id, date_finished DESC) 
  WHERE status = 'Lido';

-- 4. Otimização da integridade referencial e lacunas de séries (seriesGaps):
-- Acelera agrupamentos de volumes por série no Dashboard e integridade referencial:
CREATE INDEX IF NOT EXISTS idx_books_series_id 
  ON public.books(series_id) 
  WHERE series_id IS NOT NULL;

-- 5. Limpeza de índice redundante de baixa seletividade:
-- O índice isolado idx_books_status(status) foi superado pelo índice composto 
-- idx_books_user_status(user_id, status), pois em ambiente multi-tenant com RLS
-- o Postgres sempre filtra por user_id primeiro.
DROP INDEX IF EXISTS public.idx_books_status;
