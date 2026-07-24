import { logger } from '../services/monitoring';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CommunityPost, CommunityComment } from '../types';
import { StarIcon, StarIconFilled } from './Icons';
import { communityService } from '../services/communityService';

interface CommunityPostCardProps {
  post: CommunityPost;
  currentUserId: string;
  onRefresh: () => void;
  onAddToWishlist: (bookData: { title: string; author: string; pages: number; genre: string; type: any }) => void;
  onBookClick: () => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ 
  post, 
  currentUserId, 
  onRefresh,
  onAddToWishlist,
  onBookClick
}) => {
  const [showSpoiler, setShowSpoiler] = useState<boolean>(!post.contem_spoiler);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [commentsList, setCommentsList] = useState<CommunityComment[]>(post.community_comments || []);

  const authorName = post.profiles?.full_name || 'Leitor';
  const authorAvatar = post.profiles?.avatar_url;
  const authorInitial = authorName.charAt(0).toUpperCase();

  const formattedDate = new Date(post.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Agrupamento de reações por tipo
  const reactions = post.community_reactions || [];
  const likesCount = reactions.filter(r => r.reaction_type === 'like').length;
  const lovesCount = reactions.filter(r => r.reaction_type === 'love').length;
  const clapsCount = reactions.filter(r => r.reaction_type === 'clap').length;

  const hasLiked = reactions.some(r => r.user_id === currentUserId && r.reaction_type === 'like');
  const hasLoved = reactions.some(r => r.user_id === currentUserId && r.reaction_type === 'love');
  const hasClapped = reactions.some(r => r.user_id === currentUserId && r.reaction_type === 'clap');

  const handleReaction = async (type: string) => {
    try {
      await communityService.toggleReaction(post.id, type);
      onRefresh();
    } catch (err) {
      logger.error("Erro ao registrar reação:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await communityService.addComment(post.id, commentText);
      setCommentsList(prev => [...prev, newComment]);
      setCommentText('');
      onRefresh(); // Sincroniza estado geral do card
    } catch (err) {
      logger.error("Erro ao enviar comentário:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Cores de fundo baseadas em hash simples do título do livro
  const getCoverColor = (title: string) => {
    const colors = [
      'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
      'bg-indigo-500/10 border-indigo-500/20 text-indigo-600',
      'bg-amber-500/10 border-amber-500/20 text-amber-600',
      'bg-rose-500/10 border-rose-500/20 text-rose-600',
      'bg-sky-500/10 border-sky-500/20 text-sky-600',
      'bg-purple-500/10 border-purple-500/20 text-purple-600'
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const coverStyle = getCoverColor(post.book_title);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      
      {/* 1. Header do Post */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm overflow-hidden select-none">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              authorInitial
            )}
          </div>
          
          {/* Nome e Data */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {authorName}
            </h4>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-0.5">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Estrelas de Avaliação */}
        <div className="flex items-center gap-0.5 bg-amber-500/5 px-2.5 py-1 rounded-full border border-amber-500/10">
          {[1, 2, 3, 4, 5].map((star) => (
            <React.Fragment key={star}>
              {star <= Math.round(post.rating) ? (
                <StarIconFilled className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <StarIcon className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              )}
            </React.Fragment>
          ))}
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 ml-1">
            {post.rating}
          </span>
        </div>
      </div>

      {/* 2. Conteúdo Lateral (Capa à esquerda, resenha à direita) */}
      <div className="p-4 sm:p-5 flex gap-4 sm:gap-5 items-start">
        {/* Capa */}
        <div 
          onClick={onBookClick}
          className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border flex-shrink-0 flex flex-col justify-between items-center text-center p-2 shadow-inner select-none cursor-pointer hover:scale-105 transition-all ${coverStyle}`}
          title="Clique para ver detalhes e sinopse"
        >
          <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
            {post.book_type || 'Livro'}
          </span>
          <span className="text-[16px] sm:text-2xl">📚</span>
          <span className="text-[7px] font-bold truncate max-w-full opacity-60">
            {post.book_genre || 'Geral'}
          </span>
        </div>

        {/* Informações Literárias e Resenha */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
              {post.book_genre || 'Gênero não informado'}
            </span>
            
            {/* Botão de Adicionar à Lista de Compras rápido no card */}
            <button
              onClick={() => onAddToWishlist({
                title: post.book_title,
                author: post.book_author,
                pages: post.book_pages || 150,
                genre: post.book_genre || 'Não especificado',
                type: post.book_type || 'Livro'
              })}
              className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 active:scale-95 border border-emerald-500/15 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              title="Adicionar à Lista de Compras"
            >
              <span>🛒</span> + Lista
            </button>
          </div>
          
          <h3 
            onClick={onBookClick}
            className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 truncate mt-1.5 leading-tight cursor-pointer hover:text-primary transition-colors"
            title="Clique para ver detalhes e sinopse"
          >
            {post.book_title}
          </h3>
          <p 
            onClick={onBookClick}
            className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5 cursor-pointer hover:text-primary transition-colors"
            title="Clique para ver detalhes e sinopse"
          >
            de {post.book_author}
          </p>

          {/* Comentário de Spoiler */}
          <div className="mt-3 relative">
            {post.contem_spoiler && !showSpoiler ? (
              <div 
                onClick={() => setShowSpoiler(true)}
                className="cursor-pointer group relative overflow-hidden rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/10 p-4 transition-all hover:bg-rose-50/70"
              >
                {/* Texto embaçado */}
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 blur-sm select-none">
                  {post.review}
                </p>
                {/* Overlay de Alerta */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-rose-50/70 dark:bg-rose-950/60 backdrop-blur-xs text-center">
                  <span className="text-[16px] mb-1">⚠️</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400">
                    Contém Spoilers
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-500 mt-0.5 group-hover:underline">
                    Clique aqui para revelar
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-medium">
                {post.review}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Barra de Interações */}
      <div className="px-4 py-3 border-t border-slate-50 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-between gap-2 flex-wrap">
        {/* Reações */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Reaction LIKE */}
          <button
            onClick={() => handleReaction('like')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 ${
              hasLiked 
                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/50' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
            }`}
            title="Curtir"
          >
            <span>👍</span>
            <span>{likesCount}</span>
          </button>

          {/* Reaction LOVE */}
          <button
            onClick={() => handleReaction('love')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 ${
              hasLoved 
                ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900/50' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
            }`}
            title="Amei"
          >
            <span>❤️</span>
            <span>{lovesCount}</span>
          </button>

          {/* Reaction CLAP */}
          <button
            onClick={() => handleReaction('clap')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 ${
              hasClapped 
                ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/50' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
            }`}
            title="Palmas"
          >
            <span>👏</span>
            <span>{clapsCount}</span>
          </button>
        </div>

        {/* Comentário Toggle */}
        <button
          onClick={() => setIsCommentsOpen(!isCommentsOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
            isCommentsOpen 
              ? 'bg-primary/5 border-primary/20 text-primary' 
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-1.074-.765 11.995 11.995 0 0 0 1.61-3.21.75.75 0 0 0-.074-.665C4.03 14.82 3 13.5 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          Comentar ({commentsList.length})
        </button>
      </div>

      {/* 4. Gaveta de Comentários (Acordeão) */}
      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/10 overflow-hidden"
          >
            <div className="p-4 sm:p-5 space-y-4">
              
              {/* Lista de Comentários */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {commentsList.length === 0 ? (
                  <p className="text-[10px] text-center py-4 font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
                    Nenhum comentário ainda. Seja o primeiro a comentar!
                  </p>
                ) : (
                  commentsList.map((comment) => {
                    const commentAuthor = comment.profiles?.full_name || 'Leitor';
                    const commentAvatar = comment.profiles?.avatar_url;
                    const commentInitial = commentAuthor.charAt(0).toUpperCase();
                    const commentDate = new Date(comment.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={comment.id} className="flex gap-3 items-start p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 shadow-xs">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs flex-shrink-0 overflow-hidden">
                          {commentAvatar ? (
                            <img src={commentAvatar} alt={commentAuthor} className="w-full h-full object-cover" />
                          ) : (
                            commentInitial
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide truncate">
                              {commentAuthor}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              {commentDate}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                            {comment.comment_text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Formulário de Envio Rápido */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Deixe seu comentário..."
                  disabled={isSubmittingComment}
                  maxLength={300}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="py-2.5 px-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-xl font-black uppercase tracking-widest text-[9px] active:scale-95 transition-all shadow-md shadow-primary/10 flex items-center gap-1"
                >
                  {isSubmittingComment ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Enviar</span>
                  )}
                </button>
              </form>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
