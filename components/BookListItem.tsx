
import React, { useState } from 'react';
import type { Book, StatusConfigs } from '../types';
import { BookStatus, STATUS_COLORS, STATUS_CONFIGS } from '../types';
import { StarIcon, StarIconFilled, PencilIcon, TrashIcon, BookOpenIcon, Square2StackIcon, TagIcon } from './Icons';
import { LinkedBooksModal } from './LinkedBooksModal';

interface BookListItemProps {
  book: Book;
  allBooks: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onDuplicate: (book: Book) => void;
  onViewDetails?: (book: Book) => void;
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

export const BookListItem: React.FC<BookListItemProps> = React.memo(({ 
  book, 
  allBooks,
  onEdit, 
  onDelete, 
  onDuplicate,
  onViewDetails,
  onUpdateStatus,
  statusConfigs = STATUS_CONFIGS 
}) => {
  const [isLinkedModalOpen, setIsLinkedModalOpen] = useState(false);
  const config = statusConfigs[book.status];
  const colorStyles = STATUS_COLORS[config.color as keyof typeof STATUS_COLORS];
  const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];
  const authorsList = book.author ? book.author.split(',').map(a => a.trim()).filter(a => a !== '') : [];
  const bookTags = book.tags || [];
  const linkedCount = book.linkedBookIds?.length || 0;
  
  const handleQuickRead = () => {
    if (onUpdateStatus) {
      onUpdateStatus({
        ...book,
        dateStarted: new Date().toISOString().split('T')[0],
        currentPage: book.currentPage || 0
      }, BookStatus.Reading);
    }
  };

  const isRead = book.status === BookStatus.Read;
  
  return (
    <article className={`relative p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-soft border transition-all duration-500 hover:shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 group ${
      isRead 
        ? 'bg-emerald-50/20 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-300' 
        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/20'
    }`}>
      {isRead && (
        <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        </div>
      )}

      <div className="flex-1 text-center md:text-left min-w-0 z-10 flex flex-col h-full w-full">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h3 
                        onClick={() => onViewDetails?.(book)}
                        className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight font-serif italic group-hover:text-primary transition-colors truncate cursor-pointer hover:underline decoration-primary/30"
                    >
                      {book.title}
                    </h3>
                    {isRead && (
                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg shadow-emerald-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>
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
            <span className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.05em] md:tracking-[0.1em] border shadow-sm ${book.isDigital ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100'}`}>
                {book.isDigital ? 'Digital' : 'Físico'}
            </span>
            {book.series && (
                <span className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 shadow-sm">
                    {book.series} {book.volume ? `#${book.volume}` : ''}
                </span>
            )}
            {book.isLoaned && (
                <span className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border bg-amber-500 text-white shadow-sm flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M1 8.25c0-2.485 2.099-4.5 4.688-4.5 1.935 0 3.597 1.126 4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C2.1 3.75 0 5.765 0 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    Emprestado
                </span>
            )}
            
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

            {bookTags.length > 0 && (
                <div className="flex sm:flex items-center gap-1.5 border-l border-slate-100 dark:border-slate-800 pl-3">
                    {bookTags.slice(0, 2).map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">
                            <TagIcon className="h-2.5 w-2.5" /> {tag}
                        </span>
                    ))}
                    {bookTags.length > 2 && <span className="text-[8px] font-black text-slate-300">+{bookTags.length - 2}</span>}
                </div>
            )}
        </div>

        {linkedCount > 0 && (
            <div className="mb-4 md:mb-6 animate-in fade-in slide-in-from-left-4 duration-700">
                <div 
                    onClick={() => setIsLinkedModalOpen(true)}
                    className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20 group/link cursor-pointer hover:scale-105 transition-transform"
                >
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        <Square2StackIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">Conexões</span>
                        <span className="text-xs font-bold text-indigo-50">{linkedCount} {linkedCount === 1 ? 'Livro Vinculado' : 'Livros Vinculados'}</span>
                    </div>
                    <div className="ml-2 bg-white/10 p-1 rounded-full group-hover/link:translate-x-1 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                </div>
            </div>
        )}
        
        <LinkedBooksModal 
            isOpen={isLinkedModalOpen}
            onClose={() => setIsLinkedModalOpen(false)}
            parentBook={book}
            allBooks={allBooks}
            onNavigateToBook={(b) => onViewDetails?.(b)}
        />
        
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
            className="w-full h-12 px-4 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-primary text-white hover:bg-tertiary shadow-xl transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer md:h-auto md:py-4"
          >
            <BookOpenIcon className="h-4 w-4" />
            <span className="md:inline">Ler</span>
          </button>
        )}
        <div className="flex gap-2 w-full">
            <button 
              onClick={() => onEdit(book)} 
              className="flex-1 h-12 px-3 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 hover:border-primary hover:text-primary transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm cursor-pointer md:h-auto md:py-3.5"
            >
              <PencilIcon className="h-4 w-4" />
              <span className="sm:inline">Editar</span>
            </button>
            <button 
              onClick={() => onDuplicate(book)} 
              className="w-12 h-12 px-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-primary border border-slate-200 transition-all flex items-center justify-center shadow-sm cursor-pointer rounded-xl md:w-auto md:h-auto md:py-3.5"
            >
              <Square2StackIcon className="h-4 w-4" />
            </button>
        </div>
        <button 
          onClick={() => onDelete(book)} 
          className="w-full h-12 px-4 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer md:h-auto md:py-3.5"
        >
          <TrashIcon className="h-4 w-4" />
          <span className="sm:inline">Excluir</span>
        </button>
      </div>
    </article>
  );
});
