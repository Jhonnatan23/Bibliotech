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
  is_digital BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_date_added ON public.books(date_added DESC);
