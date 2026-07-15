import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Book } from '../types';
import { StarIcon, StarIconFilled, XMarkIcon } from './Icons';
import { communityService } from '../services/communityService';

interface ShareToCommunityModalProps {
  book: Book;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShareToCommunityModal: React.FC<ShareToCommunityModalProps> = ({ book, onClose, onSuccess }) => {
  const [rating, setRating] = useState<number>(book.rating || 5);
  const [review, setReview] = useState<string>('');
  const [contemSpoiler, setContemSpoiler] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review.trim()) {
      setError("Por favor, escreva um comentário ou resenha para compartilhar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await communityService.shareReading({
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookGenre: book.genre,
        bookType: book.type,
        bookPages: book.pages,
        rating,
        review,
        contemSpoiler,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao publicar na comunidade.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Compartilhar Leituras
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              Compartilhe sua resenha com a comunidade!
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Book Info Summary */}
          <div className="flex gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 dark:bg-slate-950 dark:border-slate-800/80">
            <div className="w-12 h-16 rounded-lg bg-primary/10 border border-primary/20 flex flex-col justify-center items-center text-center p-1 text-primary font-black uppercase tracking-widest text-[9px] shadow-sm select-none">
              📖
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                {book.type || 'Livro'}
              </span>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate mt-0.5">
                {book.title}
              </h4>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {book.author}
              </p>
            </div>
          </div>

          {/* Rating (Estrelas interativas) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Sua Nota para o Livro
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-115 active:scale-95 transition-all"
                >
                  {star <= rating ? (
                    <StarIconFilled className="w-8 h-8 fill-amber-400" />
                  ) : (
                    <StarIcon className="w-8 h-8 stroke-amber-400 dark:stroke-slate-600" />
                  )}
                </button>
              ))}
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 ml-2">
                ({rating}/5 estrelas)
              </span>
            </div>
          </div>

          {/* Resenha / Comentários */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
              Sua Resenha ou Comentários
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="O que você achou dessa leitura? Escreva seus pontos de vista, citações favoritas ou reflexões..."
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 resize-none"
            />
            <div className="text-right text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {review.length}/1000 caracteres
            </div>
          </div>

          {/* Checkbox Contém Spoiler */}
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={contemSpoiler}
                onChange={(e) => setContemSpoiler(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20"
              />
              <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">
                ⚠️ Contém Spoiler nesta resenha
              </span>
            </label>
          </div>

          {error && (
            <div className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-200 dark:border-red-900/40 text-center animate-pulse">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Compartilhando...</span>
                </>
              ) : (
                <span>Compartilhar</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
