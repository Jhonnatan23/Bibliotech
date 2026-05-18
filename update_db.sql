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

-- 5. ADICIONAR COLUNAS PARA GESTÃO DE SÉRIES E SAGAS
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS series TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS volume INTEGER;

-- 6. NOVAS ATUALIZAÇÕES: TABELA DE SÉRIES
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  total_volumes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL;

-- 7. POLÍTICAS DE SEGURANÇA PARA SÉRIES
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Garantir acesso para a role authenticated
GRANT ALL ON public.series TO authenticated;
GRANT ALL ON public.series TO service_role;

-- Remover políticas antigas para evitar conflitos ou nomes incorretos
DROP POLICY IF EXISTS "Users can manage their own series" ON public.series;
DROP POLICY IF EXISTS "Users can select their own series" ON public.series;
DROP POLICY IF EXISTS "Users can insert their own series" ON public.series;
DROP POLICY IF EXISTS "Users can update their own series" ON public.series;
DROP POLICY IF EXISTS "Users can delete their own series" ON public.series;

-- Criar políticas explícitas por operação
CREATE POLICY "Users can select their own series" ON public.series
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own series" ON public.series
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own series" ON public.series
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own series" ON public.series
  FOR DELETE USING (auth.uid() = user_id);

-- 8. POLÍTICAS DE SEGURANÇA PARA LIVROS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

DROP POLICY IF EXISTS "Users can manage their own books" ON public.books;
DROP POLICY IF EXISTS "Users can select their own books" ON public.books;
DROP POLICY IF EXISTS "Users can insert their own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;

CREATE POLICY "Users can select their own books" ON public.books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books" ON public.books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books" ON public.books
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books" ON public.books
  FOR DELETE USING (auth.uid() = user_id);

-- 9. POLÍTICAS DE SEGURANÇA PARA PERFIS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" ON public.profiles
  USING ((auth.uid())::uuid = (id)::uuid);
