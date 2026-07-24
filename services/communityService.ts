import { supabase } from './supabase';
import { CommunityPost, CommunityComment, CommunityReaction } from '../types';
import { config } from './config';
import { logger } from './monitoring';

const POSTS_LOCAL_KEY = 'biblio_tech_community_posts';
const REACTIONS_LOCAL_KEY = 'biblio_tech_community_reactions';
const COMMENTS_LOCAL_KEY = 'biblio_tech_community_comments';

export class CommunityService {
  private useLocalMode = false;

  private async getUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  }

  // Define modo local forçado (se falhar o Supabase por falta de tabelas)
  setLocalMode(enabled: boolean) {
    this.useLocalMode = enabled;
  }

  isLocalMode() {
    return this.useLocalMode;
  }

  // --- QUERY / CONTROLLER DE LISTAGEM (GET) COM FILTROS DINÂMICOS ---
  async getPosts(filters?: {
    searchQuery?: string;
    genre?: string;
    bookType?: string;
  }): Promise<CommunityPost[]> {
    // Em produção, NUNCA usa modo local fallback silenciando erros.
    if (config.env === 'produção') {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          community_reactions (id, post_id, user_id, reaction_type, created_at),
          community_comments (
            id, post_id, user_id, comment_text, created_at,
            profiles:user_id (full_name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error("[CommunityService] Erro ao buscar posts na nuvem em produção:", { error: error.message || error });
        throw new Error(error.message || "Erro de banco de dados");
      }

      let posts = (data || []) as CommunityPost[];

      if (filters?.genre && filters.genre !== 'all') {
        posts = posts.filter(post => post.book_genre?.toLowerCase().includes(filters.genre!.toLowerCase()));
      }

      if (filters?.bookType && filters.bookType !== 'all') {
        posts = posts.filter(post => post.book_type === filters.bookType);
      }

      if (filters?.searchQuery) {
        const queryText = filters.searchQuery.toLowerCase();
        posts = posts.filter(post => 
          post.book_title.toLowerCase().includes(queryText) || 
          post.book_author.toLowerCase().includes(queryText) ||
          post.review.toLowerCase().includes(queryText)
        );
      }

      return posts;
    }

    // Comportamento para ambientes não-produção (Desenvolvimento/Teste/Homologação)
    if (this.useLocalMode) {
      return await this.getLocalPosts(filters);
    }

    try {
      // Unindo posts com perfis, comentários e reações utilizando queries relacionais do Supabase
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          community_reactions (id, post_id, user_id, reaction_type, created_at),
          community_comments (
            id, post_id, user_id, comment_text, created_at,
            profiles:user_id (full_name, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.genre && filters.genre !== 'all') {
        query = query.ilike('book_genre', `%${filters.genre}%`);
      }

      if (filters?.bookType && filters.bookType !== 'all') {
        query = query.eq('book_type', filters.bookType);
      }

      const { data, error } = await query;

      if (error) {
        // Código 42P01 ou PGRST205 indicam que a tabela não existe ou não está em cache no Supabase. Habilita modo local.
        if (error.code === '42P01' || error.code === 'PGRST205') {
          logger.warn("[CommunityService] Tabelas de comunidade não configuradas no Supabase. Utilizando modo offline local por padrão.");
          this.useLocalMode = true;
          return await this.getLocalPosts(filters);
        }
        throw error;
      }

      let posts = (data || []) as CommunityPost[];

      // Filtro de texto no cliente para busca rápida (Título ou Autor do livro)
      if (filters?.searchQuery) {
        const queryText = filters.searchQuery.toLowerCase();
        posts = posts.filter(post => 
          post.book_title.toLowerCase().includes(queryText) || 
          post.book_author.toLowerCase().includes(queryText) ||
          post.review.toLowerCase().includes(queryText)
        );
      }

      return posts;
    } catch (err: any) {
      // Se for erro de tabela inexistente ou relação inexistente, avisa de forma simples sem erro fatal
      const errMsg = err?.message || '';
      if (err?.code === 'PGRST205' || err?.code === '42P01' || errMsg.includes('relationship') || errMsg.includes('relation') || errMsg.includes('schema cache')) {
        logger.warn("[CommunityService] Ativando modo local pois as tabelas na nuvem não foram encontradas:", { error: errMsg });
      } else {
        logger.warn("[CommunityService] Aviso ao obter posts na nuvem (sincronizando offline):", { error: err.message || err });
      }
      this.useLocalMode = true;
      return await this.getLocalPosts(filters);
    }
  }

  // --- COMPARTILHAR POST (CRIAR POST) ---
  async shareReading(payload: {
    bookId?: string;
    bookTitle: string;
    bookAuthor: string;
    bookGenre: string;
    bookType: string;
    bookPages?: number;
    rating: number;
    review: string;
    contemSpoiler: boolean;
  }): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) throw new Error("Usuário não autenticado");

    const dbPost = {
      id: crypto.randomUUID(),
      user_id: userId,
      book_id: payload.bookId || null,
      book_title: payload.bookTitle,
      book_author: payload.bookAuthor,
      book_genre: payload.bookGenre,
      book_type: payload.bookType,
      book_pages: payload.bookPages || 150,
      rating: payload.rating,
      review: payload.review,
      contem_spoiler: payload.contemSpoiler,
      created_at: new Date().toISOString()
    };

    if (this.useLocalMode) {
      this.saveLocalPost(dbPost);
      return;
    }

    try {
      const { error } = await supabase.from('community_posts').insert(dbPost);
      if (error) {
        if (error.code === '42703') {
          logger.warn("[CommunityService] Coluna book_pages não existe no Supabase. Inserindo sem ela.");
          const { book_pages, ...cleanPost } = dbPost;
          const { error: retryError } = await supabase.from('community_posts').insert(cleanPost);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      logger.error("[CommunityService] Erro ao salvar post na nuvem:", { error: err.message || err });
      if (err.code === '42P01') {
        this.useLocalMode = true;
        this.saveLocalPost(dbPost);
        return;
      }
      throw err;
    }
  }

  // --- ADICIONAR OU REMOVER REAÇÃO ---
  async toggleReaction(postId: string, reactionType: string): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) throw new Error("Usuário não autenticado");

    if (this.useLocalMode) {
      this.toggleLocalReaction(postId, userId, reactionType);
      return;
    }

    try {
      // Verifica se a reação já existe
      const { data: existing } = await supabase
        .from('community_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType)
        .maybeSingle();

      if (existing) {
        // Se existe, deleta
        await supabase.from('community_reactions').delete().eq('id', existing.id);
      } else {
        // Se não, insere
        await supabase.from('community_reactions').insert({
          id: crypto.randomUUID(),
          post_id: postId,
          user_id: userId,
          reaction_type: reactionType,
          created_at: new Date().toISOString()
        });
      }
    } catch (err: any) {
      logger.error("[CommunityService] Erro ao gerenciar reação:", { error: err.message || err });
      if (err.code === '42P01') {
        this.useLocalMode = true;
        this.toggleLocalReaction(postId, userId, reactionType);
        return;
      }
      throw err;
    }
  }

  // --- ADICIONAR COMENTÁRIO ---
  async addComment(postId: string, text: string): Promise<CommunityComment> {
    const userId = await this.getUserId();
    if (!userId) throw new Error("Usuário não autenticado");

    const newComment = {
      id: crypto.randomUUID(),
      post_id: postId,
      user_id: userId,
      comment_text: text,
      created_at: new Date().toISOString()
    };

    if (this.useLocalMode) {
      return await this.addLocalComment(newComment);
    }

    try {
      const { data, error } = await supabase
        .from('community_comments')
        .insert(newComment)
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data as CommunityComment;
    } catch (err: any) {
      logger.error("[CommunityService] Erro ao salvar comentário:", { error: err.message || err });
      if (err.code === '42P01') {
        this.useLocalMode = true;
        return await this.addLocalComment(newComment);
      }
      throw err;
    }
  }

  // ==========================================
  // --- MÉTODOS DE FALLBACK LOCAL STORAGE ---
  // ==========================================

  private async getLocalPosts(filters?: {
    searchQuery?: string;
    genre?: string;
    bookType?: string;
  }): Promise<CommunityPost[]> {
    const postsRaw = localStorage.getItem(POSTS_LOCAL_KEY);
    const allowDemo = config.enableDemoData && config.env !== 'produção';
    let posts: any[] = postsRaw ? JSON.parse(postsRaw) : (allowDemo ? getMockPosts() : []);

    // Carregar reações e comentários locais
    const reactionsRaw = localStorage.getItem(REACTIONS_LOCAL_KEY);
    const reactions: CommunityReaction[] = reactionsRaw ? JSON.parse(reactionsRaw) : [];

    const commentsRaw = localStorage.getItem(COMMENTS_LOCAL_KEY);
    const comments: any[] = commentsRaw ? JSON.parse(commentsRaw) : [];

    // Mapeia perfis
    const localProfile = await this.getLocalUserProfile();

    // Processa os posts acoplando as relações
    let processed: CommunityPost[] = posts.map(post => {
      const postReactions = reactions.filter(r => r.post_id === post.id);
      const postComments = comments
        .filter(c => c.post_id === post.id)
        .map(c => ({
          ...c,
          profiles: c.user_id === localProfile.id ? {
            full_name: localProfile.full_name,
            avatar_url: localProfile.avatar_url
          } : {
            full_name: 'Leitor Apaixonado',
            avatar_url: undefined
          }
        }));

      return {
        ...post,
        profiles: post.user_id === localProfile.id ? {
          full_name: localProfile.full_name,
          avatar_url: localProfile.avatar_url
        } : {
          full_name: post.author_name || 'Leitor',
          avatar_url: post.author_avatar || undefined
        },
        community_reactions: postReactions,
        community_comments: postComments
      };
    });

    // Ordenar por data decrescente
    processed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filtros
    if (filters?.genre && filters.genre !== 'all') {
      processed = processed.filter(p => p.book_genre?.toLowerCase().includes(filters.genre!.toLowerCase()));
    }

    if (filters?.bookType && filters.bookType !== 'all') {
      processed = processed.filter(p => p.book_type === filters.bookType);
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      processed = processed.filter(p => 
        p.book_title.toLowerCase().includes(query) || 
        p.book_author.toLowerCase().includes(query) ||
        p.review.toLowerCase().includes(query)
      );
    }

    return processed;
  }

  private saveLocalPost(post: any) {
    const postsRaw = localStorage.getItem(POSTS_LOCAL_KEY);
    const allowDemo = config.enableDemoData && config.env !== 'produção';
    const posts = postsRaw ? JSON.parse(postsRaw) : (allowDemo ? getMockPosts() : []);
    posts.unshift(post);
    localStorage.setItem(POSTS_LOCAL_KEY, JSON.stringify(posts));
  }

  private toggleLocalReaction(postId: string, userId: string, reactionType: string) {
    const reactionsRaw = localStorage.getItem(REACTIONS_LOCAL_KEY);
    let reactions: CommunityReaction[] = reactionsRaw ? JSON.parse(reactionsRaw) : [];

    const existingIndex = reactions.findIndex(
      r => r.post_id === postId && r.user_id === userId && r.reaction_type === reactionType
    );

    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.push({
        id: crypto.randomUUID(),
        post_id: postId,
        user_id: userId,
        reaction_type: reactionType,
        created_at: new Date().toISOString()
      });
    }

    localStorage.setItem(REACTIONS_LOCAL_KEY, JSON.stringify(reactions));
  }

  private async addLocalComment(comment: any): Promise<CommunityComment> {
    const commentsRaw = localStorage.getItem(COMMENTS_LOCAL_KEY);
    const comments = commentsRaw ? JSON.parse(commentsRaw) : [];
    comments.push(comment);
    localStorage.setItem(COMMENTS_LOCAL_KEY, JSON.stringify(comments));

    const localProfile = await this.getLocalUserProfile();
    return {
      ...comment,
      profiles: {
        full_name: localProfile.full_name,
        avatar_url: localProfile.avatar_url
      }
    };
  }

  private async getLocalUserProfile(): Promise<{ id: string; full_name: string; avatar_url: string | undefined }> {
    // Tenta ler perfil autenticado utilizando as APIs oficiais do Supabase Auth
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.user) {
        return {
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || 'Seu Perfil',
          avatar_url: session.user.user_metadata?.avatar_url
        };
      }
    } catch (e: any) {
      logger.warn("[CommunityService] Erro ao recuperar sessão oficial do Supabase:", { error: e.message || e });
    }

    return {
      id: 'local-user-id',
      full_name: 'Você',
      avatar_url: undefined
    };
  }
}

