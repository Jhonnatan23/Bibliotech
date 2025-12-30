
import React from 'react';
import type { Book, StatusConfigs } from '../types';
import { BookStatus, STATUS_COLORS, STATUS_CONFIGS } from '../types';
import { StarIcon } from './Icons';

interface BookListItemProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
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

// Função auxiliar para gerar cores baseadas no nome do gênero
const getGenreColor = (genre: string) => {
    const palettes = [
        { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
        { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
        { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
        { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
        { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
        { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' },
        { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
        { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-100' },
    ];
    
    let hash = 0;
    for (let i = 0; i < genre.length; i++) {
        hash = genre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palettes[Math.abs(hash) % palettes.length];
};

export const BookListItem: React.FC<BookListItemProps> = ({ book, onEdit, onDelete, statusConfigs = STATUS_CONFIGS }) => {
  const config = statusConfigs[book.status];
  const colorStyles = STATUS_COLORS[config.color as keyof typeof STATUS_COLORS];
  
  const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];
  const hasTooManyGenres = genresList.length > 5;
  const visibleGenres = hasTooManyGenres ? genresList.slice(0, 4) : genresList;
  const hiddenGenresCount = genresList.length - visibleGenres.length;

  const renderGenreTag = (g: string) => {
    const palette = getGenreColor(g);
    return (
      <span 
        key={g} 
        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider border shadow-sm transition-transform hover:scale-105 cursor-default whitespace-nowrap ${palette.bg} ${palette.text} ${palette.border}`}
      >
          {g}
      </span>
    );
  };

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
            
            {/* Renderização das tags de gênero com Tooltip para excesso */}
            {visibleGenres.map(renderGenreTag)}
            
            {hasTooManyGenres && (
              <div className="relative group/more-genres">
                <span className="px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider border bg-slate-100 text-slate-500 border-slate-200 cursor-help shadow-sm hover:bg-slate-200 transition-colors">
                  +{hiddenGenresCount}
                </span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/more-genres:opacity-100 transition-opacity pointer-events-none z-50">
                   <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl min-w-[180px] max-w-[240px]">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-slate-400 border-b border-white/10 pb-2">
                        Gêneros Adicionais
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {genresList.map(g => (
                          <span key={g} className="text-[10px] font-bold text-white/90">
                            • {g}
                          </span>
                        ))}
                      </div>
                   </div>
                   {/* Seta do Tooltip */}
                   <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            )}
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
