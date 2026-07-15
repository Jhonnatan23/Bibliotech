import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CommunityPost, Profile } from '../types';
import { GENRES } from '../types';
import { CommunityPostCard } from './CommunityPostCard';
import { communityService, COMMUNITY_SQL_MIGRATION } from '../services/communityService';
import { CommunityBookDetailModal } from './CommunityBookDetailModal';

interface CommunityViewProps {
  profile: Profile | null;
  onAddToWishlist: (bookData: { title: string; author: string; pages: number; genre: string; type: any }) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ profile, onAddToWishlist }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false);
  const [showSqlHelp, setShowSqlHelp] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<CommunityPost | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await communityService.getPosts({
        searchQuery,
        genre: genreFilter,
        bookType: typeFilter
      });
      setPosts(data);
      setIsLocalMode(communityService.isLocalMode());
    } catch (err) {
      console.error("Erro ao carregar feed da comunidade:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, genreFilter, typeFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(COMMUNITY_SQL_MIGRATION);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Título da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>👥</span> Comunidade de Leituras
          </h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
            Veja as resenhas dos leitores, reaja com emojis e comente sobre os livros concluídos!
          </p>
        </div>

        {/* Status da Sincronização */}
        <div 
          onClick={() => setShowSqlHelp(!showSqlHelp)}
          className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer select-none self-start ${
            isLocalMode 
              ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/50' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/50'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${isLocalMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></div>
          <span>{isLocalMode ? 'Modo Local Ativo (Clique para configurar Nuvem)' : 'Conectado à Nuvem'}</span>
        </div>
      </div>

      {/* Box de Ajuda SQL de Configuração (Apenas se clicado ou se local para ajudar o desenvolvedor) */}
      {showSqlHelp && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60 dark:bg-slate-900 dark:border-slate-800/80 space-y-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                🛠️ Guia de Integração de Nuvem (Supabase)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Este recurso suporta persistência em tempo real e compartilhamento global de leituras via Supabase. Para ativá-lo, copie e execute o script SQL abaixo no <strong>SQL Editor</strong> do seu painel do Supabase.
              </p>
            </div>
            <button 
              onClick={() => setShowSqlHelp(false)}
              className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600"
            >
              Fechar
            </button>
          </div>

          <div className="relative">
            <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 p-4 rounded-xl max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800/60 select-all">
              {COMMUNITY_SQL_MIGRATION}
            </pre>
            <button
              onClick={handleCopySql}
              className="absolute top-2 right-2 px-3 py-1.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md hover:bg-primary-hover active:scale-95 transition-all"
            >
              {copiedSql ? 'Copiado!' : 'Copiar SQL'}
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. Barra de Filtros Superior */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 shadow-sm">
        {/* Campo de Busca Textual */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por livro, autor ou trecho de resenha..."
            className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>

        {/* Filtros em Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Gênero */}
          <div className="w-full sm:w-44">
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 font-bold focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">📚 Gêneros (Todos)</option>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Leitura */}
          <div className="w-full sm:w-44">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 font-bold focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">📖 Tipos (Todos)</option>
              <option value="Livro">Livro</option>
              <option value="HQ">HQ / Quadrinho</option>
              <option value="Mangá">Mangá</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Feed de Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
            Carregando publicações...
          </span>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-10 text-center space-y-3 shadow-sm">
          <span className="text-4xl">📭</span>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Nenhuma publicação encontrada
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
            Compartilhe a sua primeira leitura lida na estante ou no seu histórico para iniciar o feed da comunidade!
          </p>
          <button 
            onClick={fetchPosts}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            Atualizar Feed
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              currentUserId={profile?.id || 'local-user-id'}
              onRefresh={fetchPosts}
              onAddToWishlist={onAddToWishlist}
              onBookClick={() => setSelectedPostForDetail(post)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedPostForDetail && (
          <CommunityBookDetailModal
            post={selectedPostForDetail}
            onClose={() => setSelectedPostForDetail(null)}
            onAddToWishlist={onAddToWishlist}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
