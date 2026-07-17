-- Create loans table
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

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;

-- Policies
CREATE POLICY "Users can select their own loans" ON public.loans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loans" ON public.loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans" ON public.loans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans" ON public.loans
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_book_id ON public.loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
