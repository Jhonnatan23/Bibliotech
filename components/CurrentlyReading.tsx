
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Book, Profile } from '../types';
import { BookStatus } from '../types';
import { StarIconFilled } from './Icons';
import { ShareProgressModal } from './ShareProgressModal';
import { RatingStars } from './RatingStars';
import { CelebrationModal } from './CelebrationModal';

interface CurrentlyReadingProps {
  book: Book;
  updateBook: (book: Book) => Promise<void>;
  profile: Profile | null;
  onOpenJournal?: (bookId: string) => void;
}

const calculateDaysReading = (startDate?: string) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    start.setHours(0,0,0,0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
}

export const CurrentlyReading: React.FC<CurrentlyReadingProps> = ({ book, updateBook, profile, onOpenJournal }) => {
    const [currentPage, setCurrentPage] = useState(book.currentPage || 0);
    const [dateStarted, setDateStarted] = useState(book.dateStarted || new Date().toISOString().split('T')[0]);
    const [isFinishing, setIsFinishing] = useState(false);
    const [selectedRating, setSelectedRating] = useState<number>(book.rating || 0);
    const [isSaving, setIsSaving] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showCelebrationModal, setShowCelebrationModal] = useState(false);
    const [microToast, setMicroToast] = useState<{ id: number; message: string; sub?: string } | null>(null);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevPageRef = useRef(book.currentPage || 0);
    
    const daysReading = useMemo(() => calculateDaysReading(dateStarted), [dateStarted]);
    const progressPercentage = book.pages > 0 ? (currentPage / book.pages) * 100 : 0;
    const pagesRemaining = Math.max(0, book.pages - currentPage);
    
    const pagesPerDay = useMemo(() => {
        const days = daysReading || 1;
        return Math.round((currentPage / days) * 10) / 10;
    }, [currentPage, daysReading]);

    const estDaysToFinish = useMemo(() => {
        if (pagesPerDay <= 0) return null;
        return Math.ceil(pagesRemaining / pagesPerDay);
    }, [pagesRemaining, pagesPerDay]);

    const estimatedFinishDate = useMemo(() => {
        if (!estDaysToFinish || estDaysToFinish <= 0) return null;
        const target = new Date();
        target.setDate(target.getDate() + estDaysToFinish);
        return target.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }, [estDaysToFinish]);

    useEffect(() => {
        setCurrentPage(book.currentPage || 0);
        prevPageRef.current = book.currentPage || 0;
        setDateStarted(book.dateStarted || new Date().toISOString().split('T')[0]);
        setIsFinishing(false);
        setSelectedRating(0);
        setIsSaving(false);
        setShowCelebrationModal(false);
        setMicroToast(null);
    }, [book.id]);

    const triggerToast = (message: string, sub?: string) => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setMicroToast({ id: Date.now(), message, sub });
        toastTimeoutRef.current = setTimeout(() => {
            setMicroToast(null);
        }, 3400);
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0 && value <= book.pages) {
            setCurrentPage(value);
        } else if (e.target.value === '') {
            setCurrentPage(0);
        }
    };

    const handleUpdateClick = async () => {
        setIsSaving(true);
        try {
            await updateBook({ ...book, currentPage, dateStarted });
            if (currentPage >= book.pages && book.pages > 0) {
                setShowCelebrationModal(true);
            } else {
                triggerToast(`Progresso salvo na página ${currentPage}!`, `Faltam ${pagesRemaining}p para concluir.`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleAbandonClick = async () => {
        setIsSaving(true);
        try {
            const startDate = book.dateStarted ? new Date(book.dateStarted) : new Date(book.dateAdded);
            const finishDate = new Date();
            const daysToFinish = Math.ceil((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            await updateBook({ 
                ...book, 
                currentPage, 
                status: BookStatus.Dropped,
                dateFinished: finishDate.toISOString().split('T')[0],
                daysToFinish
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmFinish = async () => {
        setIsSaving(true);
        try {
            const updatedBook: Book = { 
                ...book, 
                currentPage: book.pages, 
                status: BookStatus.Read,
                rating: selectedRating,
                dateFinished: new Date().toISOString().split('T')[0],
                daysToFinish: daysReading,
                timesRead: (book.timesRead || 0) + 1
            };
            await updateBook(updatedBook);
            setIsFinishing(false);
            setShowCelebrationModal(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCelebrationRating = async (rating: number, review?: string) => {
        setIsSaving(true);
        try {
            const updatedBook: Book = {
                ...book,
                currentPage: book.pages,
                status: BookStatus.Read,
                rating,
                notes: review || book.notes,
                dateFinished: new Date().toISOString().split('T')[0],
                daysToFinish: daysReading,
                timesRead: (book.timesRead || 0) + 1
            };
            await updateBook(updatedBook);
            setShowCelebrationModal(false);
            setIsFinishing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const updatePage = (newPage: number, incLabel?: number) => {
        const boundedPage = Math.min(book.pages, Math.max(0, newPage));
        const diff = boundedPage - currentPage;
        setCurrentPage(boundedPage);

        if (boundedPage >= book.pages && book.pages > 0) {
            // Milestone: Completed book!
            setShowCelebrationModal(true);
            setIsFinishing(true);
        } else if (diff > 0) {
            const remaining = book.pages - boundedPage;
            const label = incLabel ? `+${incLabel}` : `+${diff}`;
            triggerToast(
                `${label} páginas registradas!`,
                remaining > 0 ? `Faltam ${remaining}p para concluir.` : 'Meta de páginas alcançada!'
            );
        }
    };

    const handleCompleteBook = () => {
        setCurrentPage(book.pages);
        setIsFinishing(true);
        setShowCelebrationModal(true);
    };

    const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];
    const authorsList = book.author ? book.author.split(',').map(a => a.trim()).filter(a => a !== '') : [];

  return (
    <div className="dashboard-card bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] shadow-md shadow-slate-900/[0.04] dark:shadow-black/40 border border-slate-200/90 dark:border-slate-750/80 ring-1 ring-slate-900/[0.03] dark:ring-white/[0.05] h-full flex flex-col relative overflow-hidden group transition-all hover:shadow-2xl">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10 w-full gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="animate-pulse">
            <span className="bg-primary text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">
              Lendo agora
            </span>
          </div>
          {daysReading >= 0 && (
            <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
              Lendo há {daysReading} {daysReading === 1 ? 'dia' : 'dias'}
            </span>
          )}
        </div>
        
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 hover:bg-primary dark:bg-slate-800 dark:hover:bg-primary text-slate-500 dark:text-slate-400 hover:text-white dark:hover:text-white transition-all text-[9.5px] sm:text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 active:scale-95 shadow-md hover:shadow-lg hover:shadow-primary/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186.002-.003.001-.002a2.25 2.25 0 0 1 3.869-2.006l1.414.707a2.25 2.25 0 0 0 1.503.203l3.67-.918A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 1 5.25 16.5h13.5A2.25 2.25 0 0 1 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h3.75" />
          </svg>
          Compartilhar
        </button>
      </div>
      
      <div className="flex-1 w-full relative z-10">
          {!isFinishing ? (
            <div className="flex flex-col h-full">
              <div className="mb-8">
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-slate-50 mb-3 leading-tight font-serif italic group-hover:text-primary transition-colors duration-500 line-clamp-2">{book.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {authorsList.map((author, idx) => (
                    <React.Fragment key={author}>
                      <p className="text-lg md:text-2xl text-slate-400 dark:text-slate-500 font-bold tracking-tight">{author}</p>
                      {idx < authorsList.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-auto">
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                      {genresList.slice(0, 2).map(g => (
                        <span key={g} className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-[9px] font-black uppercase tracking-widest">
                            {g}
                        </span>
                      ))}
                      <span className="bg-blue-50/50 dark:bg-blue-900/10 text-primary px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50 text-[9px] font-black uppercase tracking-widest">
                        {book.pages} pág
                      </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-6xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">{progressPercentage.toFixed(0)}%</span>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Concluído</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentPage} de {book.pages}</p>
                        </div>
                    </div>
                    <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-2xl h-4 overflow-hidden p-1 border transition-all duration-500 ${
                      progressPercentage >= 100
                        ? 'border-emerald-300/80 dark:border-emerald-600/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'border-slate-200/50 dark:border-slate-700'
                    }`}>
                      <div 
                          data-testid="currently-reading-progress"
                          className={`h-full rounded-xl transition-all duration-500 ease-out ${
                            progressPercentage >= 100
                              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 progress-glow-100 shadow-[0_0_18px_rgba(16,185,129,0.7)] ring-1 ring-emerald-300 dark:ring-emerald-400/60'
                              : 'bg-gradient-to-r from-primary via-blue-500 to-indigo-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>

                    {/* Quick Increment Buttons & Direct Concluir Livro */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-bold mr-1 flex items-center gap-1 select-none">
                        <span className="text-amber-500">⚡</span> Avanço rápido:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[5, 10, 20, 50].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            disabled={isSaving || currentPage >= book.pages}
                            data-testid={`quick-inc-${inc}`}
                            onClick={() => updatePage(Math.min(book.pages, currentPage + inc), inc)}
                            className="px-2.5 py-1 text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                            title={`Avançar +${inc} páginas`}
                          >
                            +{inc}p
                          </button>
                        ))}

                        <button
                          type="button"
                          disabled={isSaving}
                          data-testid="complete-book-btn"
                          onClick={handleCompleteBook}
                          className="px-2.5 py-1 text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg transition-all duration-150 active:scale-95 shadow-xs flex items-center gap-1 ml-auto sm:ml-1"
                          title="Marcar todas as páginas e concluir leitura"
                        >
                          <span>✓</span> Concluir Livro
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Páginas/Dia</p>
                        <p className="text-xl font-black text-slate-700 dark:text-slate-300">{pagesPerDay}</p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Tempo Lendo</p>
                        <p className="text-xl font-black text-slate-700 dark:text-slate-300">{daysReading} {daysReading === 1 ? 'dia' : 'dias'}</p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Previsão Término</p>
                        <p className="text-xl font-black text-slate-700 dark:text-slate-300">
                            {estimatedFinishDate ? estimatedFinishDate : (estDaysToFinish ? `${estDaysToFinish}d` : '--')}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                            {estDaysToFinish ? `Faltam ${estDaysToFinish} ${estDaysToFinish === 1 ? 'dia' : 'dias'} • Lendo há ${daysReading}d` : `Lendo há ${daysReading} ${daysReading === 1 ? 'dia' : 'dias'}`}
                        </p>
                    </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <div className="flex flex-1 gap-2">
                    <input 
                        type="number"
                        value={currentPage}
                        disabled={isSaving}
                        onFocus={(e) => e.target.select()}
                        onChange={handleProgressChange}
                        className="w-20 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-slate-100 font-black focus:border-primary outline-none text-center shadow-inner"
                        aria-label="Página atual"
                    />
                    <button
                        onClick={handleUpdateClick}
                        disabled={isSaving}
                        className="flex-1 px-6 py-3.5 text-[10px] font-black rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary dark:hover:text-white shadow-xl transition-all active:scale-95 uppercase tracking-[0.2em] disabled:opacity-50"
                    >
                        {isSaving ? '...' : 'Atualizar'}
                    </button>
                </div>
                <button
                    onClick={() => setIsFinishing(true)}
                    disabled={isSaving}
                    className="px-10 py-3.5 text-[10px] font-black rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 uppercase tracking-[0.2em] flex-1 sm:flex-none"
                >
                    Finalizar
                </button>
                <button
                    onClick={handleAbandonClick}
                    disabled={isSaving}
                    className="px-6 py-3.5 text-[10px] font-black rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95 uppercase tracking-[0.2em] border border-red-100 dark:border-red-900/30 flex-1 sm:flex-none"
                >
                    Abandonar
                </button>
              </div>

              {onOpenJournal && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pensamentos e anotações?</p>
                  <button
                    onClick={() => onOpenJournal(book.id)}
                    className="flex items-center gap-2 text-primary hover:text-tertiary transition-colors text-[10px] font-black uppercase tracking-[0.15em] cursor-pointer group/btn"
                  >
                    <span>📝</span> Anotar no Diário
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-8 duration-500">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 mb-1 sm:mb-2 leading-tight font-serif italic">Parabéns!</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 font-medium italic">Sua avaliação para "{book.title}":</p>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota (0 a 5.0):</span>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                             <input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                max="5" 
                                value={selectedRating} 
                                disabled={isSaving}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setSelectedRating(isNaN(val) ? 0 : Math.min(5, Math.max(0, val)));
                                }}
                                className="w-16 sm:w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 text-center font-black text-amber-500 text-sm sm:text-base font-mono"
                                aria-label="Nota numérica de 0 a 5.0"
                            />
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 font-mono">/ 5.0</span>
                            <StarIconFilled className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                        </div>
                    </div>
                    
                    <input 
                        type="range" 
                        min="0" 
                        max="5" 
                        step="0.1" 
                        value={selectedRating} 
                        disabled={isSaving}
                        onChange={(e) => setSelectedRating(parseFloat(e.target.value))}
                        className="w-full h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-5 sm:mb-6"
                        aria-label="Controle deslizante de nota"
                    />
                    
                    <div className="flex flex-col items-center justify-center pt-1 pb-2">
                      <RatingStars 
                        rating={selectedRating} 
                        onChange={(val) => setSelectedRating(val)} 
                        size="lg" 
                        precision={0.1}
                        showLabel={true} 
                        className="justify-center"
                      />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                        onClick={handleConfirmFinish}
                        disabled={selectedRating === 0 || isSaving}
                        className="flex-1 px-6 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-[11px] font-black rounded-xl sm:rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3"
                    >
                        {isSaving ? 'Finalizando...' : 'Confirmar'}
                    </button>
                    <button
                        onClick={() => setIsFinishing(false)}
                        disabled={isSaving}
                        className="px-6 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-[11px] font-black rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-all uppercase tracking-widest"
                    >
                        Voltar
                    </button>
                </div>
            </div>
          )}
      </div>

      {/* Floating Micro-Toast Notification (Dopaminergic incremental feedback) */}
      <AnimatePresence>
        {microToast && (
          <motion.div
            key={microToast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            data-testid="reading-micro-toast"
            className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-40 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border border-slate-700/50 dark:border-slate-200/50 flex items-center gap-3 pointer-events-none max-w-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 dark:text-amber-600 flex items-center justify-center font-black text-sm flex-shrink-0">
              ⚡
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black tracking-tight leading-tight">
                {microToast.message}
              </p>
              {microToast.sub && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate">
                  {microToast.sub}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebratory Milestone Modal (Completing book / 100% reading goal) */}
      <CelebrationModal
        isOpen={showCelebrationModal}
        book={book}
        initialRating={selectedRating}
        onClose={() => setShowCelebrationModal(false)}
        onSaveRatingAndFinish={handleSaveCelebrationRating}
        onShare={() => {
          setShowCelebrationModal(false);
          setShowShareModal(true);
        }}
      />

      <ShareProgressModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        book={book}
        profile={profile}
        daysReading={daysReading}
        pagesPerDay={pagesPerDay}
        progressPercentage={progressPercentage}
      />
    </div>
  );
};
