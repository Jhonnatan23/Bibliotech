
import React from 'react';
import type { Book, StatusConfigs } from '../types';
import { BookStatus, STATUS_COLORS, STATUS_CONFIGS } from '../types';
import { StarIcon, StarIconFilled, PencilIcon, TrashIcon, BookOpenIcon, Square2StackIcon } from './Icons';

interface BookListItemProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onDuplicate: (book: Book) => void;
  onUpdateStatus?: (book: Book, status: BookStatus) => void;
  statusConfigs?: StatusConfigs;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(10)].map((_, index) => {
        const diff = rating - index;
        const isFull = diff >= 1;
        const isPartial = diff > 0 && diff < 1;
        const fillPercentage = isPartial ? diff * 100 : (isFull ? 100 : 0);

        return (
          <div key={index} className="relative h-3 w-3 sm:h-3.5 sm:w-3.5">
            <StarIcon className="absolute inset-0 h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-200 dark:text-slate-700" />
            <div 
              className="absolute inset-0 overflow-hidden" 
              style={{ width: `${fillPercentage}%` }}
            >
              <StarIconFilled className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
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
  onDuplicate,
  onUpdateStatus,
  statusConfigs = STATUS_CONFIGS 
}) => {
  const config = statusConfigs[book.status];
  const colorStyles = STATUS_COLORS[config.color as keyof typeof STATUS_COLORS];
  const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];
  const authorsList = book.author ? book.author.split(',').map(a => a.trim()).filter(a => a !== '') : [];
  
  const handleQuickRead = () => {
    if (onUpdateStatus) {
      onUpdateStatus({
        ...book,
        dateStarted: new Date().toISOString().split('T')[0],
        currentPage: book.currentPage || 0
      }, BookStatus.Reading);
    }
  };

  return (
    <article className="relative bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 transition-all duration-500 hover:shadow-2xl hover:border-primary/20 group">
      <div className="flex-1 text-center md:text-left min-w-0 z-10 flex flex-col h-full w-full">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight font-serif italic group-hover:text-primary transition-colors mb-0.5 md:mb-1 truncate">
                  {book.title}
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-1.5 md:gap-2">
                  {authorsList.map((author, idx) => (
                    <React.Fragment key={author}>
                      <p className="text-sm md:text-lg text-slate-400 dark:text-slate-50 font-bold tracking-tight truncate max-w-[150px] sm:max-w-none">{author}</p>
                      {idx < authorsList.length - 1 && (
                        <span className="text-slate-300 dark:text-slate-700 text-xs md:text-sm font-black">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
            </div>
            <div className="flex flex-row md:flex-col items-center justify-center md:items-end gap-2 md:gap-1.5 opacity-60">
                <span className="px-2 py-0.5 md:px-3 md:py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest whitespace-nowrap border border-slate-100">
                  ID #{book.id.substring(0, 4)}
                </span>
                <span className="text-[8px] md:text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest whitespace-nowrap">
                  {formatDate(book.dateAdded)}
                </span>
            </div>
        </div>

        <div className="flex flex-wrap justify-center md:justify-start items-center gap-1.5 md:gap-2 mb-4 md:mb-6">
            <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.05em] md:tracking-[0.1em] border shadow-sm ${colorStyles.bg} ${colorStyles.text} ${colorStyles.border}`}>
                {config.label}
            </span>
            <span className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.05em] md:tracking-[0.1em] border bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100">
                {book.type}
            </span>
            <span className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.05em] md:tracking-[0.1em] border bg-blue-50/50 dark:bg-blue-900/10 text-primary border-blue-100">
                {book.pages}p
            </span>
            
            <div className="hidden sm:flex flex-wrap gap-1.5">
                {genresList.slice(0, 3).map(g => {
                    const palette = getGenreColor(g);
                    return (
                        <span key={g} className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider border ${palette.bg} ${palette.text} ${palette.border}`}>
                            {g}
                        </span>
                    );
                })}
            </div>
        </div>
        
        {book.summary && (
          <p className="hidden sm:block text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic mb-6">
            "{book.summary}"
          </p>
        )}

        {book.rating !== undefined && book.status === BookStatus.Read && (
            <div className="flex justify-center md:justify-start items-center gap-3 md:gap-4 mt-auto py-2 md:py-3 bg-amber-50/30 dark:bg-amber-900/10 px-3 rounded-xl md:rounded-2xl w-full md:w-fit border border-amber-100">
                <div className="flex items-center gap-1.5 md:gap-2 px-1">
                    <span className="text-[8px] md:text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Nota</span>
                    <span className="bg-amber-500 text-white text-[9px] md:text-[11px] font-black px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg shadow-lg">
                      {book.rating % 1 === 0 ? book.rating : book.rating.toFixed(1)}
                    </span>
                </div>
                <StarRating rating={book.rating} />
            </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:gap-3 w-full md:w-44 lg:w-48 z-20 self-stretch md:self-center">
        {(book.status === BookStatus.TBR || book.status === BookStatus.Dropped) && (
          <button 
            onClick={handleQuickRead}
            className="w-full px-4 py-3 md:py-4 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-primary text-white hover:bg-slate-900 shadow-xl transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <BookOpenIcon className="h-4 w-4" />
            <span className="md:inline">Ler</span>
          </button>
        )}
        <div className="flex gap-2 w-full">
            <button 
              onClick={() => onEdit(book)} 
              className="flex-1 px-3 py-2.5 md:py-3.5 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 hover:border-primary hover:text-primary transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm"
            >
              <PencilIcon className="h-4 w-4" />
              <span className="sm:inline">Editar</span>
            </button>
            <button 
              onClick={() => onDuplicate(book)} 
              className="px-3 py-2.5 md:py-3.5 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-primary border border-slate-200 transition-all flex items-center justify-center shadow-sm"
            >
              <Square2StackIcon className="h-4 w-4" />
            </button>
        </div>
        <button 
          onClick={() => onDelete(book)} 
          className="w-full px-4 py-2.5 md:py-3.5 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <TrashIcon className="h-4 w-4" />
          <span className="sm:inline">Excluir</span>
        </button>
      </div>
    </article>
  );
};
