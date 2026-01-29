
import React, { useState, useMemo } from 'react';
import type { Book, Profile } from '../types';
import { BookStatus, GENRES } from '../types';
import { BookListItem } from './BookListItem';
import { XMarkIcon, TagIcon } from './Icons';

interface BookListProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onDuplicate: (book: Book) => void;
  onViewDetails?: (book: Book) => void;
  onUpdateBook?: (book: Book) => void;
  profile: Profile | null;
}

type FilterStatus = 'all' | BookStatus;
type SortOrder = 'title' | 'dateAdded';

export const BookList: React.FC<BookListProps> = ({ books, onEdit, onDelete, onDuplicate, onViewDetails, onUpdateBook, profile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOrder>('dateAdded');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [genreSearch, setGenreSearch] = useState('');

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleUpdateStatus = (book: Book, status: BookStatus) => {
    if (onUpdateBook) {
      onUpdateBook({ ...book, status });
    }
  };

  const filteredBooks = useMemo(() => {
    let result = [...books];
    
    // Sort
    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(book => book.status === statusFilter);
    }

    // Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    }

    // Genre Filter
    if (selectedGenres.length > 0) {
      result = result.filter(book => {
        const bookGenres = book.genre.split(',').map(g => g.trim().toLowerCase());
        return selectedGenres.some(sg => bookGenres.includes(sg.toLowerCase()));
      });
    }

    // Tag Filter
    if (selectedTags.length > 0) {
      result = result.filter(book => {
        const bookTags = book.tags || [];
        return selectedTags.some(st => bookTags.includes(st));
      });
    }

    return result;
  }, [books, searchQuery, statusFilter, sortBy, selectedGenres, selectedTags]);

  const filteredGenresList = useMemo(() => {
    if (!genreSearch) return GENRES;
    return GENRES.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()));
  }, [genreSearch]);

  const filterButtons = [
    { label: 'Todos', value: 'all' as FilterStatus },
    { label: 'Lendo', value: BookStatus.Reading as FilterStatus },
    { label: 'Lidos', value: BookStatus.Read as FilterStatus },
    { label: 'Quero Ler', value: BookStatus.TBR as FilterStatus },
    { label: 'Abandonados', value: BookStatus.Dropped as FilterStatus },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-50 tracking-tight">
            Minha Estante <span className="text-primary/50 text-xl ml-2">({filteredBooks.length})</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Explore e organize sua jornada literária.</p>
        </div>
        
        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por título ou autor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft space-y-8 transition-all hover:border-slate-200 dark:hover:border-slate-700">
        {/* Status and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-6 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] mr-1">Status:</span>
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  statusFilter === btn.value
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-primary/30'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em]">Ordenar:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOrder)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 outline-none focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer"
            >
              <option value="dateAdded">Mais Recentes</option>
              <option value="title">Título (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Tags Filter */}
        {profile?.customTags && profile.customTags.length > 0 && (
            <div className="space-y-4 pb-6 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <TagIcon className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em]">Filtrar por Minhas Tags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {profile.customTags.map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                    isSelected 
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-95' 
                                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                }`}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Genre Filter */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em]">Filtrar por Gênero:</span>
              {(selectedGenres.length > 0 || selectedTags.length > 0) && (
                <button 
                  onClick={() => { setSelectedGenres([]); setSelectedTags([]); }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  Limpar Todos os Filtros
                </button>
              )}
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Pesquisar gênero..." 
                value={genreSearch}
                onChange={(e) => setGenreSearch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-primary/40 w-full sm:w-48 transition-all"
              />
              {genreSearch && (
                <button onClick={() => setGenreSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar p-1">
            {filteredGenresList.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-md scale-95 ring-2 ring-primary/20'
                      : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredBooks.length > 0 ? (
          filteredBooks.map(book => (
            <BookListItem 
              key={book.id} 
              book={book} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onDuplicate={onDuplicate}
              onViewDetails={onViewDetails}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        ) : (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center">
            <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-200 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 font-serif">Nenhum livro corresponde à busca</h3>
            <p className="text-slate-400 dark:text-slate-500 mt-2 max-w-xs mx-auto text-sm">Parece que seus filtros estão muito específicos.</p>
            <button 
                onClick={() => { setStatusFilter('all'); setSearchQuery(''); setSelectedGenres([]); setSelectedTags([]); setGenreSearch(''); }}
                className="mt-8 px-6 py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95"
            >
                Redefinir Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
