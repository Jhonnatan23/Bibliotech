
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
    <div className="space-y-8 mt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black font-serif text-slate-900 dark:text-slate-50 italic tracking-tighter">
            Recém Concluídos
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] mt-2 ml-1">✦ Os últimos sucessos da sua jornada</p>
        </div>
      </div>
 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {books.map((book, idx) => (
          <div 
            key={book.id} 
            className="group bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-in fade-in slide-in-from-bottom-6"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="mb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 leading-tight line-clamp-2 font-serif italic group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                de {book.author}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest leading-none mb-1">Data</span>
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">
                    {formatDate(book.dateFinished)}
                  </p>
                </div>
                {book.rating && (
                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                        <span className="text-[10px] font-black text-amber-500">{book.rating}</span>
                        <StarIconFilled className="h-3 w-3 text-amber-500" />
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
