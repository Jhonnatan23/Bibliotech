-- ======================================================
-- BÍBLIOTECH: SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS (v21)
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SEU SUPABASE
-- ======================================================

-- 1. ADICIONAR COLUNAS PARA CONTROLE DE EMPRÉSTIMOS
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_loaned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS borrower_name TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS loan_date DATE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE;

-- 2. GARANTIR QUE COLUNAS DE ATUALIZAÇÕES ANTERIORES EXISTAM
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS linked_book_ids UUID[] DEFAULT '{}';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS history_observation TEXT;

-- 3. OTIMIZAÇÃO DE ÍNDICES
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_date_added ON public.books(date_added DESC);
CREATE INDEX IF NOT EXISTS idx_books_is_loaned ON public.books(is_loaned) WHERE is_loaned = TRUE;

-- 4. ATUALIZAR TABELA DE PERFIL (OPCIONAL/SEGURANÇA)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_tags TEXT[] DEFAULT '{}';
