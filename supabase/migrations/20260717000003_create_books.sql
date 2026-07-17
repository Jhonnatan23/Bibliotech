-- Create books table
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

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

-- Policies
CREATE POLICY "Users can select their own books" ON public.books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books" ON public.books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books" ON public.books
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books" ON public.books
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_date_added ON public.books(date_added DESC);
CREATE INDEX IF NOT EXISTS idx_books_is_loaned ON public.books(is_loaned) WHERE is_loaned = TRUE;
