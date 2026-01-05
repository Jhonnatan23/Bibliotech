
import React from 'react';
import type { Book } from '../types';

interface LatestReadingsProps {
  books: Book[];
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const LatestReadings: React.FC<LatestReadingsProps> = ({ books }) => {
  if (books.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Últimas Conclusões
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest font-black">Histórico</span>
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-1 italic">Marcos mais recentes da sua jornada.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {books.map((book, idx) => (
          <div 
            key={book.id} 
            className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 leading-tight line-clamp-1 mb-1 font-serif italic">
              {book.title}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate mb-3">
              {book.author}
            </p>
            <div className="flex items-center justify-between">
                <p className="text-[9px] text-emerald-500 font-black uppercase tracking-tighter flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                  {formatDate(book.dateFinished)}
                </p>
                {book.rating && (
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-amber-500">{book.rating}</span>
                        <StarIconFilled className="h-2.5 w-2.5 text-amber-500" />
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
import { StarIconFilled } from './Icons';
