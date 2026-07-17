-- Create series table
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  total_volumes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.series TO authenticated;
GRANT ALL ON public.series TO service_role;

-- Policies
CREATE POLICY "Users can select their own series" ON public.series
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own series" ON public.series
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own series" ON public.series
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own series" ON public.series
  FOR DELETE USING (auth.uid() = user_id);
