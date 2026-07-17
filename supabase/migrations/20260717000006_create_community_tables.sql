-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  book_genre TEXT,
  book_type TEXT,
  book_pages INTEGER DEFAULT 150,
  rating DECIMAL(3,1) NOT NULL,
  review TEXT NOT NULL,
  contem_spoiler BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create community_reactions table
CREATE TABLE IF NOT EXISTS public.community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_post_user_reaction UNIQUE (post_id, user_id, reaction_type)
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
GRANT ALL ON public.community_reactions TO authenticated;
GRANT ALL ON public.community_reactions TO service_role;
GRANT ALL ON public.community_comments TO authenticated;
GRANT ALL ON public.community_comments TO service_role;

-- Policies for community_posts
CREATE POLICY "Qualquer pessoa pode ver posts" ON public.community_posts
  FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem postar" ON public.community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Apenas criador pode editar" ON public.community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Apenas criador pode deletar" ON public.community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for community_reactions
CREATE POLICY "Qualquer pessoa pode ver reações" ON public.community_reactions
  FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem reagir" ON public.community_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Apenas dono pode deletar reação" ON public.community_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for community_comments
CREATE POLICY "Qualquer pessoa pode ver comentários" ON public.community_comments
  FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem comentar" ON public.community_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Apenas criador pode editar comentário" ON public.community_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Apenas criador/postador pode deletar comentário" ON public.community_comments
  FOR DELETE USING (auth.uid() = user_id);
