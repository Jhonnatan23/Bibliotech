import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Book } from '../types';
import { RatingStars } from './RatingStars';
import { StarIconFilled } from './Icons';

interface CelebrationModalProps {
  isOpen: boolean;
  book: Book;
  onClose: () => void;
  onSaveRatingAndFinish: (rating: number, review?: string) => Promise<void> | void;
  onShare: () => void;
  initialRating?: number;
}

const CONFETTI_COLORS = [
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#ec4899', // pink-500
  '#8b5cf6', // purple-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
];

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  book,
  onClose,
  onSaveRatingAndFinish,
  onShare,
  initialRating = 0,
}) => {
  const [rating, setRating] = useState<number>(initialRating || book.rating || 0);
  const [review, setReview] = useState<string>(book.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(Boolean(book.notes));
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener?.('change', handler);
      return () => mediaQuery.removeEventListener?.('change', handler);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating || book.rating || 0);
      setReview(book.notes || '');
      setShowReviewInput(Boolean(book.notes));
      setIsSubmitting(false);
    }
  }, [isOpen, initialRating, book.rating, book.notes]);

  // Generate lightweight particles if not reduced motion
  const particles = useMemo(() => {
    if (prefersReducedMotion) return [];
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage across screen
      y: Math.random() * 20 + 80, // bottom starting position
      drift: (Math.random() - 0.5) * 80,
      size: Math.random() * 10 + 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.4,
      duration: Math.random() * 1.5 + 1.2,
      shape: i % 3 === 0 ? 'circle' : 'square',
    }));
  }, [isOpen, prefersReducedMotion]);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await onSaveRatingAndFinish(rating, review.trim() || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        data-testid="celebration-modal-backdrop"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Floating Confetti Particles (skipped on prefers-reduced-motion) */}
        {!prefersReducedMotion && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  left: `${p.x}vw`,
                  top: '100vh',
                  opacity: 1,
                  scale: 0.6,
                }}
                animate={{
                  top: '-10vh',
                  left: `calc(${p.x}vw + ${p.drift}px)`,
                  opacity: [1, 1, 0],
                  scale: [0.6, 1.2, 0.8],
                  rotate: [0, 360 * (p.id % 2 === 0 ? 1 : -1)],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  borderRadius: p.shape === 'circle' ? '9999px' : '3px',
                }}
              />
            ))}
          </div>
        )}

        {/* Celebration Dialog Box */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.88, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.92, y: -16, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-amber-500/20 rounded-[2.5rem] p-6 sm:p-9 max-w-lg w-full shadow-2xl text-center overflow-hidden z-10 my-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebration-title"
          data-testid="celebration-modal"
        >
          {/* Subtle Ambient Glowing Gradients */}
          <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-500/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-transparent blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="relative space-y-6">
            {/* Trophy & Sparkles Trophy Icon */}
            <div className="relative inline-block mx-auto mt-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 dark:from-amber-600 dark:to-amber-400 flex items-center justify-center text-4xl sm:text-5xl shadow-xl shadow-amber-500/25 border-4 border-white dark:border-slate-800">
                <span className="select-none animate-bounce" style={{ animationDuration: '2s' }}>🏆</span>
              </div>
              <span className="absolute -top-2 -right-2 text-2xl select-none" aria-hidden="true">✨</span>
              <span className="absolute -bottom-1 -left-2 text-xl select-none" aria-hidden="true">🎉</span>
            </div>

            {/* Congratulatory Header */}
            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3.5 py-1.5 rounded-full border border-amber-200 dark:border-amber-800/80 mb-2">
                Leitura Concluída! 100%
              </span>
              <h2 id="celebration-title" className="text-2xl sm:text-3xl font-black font-serif italic text-slate-900 dark:text-slate-50 leading-tight">
                Parabéns pelo marco!
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto line-clamp-2">
                Você finalizou <span className="font-bold text-slate-800 dark:text-slate-200">"{book.title}"</span> ({book.pages} páginas)!
              </p>
            </div>

            {/* Quick Rating Area */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Sua Avaliação:
                </span>
                <div className="flex items-center gap-1.5 font-mono text-amber-500 font-black text-sm">
                  <span>{rating > 0 ? rating.toFixed(1) : 'Sem nota'}</span>
                  <StarIconFilled className="h-4 w-4 text-amber-500" />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-1">
                <RatingStars
                  rating={rating}
                  onChange={(val) => setRating(val)}
                  size="lg"
                  precision={0.5}
                  showLabel={false}
                  className="justify-center"
                />
              </div>

              {/* Review field toggle */}
              {!showReviewInput ? (
                <button
                  type="button"
                  onClick={() => setShowReviewInput(true)}
                  className="text-xs text-primary dark:text-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                >
                  <span>✍️</span> Escrever uma resenha curta
                </button>
              ) : (
                <div className="space-y-1.5 pt-1 text-left">
                  <label htmlFor="celebration-review" className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    O que achou da história? (Opcional)
                  </label>
                  <textarea
                    id="celebration-review"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Escreva suas impressões, pontos fortes e recomendações..."
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>

            {/* Primary Action Buttons: Confirm & Share */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                data-testid="celebration-confirm-btn"
                className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>✓</span>
                <span>{isSubmitting ? 'Salvando...' : 'Salvar e Concluir'}</span>
              </button>

              <button
                type="button"
                onClick={onShare}
                data-testid="celebration-share-btn"
                className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-primary hover:text-white dark:bg-slate-800 dark:hover:bg-primary dark:text-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                title="Compartilhar card de conquista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186.002-.003.001-.002a2.25 2.25 0 0 1 3.869-2.006l1.414.707a2.25 2.25 0 0 0 1.503.203l3.67-.918A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 1 5.25 16.5h13.5A2.25 2.25 0 0 1 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h3.75" />
                </svg>
                <span>Compartilhar</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
