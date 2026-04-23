
import React, { useMemo } from 'react';
import type { Book, ReadingStats } from '../types';
import { BookStatus } from '../types';
import { BookOpenIcon, ClockIcon, CalendarIcon, CheckCircleIcon, PlayIcon, StopIcon } from './Icons';

interface ShelfProgressProps {
  books: Book[];
  stats: ReadingStats;
}

export const ShelfProgress: React.FC<ShelfProgressProps> = ({ books, stats }) => {
  const shelfBooks = useMemo(() => books.filter(b => b.status !== BookStatus.Wishlist), [books]);
  const totalBooks = shelfBooks.length;

  const counts = useMemo(() => {
    const lidos = shelfBooks.filter(b => b.status === BookStatus.Read).length;
    const abandonados = shelfBooks.filter(b => b.status === BookStatus.Dropped).length;
    const naoLidos = shelfBooks.filter(b => b.status === BookStatus.TBR || b.status === BookStatus.Reading).length;
    
    return {
      lidos,
      abandonados,
      naoLidos,
      lidosPct: totalBooks > 0 ? (lidos / totalBooks) * 100 : 0,
      abandonadosPct: totalBooks > 0 ? (abandonados / totalBooks) * 100 : 0,
      naoLidosPct: totalBooks > 0 ? (naoLidos / totalBooks) * 100 : 0,
    };
  }, [shelfBooks, totalBooks]);

  const prediction = useMemo(() => {
    const remainingPages = shelfBooks.reduce((acc, book) => {
      if (book.status === BookStatus.TBR || book.status === BookStatus.Reading) {
        const total = book.pages || 0;
        const current = book.currentPage || 0;
        return acc + Math.max(0, total - current);
      }
      return acc;
    }, 0);

    const pace = stats.avgPagesPerDay > 0 ? stats.avgPagesPerDay : 20; // fallback para 20 pag/dia
    const daysRemaining = Math.ceil(remainingPages / pace);
    
    if (remainingPages === 0) return null;

    const finishDate = new Date();
    finishDate.setDate(finishDate.getDate() + daysRemaining);
    
    return {
      daysRemaining,
      finishDate,
      remainingPages
    };
  }, [shelfBooks, stats.avgPagesPerDay]);

  if (totalBooks === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-soft border border-slate-100 dark:border-slate-800 mb-8 overflow-hidden relative group">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Progresso da Estante</h3>
              <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic font-serif">Status do Acervo</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Multi-segment Progress Bar */}
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden shadow-inner">
              <div 
                style={{ width: `${counts.lidosPct}%` }} 
                className="h-full bg-green-500 transition-all duration-1000 relative group/bar"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20">Lidos: {counts.lidosPct.toFixed(0)}%</div>
              </div>
              <div 
                style={{ width: `${counts.naoLidosPct}%` }} 
                className="h-full bg-amber-500 transition-all duration-1000 delay-100 relative group/bar"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20">Não Lidos: {counts.naoLidosPct.toFixed(0)}%</div>
              </div>
              <div 
                style={{ width: `${counts.abandonadosPct}%` }} 
                className="h-full bg-slate-400 transition-all duration-1000 delay-200 relative group/bar"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20">Abandonados: {counts.abandonadosPct.toFixed(0)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <CheckCircleIcon className="h-3 w-3 text-green-500" /> Lidos
                </span>
                <span className="text-sm md:text-lg font-black text-slate-700 dark:text-slate-200">{counts.lidos} <small className="text-[10px] opacity-50 font-medium">({counts.lidosPct.toFixed(1)}%)</small></span>
              </div>
              <div className="flex flex-col border-x border-slate-100 dark:border-slate-800 px-2 md:px-4 text-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 justify-center">
                  <PlayIcon className="h-3 w-3 text-amber-500" /> Não Lidos
                </span>
                <span className="text-sm md:text-lg font-black text-slate-700 dark:text-slate-200">{counts.naoLidos} <small className="text-[10px] opacity-50 font-medium">({counts.naoLidosPct.toFixed(1)}%)</small></span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 justify-end">
                  <StopIcon className="h-3 w-3 text-slate-400" /> Abandonados
                </span>
                <span className="text-sm md:text-lg font-black text-slate-700 dark:text-slate-200">{counts.abandonados} <small className="text-[10px] opacity-50 font-medium">({counts.abandonadosPct.toFixed(1)}%)</small></span>
              </div>
            </div>
          </div>
        </div>

        {prediction && (
          <div className="md:w-64 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col justify-center transition-transform hover:scale-[1.02] duration-300">
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="h-4 w-4 text-primary" />
              <h4 className="text-[9px] font-black uppercase tracking-widest text-primary">Previsão de Conclusão</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">Ritmo Atual</p>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">{stats.avgPagesPerDay.toFixed(1)} <span className="text-xs font-medium opacity-50">páginas/dia</span></p>
              </div>
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarIcon className="h-4 w-4 text-secondary" />
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {prediction.finishDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Faltam aprox. {prediction.daysRemaining} dias para ler as {prediction.remainingPages.toLocaleString('pt-BR')} páginas restantes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
