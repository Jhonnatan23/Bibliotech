
import React from 'react';
import type { Book, StatusConfigs } from '../types';
// Fixed: Added STATUS_CONFIGS to imports
import { BookStatus, STATUS_COLORS, STATUS_CONFIGS } from '../types';
import { StarIcon } from './Icons';

interface BookListItemProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  // Fixed: Made statusConfigs optional
  statusConfigs?: StatusConfigs;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(10)].map((_, index) => (
        <StarIcon
          key={index}
          className={`h-3.5 w-3.5 ${index < rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`}
        />
      ))}
    </div>
  );
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Fixed: Provided default value for statusConfigs using STATUS_CONFIGS
export const BookListItem: React.FC<BookListItemProps> = ({ book, onEdit, onDelete, statusConfigs = STATUS_CONFIGS }) => {
  const config = statusConfigs[book.status];
  const colorStyles = STATUS_COLORS[config.color as keyof typeof STATUS_COLORS];
  
  // Divide a string de gêneros em um array
  const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];

  return (
    <article className="bg-white p-6 md:p-7 rounded-[2.5rem] shadow-soft border border-slate-100 flex flex-col md:flex-row items-center gap-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/10 group">
      
      <div className="relative flex-shrink-0 perspective-1000">
        <div className="relative group/cover transition-transform duration-700 ease-out group-hover:rotate-y-12">
          <img
            src={book.coverImageUrl || `https://picsum.photos/seed/${encodeURIComponent(book.title)}/400/600`}
            alt={book.title}
            className="w-28 h-40 md:w-32 md:h-48 object-cover rounded-2xl shadow-lg"
          />
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/20 to-transparent rounded-l-2xl"></div>
        </div>
      </div>
      
      <div className="flex-1 text-center md:text-left min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-2">
            <div className="min-w-0">
                <h3 className="text-2xl font-black text-slate-900 leading-tight font-serif italic group-hover:text-primary transition-colors">
                  {book.title}
                </h3>
                <p className="text-lg text-slate-400 font-semibold">{book.author}</p>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
               Registrado em {formatDate(book.dateAdded)}
            </span>
        </div>
        
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-6 mt-4">
            <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${colorStyles.bg} ${colorStyles.text} ${colorStyles.border}`}>
                {config.label}
            </span>
            <span className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border bg-slate-50 text-slate-500 border-slate-100">
                {book.type}
            </span>
            {/* Renderização dinâmica de múltiplos gêneros */}
            {genresList.map(g => (
              <span key={g} className="px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-wider border bg-blue-50/30 text-blue-500/80 border-blue-100/50">
                  {g}
              </span>
            ))}
        </div>

        {book.rating && book.status === BookStatus.Read && (
            <div className="flex justify-center md:justify-start items-center gap-4 mb-4 bg-slate-50/50 p-2 rounded-2xl w-fit">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Avaliação</span>
                <StarRating rating={book.rating} />
            </div>
        )}
      </div>

      <div className="flex flex-row md:flex-col gap-3 w-full md:w-44 mt-4 md:mt-0">
        <button onClick={() => onEdit(book)} className="flex-1 px-6 py-3 text-[11px] font-black rounded-2xl bg-slate-900 text-white hover:bg-primary shadow-lg transition-all active:scale-95 uppercase tracking-widest">
          Editar
        </button>
        <button onClick={() => onDelete(book)} className="flex-1 px-6 py-3 text-[11px] font-black rounded-2xl bg-white text-red-400 hover:bg-red-50 border border-red-100 transition-all active:scale-95 uppercase tracking-widest">
          Excluir
        </button>
      </div>
    </article>
  );
};