export const communityService = new CommunityService();

// Posts iniciais para deixar a comunidade movimentada de início no modo offline/vazio
function getMockPosts() {
  return [
    {
      id: 'mock-post-1',
      user_id: 'mock-user-alice',
      author_name: 'Alice Silva',
      author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
      book_title: 'Duna',
      book_author: 'Frank Herbert',
      book_genre: 'Ficção',
      book_type: 'Livro',
      book_pages: 680,
      rating: 5,
      review: 'Simplesmente o maior clássico da ficção científica que já li! A construção política, ecológica e social de Arrakis é de uma profundidade absurda. O amadurecimento do Paul Atreides e os dilemas morais do messianismo são fascinantes. Super recomendado para quem quer uma leitura profunda e épica.',
      contem_spoiler: false,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString() // 3h atrás
    },
    {
      id: 'mock-post-2',
      user_id: 'mock-user-bruno',
      author_name: 'Bruno Lima',
      author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
      book_title: 'O Iluminado',
      book_author: 'Stephen King',
      book_genre: 'Terror',
      book_type: 'Livro',
      book_pages: 464,
      rating: 4.5,
      review: 'O declínio psicológico do Jack Torrance no Hotel Overlook é construído de forma primorosa e claustrofóbica. Stephen King sabe explorar como ninguém os demônios pessoais e o isolamento. SPOILER: A cena da banheira no quarto 217 ainda me dá arrepios!',
      contem_spoiler: true,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString() // Ontem
    },
    {
      id: 'mock-post-3',
      user_id: 'mock-user-carla',
      author_name: 'Carla Souza',
      author_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
      book_title: 'Watchmen',
      book_author: 'Alan Moore',
      book_genre: 'Quadrinho',
      book_type: 'HQ',
      book_pages: 416,
      rating: 5,
      review: 'Uma obra-prima absoluta que desconstrói totalmente o gênero de super-heróis. A narrativa paralela, o simbolismo do relógio do juízo final e a profundidade existencial do Dr. Manhattan dão um nó na cabeça. Indispensável para qualquer fã de quadrinhos sérios.',
      contem_spoiler: false,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString() // 2 dias atrás
    }
  ];
}
