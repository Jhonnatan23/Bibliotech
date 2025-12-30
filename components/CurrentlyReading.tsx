
import React, { useState, useEffect, useMemo } from 'react';
import type { Book } from '../types';
import { BookStatus } from '../types';

interface CurrentlyReadingProps {
  book: Book;
  updateBook: (book: Book) => void;
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

export const CurrentlyReading: React.FC<CurrentlyReadingProps> = ({ book, updateBook }) => {
    const [currentPage, setCurrentPage] = useState(book.currentPage || 0);
    const [dateStarted, setDateStarted] = useState(book.dateStarted || new Date().toISOString().split('T')[0]);
    
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
    }, [book.id, book.currentPage, book.dateStarted]);

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0 && value <= book.pages) {
            setCurrentPage(value);
        } else if (e.target.value === '') {
            setCurrentPage(0);
        }
    };

    const handleUpdateClick = () => {
        updateBook({ ...book, currentPage, dateStarted });
    };

    const handleFinishReading = () => {
        updateBook({ 
            ...book, 
            currentPage: book.pages, 
            status: BookStatus.Read,
            dateFinished: new Date().toISOString().split('T')[0]
        });
    };

    const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-slate-100 h-full flex flex-col relative overflow-hidden group animate-in zoom-in-95 duration-500">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex gap-2">
            <span className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">
              Lendo agora
            </span>
            {daysReading > 0 && (
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-slate-200">
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
          <div className="mb-6">
            <h3 className="text-3xl font-black text-slate-900 mb-2 leading-tight font-serif italic">{book.title}</h3>
            <p className="text-xl text-slate-400 font-medium">{book.author}</p>
          </div>
          
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
              {genresList.map(g => (
                <span key={g} className="bg-slate-50 text-slate-500 px-4 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest">
                    {g}
                </span>
              ))}
              <span className="bg-blue-50 text-primary px-4 py-1.5 rounded-xl border border-blue-100 text-[10px] font-black uppercase tracking-widest">
                {book.pages} páginas totais
              </span>
          </div>

          <div className="mb-10">
            <div className="flex justify-between items-end mb-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{progressPercentage.toFixed(0)}%</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completo</span>
                </div>
            </div>
            
            <div className="w-full bg-slate-100 rounded-2xl h-4 mb-4 overflow-hidden p-1 border border-slate-200/50">
              <div 
                  className="bg-gradient-to-r from-primary to-blue-400 h-full rounded-xl transition-all duration-1000 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ritmo Médio</p>
                    <p className="text-sm font-bold text-slate-700">{pagesPerDay} <span className="text-[10px] text-slate-400">pág/dia</span></p>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Previsão</p>
                    <p className="text-sm font-bold text-slate-700">{estDaysToFinish ? `+${estDaysToFinish} dias` : '--'}</p>
                </div>
                <div className="hidden sm:block bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Página Atual</p>
                    <p className="text-sm font-bold text-slate-700">{currentPage} <span className="text-[10px] text-slate-400">de {book.pages}</span></p>
                </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-1 gap-2">
                <input 
                    type="number"
                    value={currentPage}
                    onChange={handleProgressChange}
                    className="w-24 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black focus:border-primary transition-all outline-none text-center"
                    aria-label="Página atual"
                />
                <button
                    onClick={handleUpdateClick}
                    className="flex-1 px-4 py-3 text-[10px] font-black rounded-2xl bg-slate-900 text-white hover:bg-primary shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                >
                    Salvar Progresso
                </button>
            </div>
            <button
                onClick={handleFinishReading}
                className="px-8 py-3 text-[10px] font-black rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-200 transition-all active:scale-95 uppercase tracking-widest"
            >
                Concluir Leitura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
