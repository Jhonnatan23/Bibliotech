
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
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-1 italic">Os marcos mais recentes da sua jornada.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {books.map((book, idx) => (
          <div 
            key={book.id} 
            className="group relative flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-2xl shadow-soft transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:rotate-1">
              <img 
                src={book.coverImageUrl || `https://picsum.photos/seed/${encodeURIComponent(book.title)}/400/600`} 
                alt={book.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                <span className="text-[8px] font-black text-white uppercase tracking-widest bg-emerald-500/80 backdrop-blur-sm px-2 py-1 rounded">
                  Lido em {formatDate(book.dateFinished)}
                </span>
              </div>
            </div>
            
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-50 leading-tight line-clamp-1 mb-1 font-serif italic">
              {book.title}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate">
              {book.author}
            </p>
            <p className="text-[9px] text-emerald-500 dark:text-emerald-400 font-black uppercase tracking-tighter mt-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              {formatDate(book.dateFinished)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
