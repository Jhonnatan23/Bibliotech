-- Migration to add collection-specific fields to the books table to support books, HQs, and Mangas
ALTER TABLE public.books 
  ADD COLUMN IF NOT EXISTS condition TEXT,
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS store TEXT,
  ADD COLUMN IF NOT EXISTS physical_location TEXT,
  ADD COLUMN IF NOT EXISTS edition TEXT,
  ADD COLUMN IF NOT EXISTS isbn TEXT,
  ADD COLUMN IF NOT EXISTS signed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sealed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS limited_edition BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS first_edition BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS variant_cover BOOLEAN DEFAULT FALSE;

-- Create constraint to restrict type to 'Livro', 'HQ', 'Mangá'
-- First remove any existing constraint if exists to avoid errors
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS chk_books_type;
ALTER TABLE public.books ADD CONSTRAINT chk_books_type CHECK (type IN ('Livro', 'HQ', 'Mangá'));

-- Create indices for the new fields for optimized searching and filtering
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_condition ON public.books(condition);
CREATE INDEX IF NOT EXISTS idx_books_store ON public.books(store);

-- Note: Row Level Security (RLS) is already enabled on public.books. 
-- The existing policies automatically protect these new columns as they apply to the entire table.
-- Let's confirm RLS is enabled just in case:
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
