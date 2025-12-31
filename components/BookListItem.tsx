
import React from 'react';
import type { Book, StatusConfigs } from '../types';
import { BookStatus, STATUS_COLORS, STATUS_CONFIGS } from '../types';
import { StarIcon, StarIconFilled, PencilIcon, TrashIcon, BookOpenIcon } from './Icons';

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
      {[...Array(10)].map((_, index) => {
        const starIndex = index + 1;
        const diff = rating - index;
        const isFull = diff >= 1;
        const isPartial = diff > 0 && diff < 1;
        const fillPercentage = isPartial ? diff * 100 : (isFull ? 100 : 0);

        return (
          <div key={index} className="relative h-3.5 w-3.5">
            <StarIcon className="absolute inset-0 h-3.5 w-3.5 text-slate-200 dark:text-slate-700" />
            <div 
              className="absolute inset-0 overflow-hidden" 
              style={{ width: `${fillPercentage}%` }}
            >
              <StarIconFilled className="h-3.5 w-3.5 text-amber-400" />
            </div>
          </div>
        );
      })}
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
        { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-800/50' },
        { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-800/50' },
        { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800/50' },
        { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30' },
        { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-800/50' },
        { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-100 dark:border-cyan-800/50' },
        { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-800/50' },
        { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-100 dark:border-fuchsia-800/50' },
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
  const authorsList = book.author ? book.author.split(',').map(a => a.trim()).filter(a => a !== '') : [];
  
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
        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm transition-all whitespace-nowrap ${
            isTrigger ? 'cursor-help ring-2 ring-transparent hover:ring-primary/20 bg-white dark:bg-slate-900' : 'cursor-default ' + palette.bg
        } ${palette.text} ${palette.border}`}
      >
          {g} {isTrigger && <span className="ml-1 opacity-60 font-bold">(+{hiddenCount})</span>}
      </span>
    );
  };

  return (
    <article className="relative bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-10 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/20 dark:hover:border-primary/40 group overflow-hidden animate-in fade-in slide-in-from-bottom-6">
      
      {/* Decoração de Fundo no Hover */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      {/* Capa com Efeitos 3D Avançados */}
      <div className="relative flex-shrink-0 perspective-1000 z-10">
        <div className="relative group/cover transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-y-12 group-hover:scale-110 group-hover:translate-x-1">
          <img
            src={book.coverImageUrl || `https://picsum.photos/seed/${encodeURIComponent(book.title)}/400/600`}
            alt={book.title}
            className="w-32 h-48 md:w-40 md:h-60 object-cover rounded-2xl shadow-2xl ring-1 ring-black/5"
          />
          {/* Simulação de Lombada */}
          <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/30 via-black/10 to-transparent rounded-l-2xl"></div>
          <div className="absolute inset-y-0 left-1 w-px bg-white/10"></div>
          
          {/* Efeito de Sweep de Brilho */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
        </div>
        
        {/* Sombra de Chão */}
        <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      </div>

      <div className="flex-1 text-center md:text-left min-w-0 z-10 flex flex-col h-full">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight font-serif italic group-hover:text-primary transition-colors mb-1">
                  {book.title}
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                  {authorsList.map((author, idx) => (
                    <React.Fragment key={author}>
                      <p className="text-lg text-slate-400 dark:text-slate-500 font-bold tracking-tight">{author}</p>
                      {idx < authorsList.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-700 text-sm font-black">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1.5">
                <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest whitespace-nowrap border border-slate-100 dark:border-slate-800">
                  ID #{book.id.substring(0, 4)}
                </span>
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest whitespace-nowrap">
                  Desde {formatDate(book.dateAdded)}
                </span>
            </div>
        </div>

        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-8">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${colorStyles.bg} ${colorStyles.text} ${colorStyles.border} dark:bg-opacity-20`}>
                {config.label}
            </span>
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800">
                {book.type}
            </span>
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border bg-blue-50/50 dark:bg-blue-900/10 text-primary dark:text-blue-400 border-blue-100 dark:border-blue-800/50">
                {book.pages} págs
            </span>
            {book.status === BookStatus.Read && book.daysToFinish !== undefined && (
                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                    {book.daysToFinish}d lendo
                </span>
            )}
            
            <div className="h-4 w-px bg-slate-100 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            {!isOverLimit ? (
                genresList.map(g => renderGenreTag(g))
            ) : (
                <div className="relative group/genre-tooltip">
                    {renderGenreTag(genresList[0], true)}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/genre-tooltip:opacity-100 transition-all duration-300 pointer-events-none z-50 transform translate-y-2 group-hover/genre-tooltip:translate-y-0">
                        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl min-w-[200px] max-w-[280px] border border-white/10 dark:border-slate-700">
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
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95 dark:border-t-slate-800/95"></div>
                    </div>
                </div>
            )}
        </div>
        
        {book.notes && (
          <div className="mb-6 text-left bg-slate-50/30 dark:bg-slate-800/30 p-5 rounded-[1.5rem] border border-slate-100/50 dark:border-slate-800/50 relative">
            <span className="text-[9px] font-black text-primary/40 dark:text-primary/60 uppercase tracking-widest block mb-2">Comentários</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic leading-relaxed font-medium">
              "{book.notes}"
            </p>
            <div className="absolute top-4 right-5 opacity-10">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21H14.017ZM14.017 21C12.9124 21 12.017 20.1046 12.017 19V18C12.017 15.2386 14.2556 13 17.017 13H18.017C20.7784 13 23.017 15.2386 23.017 18V19C23.017 20.1046 22.1216 21 21.017 21H14.017ZM3.01702 21L3.01702 18C3.01702 16.8954 3.91245 16 5.01702 16H8.01702C9.12159 16 10.017 16.8954 10.017 18V21H3.01702ZM3.01702 21C1.91245 21 1.01702 20.1046 1.01702 19V18C1.01702 15.2386 3.2556 13 6.01702 13H7.01702C9.77845 13 12.017 15.2386 12.017 18V19C12.017 20.1046 11.1216 21 10.017 21H3.01702Z"/></svg>
            </div>
          </div>
        )}

        {book.rating !== undefined && book.status === BookStatus.Read && (
            <div className="flex justify-center md:justify-start items-center gap-4 mt-auto py-3 bg-amber-50/30 dark:bg-amber-900/10 p-3 rounded-2xl w-fit border border-amber-100/50 dark:border-amber-900/20 shadow-sm">
                <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Avaliação</span>
                    <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-amber-500/20">
                      {book.rating % 1 === 0 ? book.rating : book.rating.toFixed(1)}
                    </span>
                </div>
                <div className="h-4 w-px bg-amber-200 dark:bg-amber-900/50"></div>
                <StarRating rating={book.rating} />
            </div>
        )}
      </div>

      <div className="flex flex-row md:flex-col gap-3 w-full md:w-48 mt-4 md:mt-0 z-20 self-center">
        {book.status === BookStatus.TBR && (
          <button 
            onClick={handleQuickRead}
            className="flex-1 px-5 py-4 text-[10px] font-black rounded-2xl bg-primary text-white hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2 group/btn"
          >
            <BookOpenIcon className="h-4 w-4 transition-transform group-hover/btn:scale-125" />
            Ler Agora
          </button>
        )}
        <button 
          onClick={() => onEdit(book)} 
          className="flex-1 px-5 py-3.5 text-[10px] font-black rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm group/btn"
        >
          <PencilIcon className="h-4 w-4 transition-transform group-hover/btn:rotate-12" />
          Editar
        </button>
        <button 
          onClick={() => onDelete(book)} 
          className="flex-1 px-5 py-3.5 text-[10px] font-black rounded-2xl bg-red-50/50 dark:bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 dark:border-red-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm group/btn"
        >
          <TrashIcon className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
          Excluir
        </button>
      </div>
    </article>
  );
};
