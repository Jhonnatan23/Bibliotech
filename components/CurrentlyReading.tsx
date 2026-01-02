
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
    <div className="flex items-center gap-0.5">
      {[...Array(10)].map((_, index) => {
        const starIndex = index + 1;
        const diff = rating - index;
        const isFull = diff >= 1;
        const isPartial = diff > 0 && diff < 1;
        const fillPercentage = isPartial ? diff * 100 : (isFull ? 100 : 0);

        return (
          <div key={index} className="relative h-6 w-6">
            <StarIcon className="absolute inset-0 h-6 w-6 text-slate-200 dark:text-slate-700" />
            <div 
              className="absolute inset-0 overflow-hidden" 
              style={{ width: `${fillPercentage}%` }}
            >
              <StarIconFilled className="h-6 w-6 text-amber-400" />
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
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 h-full flex flex-col relative overflow-hidden group animate-in zoom-in-95 duration-500">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex gap-2">
            <span className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">
              Lendo agora
            </span>
            {daysReading > 0 && (
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                 Jornada de {daysReading} {daysReading === 1 ? 'dia' : 'dias'}
              </span>
            )}
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start relative z-10">
        <div className="relative group/cover flex-shrink-0">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="w-48 h-72 object-cover rounded-2xl shadow-xl transition-all duration-700 group-hover/cover:scale-[1.02] relative z-10"
            />
        </div>
        
        <div className="flex-1 w-full text-center lg:text-left">
          {!isFinishing ? (
            <>
              <div className="mb-6">
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-2 leading-tight font-serif italic">{book.title}</h3>
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2">
                  {authorsList.map((author, idx) => (
                    <React.Fragment key={author}>
                      <p className="text-xl text-slate-400 dark:text-slate-500 font-medium">{author}</p>
                      {idx < authorsList.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-700 text-lg">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
                  {genresList.map(g => (
                    <span key={g} className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest">
                        {g}
                    </span>
                  ))}
                  <span className="bg-blue-50 dark:bg-blue-900/20 text-primary px-4 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50 text-[10px] font-black uppercase tracking-widest">
                    {book.pages} páginas totais
                  </span>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-end mb-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">{progressPercentage.toFixed(0)}%</span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completo</span>
                    </div>
                </div>
                
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl h-4 mb-4 overflow-hidden p-1 border border-slate-200/50 dark:border-slate-700">
                  <div 
                      className="bg-gradient-to-r from-primary to-blue-400 h-full rounded-xl transition-all duration-1000 ease-out" 
                      style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Ritmo Médio</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{pagesPerDay} <span className="text-[10px] text-slate-400 dark:text-slate-500">pág/dia</span></p>
                    </div>
                    <div className="bg-slate-50/80 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Previsão</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{estDaysToFinish ? `+${estDaysToFinish} dias` : '--'}</p>
                    </div>
                    <div className="hidden sm:block bg-slate-50/80 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Página Atual</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{currentPage} <span className="text-[10px] text-slate-400 dark:text-slate-500">de {book.pages}</span></p>
                    </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-1 gap-2">
                    <input 
                        type="number"
                        value={currentPage}
                        disabled={isSaving}
                        onChange={handleProgressChange}
                        className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-slate-100 font-black focus:border-primary transition-all outline-none text-center disabled:opacity-50"
                        aria-label="Página atual"
                    />
                    <button
                        onClick={handleUpdateClick}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3 text-[10px] font-black rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary dark:hover:text-white shadow-xl transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : 'Salvar Progresso'}
                    </button>
                </div>
                <button
                    onClick={() => setIsFinishing(true)}
                    disabled={isSaving}
                    className="px-8 py-3 text-[10px] font-black rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
                >
                    Concluir Leitura
                </button>
              </div>
            </>
          ) : (
            <div className="animate-in slide-in-from-right-8 duration-500">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-2 leading-tight font-serif italic">Parabéns pela conclusão!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium italic">Como você avalia sua experiência com "{book.title}"?</p>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Nota:</span>
                        <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                max="10" 
                                value={selectedRating} 
                                disabled={isSaving}
                                onChange={(e) => setSelectedRating(parseFloat(e.target.value) || 0)}
                                className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-black text-amber-500 disabled:opacity-50"
                            />
                            <StarIconFilled className="h-5 w-5 text-amber-500" />
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
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-6 disabled:opacity-50"
                    />
                    
                    <div className="flex justify-center">
                        <StarRatingDisplay rating={selectedRating} />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleConfirmFinish}
                        disabled={selectedRating === 0 || isSaving}
                        className="flex-1 px-8 py-4 text-[11px] font-black rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                    >
                        {isSaving && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        )}
                        {isSaving ? 'Finalizando...' : 'Confirmar e Finalizar'}
                    </button>
                    <button
                        onClick={() => setIsFinishing(false)}
                        disabled={isSaving}
                        className="px-8 py-4 text-[11px] font-black rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                        Voltar
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
