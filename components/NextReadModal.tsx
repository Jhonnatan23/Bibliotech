
import React from 'react';
import type { Book } from '../types';
import { BookStatus, STATUS_CONFIGS, STATUS_COLORS } from '../types';
import { XMarkIcon, BookOpenIcon, PlayIcon, SparklesIcon, TagIcon, HeartIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface NextReadModalProps {
  finishedBook?: Book;
  recommendedBook: Book;
  onClose: () => void;
  onStartReading: (book: Book) => void;
  ruleUsed: 'linked' | 'tag' | 'genre' | 'random' | 'random_pick';
}

export const NextReadModal: React.FC<NextReadModalProps> = ({ 
  finishedBook, 
  recommendedBook, 
  onClose, 
  onStartReading,
  ruleUsed
}) => {
  const authorsList = recommendedBook.author.split(',').map(a => a.trim());
  const genresList = recommendedBook.genre.split(',').map(g => g.trim());
  
  const ruleMessages = {
    linked: 'Este livro está vinculado à sua última leitura!',
    tag: `Ambos compartilham a tag "${recommendedBook.tags?.find(t => finishedBook?.tags?.includes(t)) || 'relacionada'}"`,
    genre: finishedBook ? `Como você gostou de ${finishedBook.genre.split(',')[0]}, talvez goste deste também!` : 'Um gênero que você costuma ler!',
    random: 'Que tal uma nova aventura aleatória para sua estante?',
    random_pick: 'Sorteamo este livro da sua pilha para você!'
  };

  const statusConfig = STATUS_CONFIGS[recommendedBook.status];
  const statusColor = STATUS_COLORS[statusConfig.color];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all z-10"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="p-8 pt-12 relative flex flex-col items-center text-center">
            <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-xl shadow-emerald-500/20 mb-6">
                <SparklesIcon className="h-6 w-6" />
            </div>

            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">
                {finishedBook ? 'Leitura Finalizada!' : 'Escolha Aleatória!'}
            </h2>
            {finishedBook && (
                <h3 className="text-xl font-bold text-slate-400 dark:text-slate-500 mb-8 font-serif italic">"{finishedBook.title}"</h3>
            )}
            {!finishedBook && <div className="mb-4" />}

            <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 mb-8 relative group transition-all hover:border-primary/30">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    {finishedBook ? 'Próxima Sugestão' : 'Livro Sorteado'}
                </div>

                <div className="mt-2 text-primary mb-4 flex justify-center">
                    {ruleUsed === 'linked' && <HeartIcon className="h-6 w-6" />}
                    {ruleUsed === 'tag' && <TagIcon className="h-6 w-6" />}
                    {(ruleUsed === 'genre' || ruleUsed === 'random_pick') && <BookOpenIcon className="h-6 w-6" />}
                    {ruleUsed === 'random' && <SparklesIcon className="h-6 w-6" />}
                </div>

                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 px-4">
                    {ruleMessages[ruleUsed]}
                </p>

                <h4 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 mb-2 leading-tight font-serif italic">
                    {recommendedBook.title}
                </h4>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-6">
                    de {authorsList.join(' & ')}
                </p>

                <div className="flex flex-wrap justify-center gap-2">
                    <span className={`${statusColor.bg} ${statusColor.text} ${statusColor.border} border px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest`}>
                        {statusConfig.label}
                    </span>
                    {genresList.slice(0, 2).map(g => (
                        <span key={g} className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            {g}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-col w-full gap-3">
                <button
                    onClick={() => {
                        onStartReading(recommendedBook);
                        onClose();
                    }}
                    className="w-full py-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <PlayIcon className="h-4 w-4" />
                    Começar a Ler Agora
                </button>
                <button
                    onClick={onClose}
                    className="w-full py-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                    Fechar
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
