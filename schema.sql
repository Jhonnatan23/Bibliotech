-- Bibliotech Table Schema

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  reading_goal INTEGER DEFAULT 12,
  custom_tags TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  pages INTEGER DEFAULT 0,
  genre TEXT,
  type TEXT DEFAULT 'Livro',
  status TEXT DEFAULT 'Não lido',
  rating DECIMAL(3,1),
  summary TEXT,
  notes TEXT,
  estimated_price DECIMAL(10,2),
  price_paid DECIMAL(10,2),
  buy_link TEXT,
  current_page INTEGER DEFAULT 0,
  date_added DATE DEFAULT CURRENT_DATE NOT NULL,
  date_started DATE,
  date_finished DATE,
  days_to_finish INTEGER,
  times_read INTEGER DEFAULT 1,
  was_wishlist BOOLEAN DEFAULT FALSE,
  linked_book_ids UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  history_observation TEXT,
  is_loaned BOOLEAN DEFAULT FALSE,
  borrower_name TEXT,
  loan_date DATE,
  is_digital BOOLEAN DEFAULT FALSE,
  series TEXT,
  volume INTEGER,
  series_id UUID REFERENCES public.series(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  total_volumes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS e criar políticas
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Garantir permissões
GRANT ALL ON public.series TO authenticated;
GRANT ALL ON public.series TO service_role;
GRANT ALL ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Políticas para SERIES
CREATE POLICY "Users can select their own series" ON public.series
  FOR SELECT USING ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can insert their own series" ON public.series
  FOR INSERT WITH CHECK ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can update their own series" ON public.series
  FOR UPDATE USING ((auth.uid())::uuid = (user_id)::uuid) WITH CHECK ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can delete their own series" ON public.series
  FOR DELETE USING ((auth.uid())::uuid = (user_id)::uuid);

-- Políticas para BOOKS
CREATE POLICY "Users can select their own books" ON public.books
  FOR SELECT USING ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can insert their own books" ON public.books
  FOR INSERT WITH CHECK ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can update their own books" ON public.books
  FOR UPDATE USING ((auth.uid())::uuid = (user_id)::uuid) WITH CHECK ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can delete their own books" ON public.books
  FOR DELETE USING ((auth.uid())::uuid = (user_id)::uuid);

-- Políticas para PROFILES
CREATE POLICY "Users can manage their own profile" ON public.profiles
  USING ((auth.uid())::uuid = (id)::uuid);

CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_date_added ON public.books(date_added DESC);

-- Tabela STORIES para o Estúdio Criativo
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  influences JSONB DEFAULT '{"books": [], "authors": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;

CREATE POLICY "Users can select their own stories" ON public.stories
  FOR SELECT USING ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can insert their own stories" ON public.stories
  FOR INSERT WITH CHECK ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING ((auth.uid())::uuid = (user_id)::uuid) WITH CHECK ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING ((auth.uid())::uuid = (user_id)::uuid);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);

-- Tabela LOANS para o Controle de Empréstimos
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  borrower_name TEXT NOT NULL,
  borrower_email TEXT,
  loan_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue'))
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;

-- Políticas para LOANS
CREATE POLICY "Users can select their own loans" ON public.loans
  FOR SELECT USING ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can insert their own loans" ON public.loans
  FOR INSERT WITH CHECK ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can update their own loans" ON public.loans
  FOR UPDATE USING ((auth.uid())::uuid = (user_id)::uuid) WITH CHECK ((auth.uid())::uuid = (user_id)::uuid);
CREATE POLICY "Users can delete their own loans" ON public.loans
  FOR DELETE USING ((auth.uid())::uuid = (user_id)::uuid);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_book_id ON public.loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
