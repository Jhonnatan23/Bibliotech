import { logger } from '../services/monitoring';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CommunityPost } from '../types';
import { XMarkIcon } from './Icons';
import { searchGoogleBooks, GoogleBookResult } from '../services/googleBooksService';

interface CommunityBookDetailModalProps {
  post: CommunityPost;
  onClose: () => void;
  onAddToWishlist: (bookData: { title: string; author: string; pages: number; genre: string; type: any }) => void;
}

export const CommunityBookDetailModal: React.FC<CommunityBookDetailModalProps> = ({
  post,
  onClose,
  onAddToWishlist,
}) => {
  const [googleBook, setGoogleBook] = useState<GoogleBookResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const fetchDetailedInfo = async () => {
      setIsLoading(true);
      try {
        const query = `${post.book_title} ${post.book_author}`;
        const results = await searchGoogleBooks(query);
        if (active && results && results.length > 0) {
          // Busca o que tem descrição ou pega o primeiro
          const bestMatch = results.find(r => r.description) || results[0];
          setGoogleBook(bestMatch);
        }
      } catch (err) {
        logger.error("Erro ao buscar detalhes no Google Books:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchDetailedInfo();
    return () => {
      active = false;
    };
  }, [post.book_title, post.book_author]);

  const displayPages = post.book_pages || googleBook?.pageCount || 150;
  const displayGenre = post.book_genre || googleBook?.categories?.[0] || 'Ficção';
  const displaySynopsis = googleBook?.description || post.review || 'Nenhuma sinopse disponível para este livro.';

  // Cores de fundo baseadas no título do livro para a capa estilizada
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
              Detalhes do Livro
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              Informações detalhadas sobre a obra publicada
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Info Row */}
          <div className="flex gap-5 items-start">
            {/* Styled Book Cover */}
            <div className={`w-24 h-36 rounded-2xl border flex-shrink-0 flex flex-col justify-between items-center text-center p-3 shadow-md select-none ${coverStyle}`}>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                {post.book_type || 'Livro'}
              </span>
              <span className="text-3xl">📚</span>
              <span className="text-[8px] font-bold truncate max-w-full opacity-60">
                {displayGenre}
              </span>
            </div>

            {/* Texts */}
            <div className="flex-1 min-w-0 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                {displayGenre}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-snug">
                {post.book_title}
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Autor: <span className="text-slate-700 dark:text-slate-300 font-black">{post.book_author}</span>
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                  📄 {displayPages} Páginas
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                  🏷️ {post.book_type || 'Livro'}
                </span>
              </div>
            </div>
          </div>

          {/* Synopsis Section */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Sinopse do Livro
            </h4>
            
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 animate-pulse">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Buscando sinopse...</span>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 max-h-48 overflow-y-auto">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-medium">
                  {displaySynopsis}
                </p>
              </div>
            )}
          </div>

          {/* Post Origin Section (Optional nice-to-have) */}
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-primary">
              Opinião de {post.profiles?.full_name || 'Leitor'}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-xs">
                  {i < Math.round(post.rating) ? '⭐' : '☆'}
                </span>
              ))}
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 ml-1">({post.rating}/5)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic font-medium leading-relaxed">
              "{post.review}"
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                onAddToWishlist({
                  title: post.book_title,
                  author: post.book_author,
                  pages: displayPages,
                  genre: displayGenre,
                  type: post.book_type || 'Livro'
                });
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <span>🛒</span> Adicionar à Lista
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
