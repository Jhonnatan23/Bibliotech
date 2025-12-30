
import React from 'react';
import type { Book } from '../types';
import { BookStatus } from '../types';

interface WishlistItemProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onMoveToShelf: (book: Book) => void;
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

export const WishlistItem: React.FC<WishlistItemProps> = ({ book, onEdit, onDelete, onMoveToShelf }) => {
  const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];

  return (
    <article className="bg-white p-6 md:p-7 rounded-[2rem] shadow-soft border border-slate-100 flex flex-col md:flex-row items-center md:items-stretch gap-8 transition-all duration-500 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-primary/20 group">
      
      <div className="relative flex-shrink-0 perspective-1000">
        <div className="relative group/cover">
          <img
            src={book.coverImageUrl || `https://picsum.photos/seed/${encodeURIComponent(book.title)}/400/600`}
            alt={book.title}
            className="w-32 h-48 md:w-36 md:h-52 object-cover rounded-2xl shadow-lg transition-all duration-700 group-hover/cover:scale-[1.05] group-hover/cover:rotate-2"
          />
          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/20 to-transparent rounded-l-2xl"></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col text-center md:text-left">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight font-serif italic mb-1 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <p className="text-lg text-slate-400 font-semibold">{book.author}</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-2">
                {book.estimatedPrice && (
                    <div className="bg-primary/5 border border-primary/10 px-5 py-2 rounded-2xl flex flex-col items-center md:items-end shadow-sm">
                        <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest mb-0.5">Valor Estimado</span>
                        <span className="text-xl font-black text-primary tracking-tight">
                            R$ {book.estimatedPrice.toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                )}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    Desejado em {formatDate(book.dateAdded)}
                </span>
            </div>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-6">
            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border bg-pink-50/50 text-pink-600 border-pink-100/50">
                Wishlist
            </span>
            {genresList.map(g => (
                <span key={g} className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-100">
                    {g}
                </span>
            ))}
            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border bg-slate-50 text-slate-500 border-slate-100">
                {book.pages} páginas
            </span>
        </div>
        
        {book.summary && (
            <div className="relative mt-auto">
              <p className="text-sm text-slate-400 italic leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                  "{book.summary}"
              </p>
            </div>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full md:w-56 justify-center">
        <button onClick={() => onMoveToShelf(book)} className="w-full px-6 py-3.5 text-xs font-black rounded-2xl bg-primary text-white hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest">
          Mover para Estante
        </button>
        
        <div className="flex gap-3">
            <button onClick={() => onEdit(book)} className="flex-1 px-4 py-3 text-[10px] font-black rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white border border-slate-200 transition-all active:scale-95 uppercase tracking-widest">
                Editar
            </button>
            <button onClick={() => onDelete(book)} className="flex-1 px-4 py-3 text-[10px] font-black rounded-2xl bg-white text-red-400 hover:bg-red-50 border border-red-100 transition-all active:scale-95 uppercase tracking-widest">
                Remover
            </button>
        </div>
      </div>
    </article>
  );
};
