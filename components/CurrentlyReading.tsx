
import React, { useState, useEffect, useMemo } from 'react';
import type { Book } from '../types';
import { BookStatus } from '../types';
import { StarIcon, StarIconFilled } from './Icons';

interface CurrentlyReadingProps {
  book: Book;
  updateBook: (book: Book) => Promise<void>;
}

const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-0.5">
      {[...Array(10)].map((_, index) => {
        const starIndex = index + 1;
        const diff = rating - index;
        const isFull = diff >= 1;
        const isPartial = diff > 0 && diff < 1;
        const fillPercentage = isPartial ? diff * 100 : (isFull ? 100 : 0);

        return (
          <div key={index} className="relative h-5 w-5 sm:h-6 sm:w-6">
            <StarIcon className="absolute inset-0 h-5 w-5 sm:h-6 sm:w-6 text-slate-200 dark:text-slate-700" />
            <div 
              className="absolute inset-0 overflow-hidden" 
              style={{ width: `${fillPercentage}%` }}
            >
              <StarIconFilled className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

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

export const CurrentlyReading: React.FC<CurrentlyReadingProps> = ({ book, updateBook }) => {
    const [currentPage, setCurrentPage] = useState(book.currentPage || 0);
    const [dateStarted, setDateStarted] = useState(book.dateStarted || new Date().toISOString().split('T')[0]);
    const [isFinishing, setIsFinishing] = useState(false);
    const [selectedRating, setSelectedRating] = useState<number>(book.rating || 0);
    const [isSaving, setIsSaving] = useState(false);
    
    const daysReading = useMemo(() => calculateDaysReading(dateStarted), [dateStarted]);
    const progressPercentage = book.pages > 0 ? (currentPage / book.pages) * 100 : 0;
    const pagesRemaining = book.pages - currentPage;
    
    const pagesPerDay = useMemo(() => {
        const days = daysReading || 1;
        return Math.round((currentPage / days) * 10) / 10;
    }, [currentPage, daysReading]);

    const estDaysToFinish = useMemo(() => {
        if (pagesPerDay <= 0) return null;
        return Math.ceil(pagesRemaining / pagesPerDay);
    }, [pagesRemaining, pagesPerDay]);

    useEffect(() => {
        setCurrentPage(book.currentPage || 0);
        setDateStarted(book.dateStarted || new Date().toISOString().split('T')[0]);
        setIsFinishing(false);
        setSelectedRating(0);
        setIsSaving(false);
    }, [book.id]);

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
        } finally {
            setIsSaving(false);
        }
    };

    const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];
    const authorsList = book.author ? book.author.split(',').map(a => a.trim()).filter(a => a !== '') : [];

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 h-full flex flex-col relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-wrap justify-between items-center mb-6 relative z-10 gap-2">
        <div className="flex flex-wrap gap-2">
            <span className="bg-primary text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg">
              Lendo agora
            </span>
            {daysReading > 0 && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-slate-200">
                 Jornada de {daysReading} {daysReading === 1 ? 'dia' : 'dias'}
              </span>
            )}
        </div>
      </div>
      
      <div className="flex-1 w-full text-center lg:text-left relative z-10">
          {!isFinishing ? (
            <>
              <div className="mb-4 sm:mb-6">
                <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 mb-1 sm:mb-2 leading-tight font-serif italic truncate">{book.title}</h3>
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-1.5 sm:gap-2">
                  {authorsList.map((author, idx) => (
                    <React.Fragment key={author}>
                      <p className="text-base sm:text-xl text-slate-400 dark:text-slate-50 font-medium truncate max-w-[200px]">{author}</p>
                      {idx < authorsList.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-700 text-base">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                  {genresList.map(g => (
                    <span key={g} className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-slate-100 text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        {g}
                    </span>
                  ))}
                  <span className="bg-blue-50 dark:bg-blue-900/20 text-primary px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-blue-100 text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {book.pages} páginas
                  </span>
              </div>

              <div className="mb-6 sm:mb-10">
                <div className="flex justify-between items-end mb-2 sm:mb-3">
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">{progressPercentage.toFixed(0)}%</span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completo</span>
                    </div>
                </div>
                
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl h-3 sm:h-4 mb-3 sm:mb-4 overflow-hidden p-0.5 sm:p-1 border border-slate-200/50">
                  <div 
                      className="bg-gradient-to-r from-primary to-blue-400 h-full rounded-xl transition-all duration-1000 ease-out" 
                      style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100">
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Ritmo Médio</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">{pagesPerDay} <span className="text-[9px] sm:text-[10px] text-slate-400">p/d</span></p>
                    </div>
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100">
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Previsão</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">{estDaysToFinish ? `+${estDaysToFinish}d` : '--'}</p>
                    </div>
                    <div className="hidden sm:block bg-slate-50/80 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Página</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{currentPage} <span className="text-[10px] text-slate-400">de {book.pages}</span></p>
                    </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex flex-1 gap-2">
                    <input 
                        type="number"
                        value={currentPage}
                        disabled={isSaving}
                        onChange={handleProgressChange}
                        className="w-16 sm:w-24 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2.5 sm:py-3 text-slate-900 dark:text-slate-100 font-black focus:border-primary outline-none text-center text-sm sm:text-base"
                        aria-label="Página atual"
                    />
                    <button
                        onClick={handleUpdateClick}
                        disabled={isSaving}
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-black rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary dark:hover:text-white shadow-xl transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
                    >
                        {isSaving ? '...' : 'Salvar Progresso'}
                    </button>
                </div>
                <button
                    onClick={() => setIsFinishing(true)}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-black rounded-xl sm:rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                >
                    Finalizar
                </button>
              </div>
            </>
          ) : (
            <div className="animate-in slide-in-from-right-8 duration-500">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 mb-1 sm:mb-2 leading-tight font-serif italic">Parabéns!</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 font-medium italic">Sua avaliação para "{book.title}":</p>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota:</span>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                             <input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                max="10" 
                                value={selectedRating} 
                                disabled={isSaving}
                                onChange={(e) => setSelectedRating(parseFloat(e.target.value) || 0)}
                                className="w-12 sm:w-16 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 text-center font-black text-amber-500 text-sm sm:text-base"
                            />
                            <StarIconFilled className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                        </div>
                    </div>
                    
                    <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        step="0.1" 
                        value={selectedRating} 
                        disabled={isSaving}
                        onChange={(e) => setSelectedRating(parseFloat(e.target.value))}
                        className="w-full h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-4 sm:mb-6"
                    />
                    
                    <StarRatingDisplay rating={selectedRating} />
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
    </div>
  );
};
