
import React from 'react';
import type { Book, StatusConfigs } from '../types';
import { BookStatus, STATUS_COLORS, STATUS_CONFIGS } from '../types';
import { StarIcon } from './Icons';

interface BookListItemProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onUpdateStatus?: (book: Book, status: BookStatus) => void;
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

export const BookListItem: React.FC<BookListItemProps> = ({ 
  book, 
  onEdit, 
  onDelete, 
  onUpdateStatus,
  statusConfigs = STATUS_CONFIGS 
}) => {
  const config = statusConfigs[book.status];
  const colorStyles = STATUS_COLORS[config.color as keyof typeof STATUS_COLORS];
  
  const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];
  
  const THRESHOLD = 5;
  const isOverLimit = genresList.length > THRESHOLD;
  const hiddenCount = genresList.length - 1;

  const handleQuickRead = () => {
    if (onUpdateStatus) {
      onUpdateStatus({
        ...book,
        dateStarted: new Date().toISOString().split('T')[0],
        currentPage: 0
      }, BookStatus.Reading);
    }
  };

  const renderGenreTag = (g: string, isTrigger: boolean = false) => {
    const palette = getGenreColor(g);
    return (
      <span 
        key={g} 
        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm transition-all whitespace-nowrap ${
            isTrigger ? 'cursor-help ring-2 ring-transparent hover:ring-primary/20 bg-white' : 'cursor-default ' + palette.bg
        } ${palette.text} ${palette.border}`}
      >
          {g} {isTrigger && <span className="ml-1 opacity-60 font-bold">(+{hiddenCount})</span>}
      </span>
    );
  };

  return (
    <article className="bg-white p-6 md:p-7 rounded-[2.5rem] shadow-soft border border-slate-100 flex flex-col md:flex-row items-center gap-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/10 group animate-in fade-in slide-in-from-bottom-4">
      
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
            
            {!isOverLimit ? (
                genresList.map(g => renderGenreTag(g))
            ) : (
                <div className="relative group/genre-tooltip">
                    {renderGenreTag(genresList[0], true)}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/genre-tooltip:opacity-100 transition-all duration-300 pointer-events-none z-50 transform translate-y-2 group-hover/genre-tooltip:translate-y-0">
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl min-w-[200px] max-w-[280px] border border-white/10">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400 border-b border-white/10 pb-2 flex justify-between items-center">
                                <span>Gêneros do Livro</span>
                                <span className="bg-white/10 px-1.5 py-0.5 rounded">{genresList.length}</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {genresList.map((g, idx) => (
                                    <span key={g} className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${idx === 0 ? 'bg-primary/20 border-primary/40 text-primary-light' : 'bg-white/5 border-white/5 text-white/90'}`}>
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95"></div>
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
        {book.status === BookStatus.TBR && (
          <button 
            onClick={handleQuickRead}
            className="flex-1 px-6 py-3 text-[11px] font-black rounded-2xl bg-primary text-white hover:bg-slate-900 shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest animate-pulse"
          >
            Ler Agora
          </button>
        )}
        <button onClick={() => onEdit(book)} className="flex-1 px-6 py-3 text-[11px] font-black rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95 uppercase tracking-widest">
          Editar
        </button>
        <button onClick={() => onDelete(book)} className="flex-1 px-6 py-3 text-[11px] font-black rounded-2xl bg-white text-red-400 hover:bg-red-50 border border-red-100 transition-all active:scale-95 uppercase tracking-widest">
          Excluir
        </button>
      </div>
    </article>
  );
};
