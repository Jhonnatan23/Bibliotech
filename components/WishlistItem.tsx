
import React from 'react';
import type { Book } from '../types';
import { BookStatus } from '../types';
import { ExternalLinkIcon, Square2StackIcon } from './Icons';

interface WishlistItemProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onDuplicate: (book: Book) => void;
  onMoveToShelf: (book: Book) => void;
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

export const WishlistItem: React.FC<WishlistItemProps> = ({ book, onEdit, onDelete, onDuplicate, onMoveToShelf }) => {
  const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];
  const authorsList = book.author ? book.author.split(',').map(a => a.trim()).filter(a => a !== '') : [];

  return (
    <article className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-soft border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8 transition-all duration-500 hover:shadow-2xl group">
      <div className="flex-1 flex flex-col text-center md:text-left w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4 mb-3">
            <div className="min-w-0">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight font-serif italic mb-0.5 md:mb-1 group-hover:text-primary transition-colors truncate">
                {book.title}
              </h3>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-1.5">
                {authorsList.map((author, idx) => (
                  <React.Fragment key={author}>
                    <p className="text-base md:text-lg text-slate-400 dark:text-slate-50 font-semibold truncate max-w-[150px] sm:max-w-none">{author}</p>
                    {idx < authorsList.length - 1 && (
                      <span className="text-slate-300 dark:text-slate-700 text-sm">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-1.5 md:gap-2">
                {book.estimatedPrice && (
                    <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 px-4 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl flex flex-row sm:flex-col items-center md:items-end shadow-sm gap-2 sm:gap-0.5">
                        <span className="text-[8px] md:text-[9px] font-black text-primary/60 uppercase tracking-widest">Est.</span>
                        <span className="text-lg md:text-xl font-black text-primary tracking-tight">
                            R$ {book.estimatedPrice.toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                )}
                <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    {formatDate(book.dateAdded)}
                </span>
            </div>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-1.5 md:gap-2 mb-4 md:mb-6">
            <span className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border bg-pink-50/50 dark:bg-pink-900/20 text-pink-600 border-pink-100/50">
                Wishlist
            </span>
            <div className="hidden sm:flex flex-wrap gap-1.5">
                {genresList.slice(0, 2).map(g => (
                    <span key={g} className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-bold uppercase tracking-wider border bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100">
                        {g}
                    </span>
                ))}
            </div>
            <span className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100">
                {book.pages}p
            </span>
            
            {book.buyLink && (
              <a 
                href={book.buyLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-wider border bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Link <ExternalLinkIcon className="h-3 w-3" />
              </a>
            )}
        </div>
        
        {book.summary && (
            <p className="hidden sm:block text-xs md:text-sm text-slate-500 italic leading-relaxed line-clamp-2 mb-6">
                "{book.summary}"
            </p>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full md:w-52 lg:w-56 justify-center">
        <button onClick={() => onMoveToShelf(book)} className="w-full px-4 py-3 md:py-3.5 text-[10px] md:text-xs font-black rounded-xl md:rounded-2xl bg-primary text-white hover:bg-blue-700 shadow-lg transition-all active:scale-95 uppercase tracking-widest">
          Para Estante
        </button>
        
        <div className="flex gap-2 w-full">
            <button onClick={() => onEdit(book)} className="flex-1 px-3 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white border border-slate-200 transition-all active:scale-95 uppercase tracking-widest">
                Editar
            </button>
            <button 
              onClick={() => onDuplicate(book)} 
              className="px-3 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 text-slate-400 hover:text-primary border border-slate-200 transition-all flex items-center justify-center shadow-sm"
            >
              <Square2StackIcon className="h-4 w-4" />
            </button>
        </div>
        <button onClick={() => onDelete(book)} className="w-full px-3 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-white dark:bg-transparent text-red-400 hover:bg-red-50 border border-red-100 transition-all active:scale-95 uppercase tracking-widest">
            Remover
        </button>
      </div>
    </article>
  );
};
