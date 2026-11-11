
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import type { Book, Profile, ReadingStats } from '../types';
import { BookStatus, GENRES } from '../types';
import { BookListItem } from './BookListItem';
import { ShelfProgress } from './ShelfProgress';
import { XMarkIcon, TagIcon } from './Icons';
import { ShelfView } from './ShelfView';
import { Wishlist } from './Wishlist';
import { SeriesView } from './SeriesView';
import { EmptyState } from './EmptyState';

interface BookListProps {
  books: Book[];
  allBooks: Book[];
  stats: ReadingStats;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onDuplicate: (book: Book) => void;
  onViewDetails?: (book: Book) => void;
  onUpdateBook?: (book: Book) => Promise<void> | void;
  profile: Profile | null;
  onRandomPick: () => void;
  onMoveToShelf?: (book: Book) => void;
  onAddBook?: (status?: BookStatus) => void;
  onRefresh?: () => Promise<void>;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export type FilterStatus = 'all' | 'series' | BookStatus;
type FormatFilter = 'all' | 'physical' | 'digital';
type LoanFilter = 'all' | 'loaned' | 'not_loaned';
type SortOrder = 'title' | 'dateAdded' | 'isDigital' | 'isLoaned';

const parseInitialFilter = (tab?: string): FilterStatus => {
  if (!tab) return 'all';
  const t = tab.toLowerCase();
  if (t === 'wishlist' || t === 'desejos' || t === 'desejo') return BookStatus.Wishlist;
  if (t === 'series' || t === 'séries') return 'series';
  if (t === 'reading' || t === 'lendo') return BookStatus.Reading;
  if (t === 'read' || t === 'lidos' || t === 'lido') return BookStatus.Read;
  if (t === 'tbr' || t === 'queroler' || t === 'quero ler') return BookStatus.TBR;
  if (t === 'dropped' || t === 'abandonados' || t === 'abandonado') return BookStatus.Dropped;
  return 'all';
};

export const BookList: React.FC<BookListProps> = React.memo(({ 
  books, 
  allBooks, 
  stats, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onViewDetails, 
  onUpdateBook, 
  profile, 
  onRandomPick,
  onMoveToShelf,
  onAddBook,
  onRefresh,
  initialTab,
  onTabChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 120);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>(() => parseInitialFilter(initialTab));

  useEffect(() => {
    if (initialTab) {
      setStatusFilter(parseInitialFilter(initialTab));
    }
  }, [initialTab]);
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [loanFilter, setLoanFilter] = useState<LoanFilter>('all');
  const [sortBy, setSortBy] = useState<SortOrder>('dateAdded');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [genreSearch, setGenreSearch] = useState('');
  const [quickReadFilter, setQuickReadFilter] = useState(false);

  // View mode preference with LocalStorage persistence
  const [viewMode, setViewMode] = useState<'list' | 'shelf'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('bibliotech_view_mode') as 'list' | 'shelf') || 'list';
    }
    return 'list';
  });

  const handleViewModeChange = (mode: 'list' | 'shelf') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bibliotech_view_mode', mode);
    }
  };

  // Advanced filters state
  const [minRating, setMinRating] = useState<string | number | 'all' | 'unrated'>('all');
  const [selectedYear, setSelectedYear] = useState<string | 'all' | 'none'>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Dynamic reading years extracted from finished books
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    books.forEach(b => {
      if (b.status === BookStatus.Read && b.dateFinished && b.dateFinished.length >= 4) {
        const year = b.dateFinished.substring(0, 4);
        if (/^\d{4}$/.test(year)) {
          yearsSet.add(year);
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [books]);

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

  const isGlobalSearching = Boolean(debouncedSearchQuery && debouncedSearchQuery.trim() !== '');

  const filteredBooks = useMemo(() => {
    // 3. When searching inside Estante, search against the entire user collection regardless of book status
    if (isGlobalSearching) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      let result = books.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.series && book.series.toLowerCase().includes(query)) ||
        (book.genre && book.genre.toLowerCase().includes(query)) ||
        (book.summary && book.summary.toLowerCase().includes(query)) ||
        (book.notes && book.notes.toLowerCase().includes(query))
      );

      // Leitura Rápida (< 200 páginas) também na busca global
      if (quickReadFilter) {
        result = result.filter(book => book.pages > 0 && book.pages < 200);
      }

      // Sort
      if (sortBy === 'title') {
        result.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'isDigital') {
        result.sort((a, b) => (a.isDigital === b.isDigital ? 0 : a.isDigital ? -1 : 1));
      } else if (sortBy === 'isLoaned') {
        result.sort((a, b) => (a.isLoaned === b.isLoaned ? 0 : a.isLoaned ? -1 : 1));
      } else {
        result.sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''));
      }

      return result;
    }

    // Default: Entire collection without excluding Wishlist
    let result = [...books];

    // Status / Series / Wishlist Tab Filter
    if (statusFilter === 'series') {
      result = result.filter(book => Boolean(book.series && book.series.trim() !== ''));
    } else if (statusFilter !== 'all') {
      result = result.filter(book => book.status === statusFilter);
    }

    // Format Filter
    if (formatFilter === 'physical') {
      result = result.filter(book => !book.isDigital);
    } else if (formatFilter === 'digital') {
      result = result.filter(book => book.isDigital);
    }

    // Loan Filter
    if (loanFilter === 'loaned') {
      result = result.filter(book => book.isLoaned);
    } else if (loanFilter === 'not_loaned') {
      result = result.filter(book => !book.isLoaned);
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

    // Advanced Rating Filter
    if (minRating !== 'all') {
      if (minRating === 'unrated') {
        result = result.filter(book => book.rating === undefined || book.rating === 0);
      } else {
        const minVal = Number(minRating);
        result = result.filter(book => book.rating !== undefined && book.rating >= minVal);
      }
    }

    // Advanced Reading Year Filter
    if (selectedYear !== 'all') {
      if (selectedYear === 'none') {
        result = result.filter(book => book.status === BookStatus.Read && !book.dateFinished);
      } else {
        result = result.filter(book => 
          book.status === BookStatus.Read && 
          book.dateFinished && 
          book.dateFinished.substring(0, 4) === selectedYear
        );
      }
    }

    // Leitura Rápida (< 200 páginas)
    if (quickReadFilter) {
      result = result.filter(book => book.pages > 0 && book.pages < 200);
    }

    // Sort
    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'isDigital') {
      result.sort((a, b) => (a.isDigital === b.isDigital ? 0 : a.isDigital ? -1 : 1));
    } else if (sortBy === 'isLoaned') {
      result.sort((a, b) => (a.isLoaned === b.isLoaned ? 0 : a.isLoaned ? -1 : 1));
    } else {
      result.sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''));
    }

    return result;
  }, [books, debouncedSearchQuery, isGlobalSearching, statusFilter, formatFilter, loanFilter, sortBy, selectedGenres, selectedTags, minRating, selectedYear, quickReadFilter]);

  const filteredGenresList = useMemo(() => {
    if (!genreSearch) return GENRES;
    return GENRES.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()));
  }, [genreSearch]);

  // Top Filter Chips according to Requirement 2:
  // Todos | Lendo | Quero Ler | Lidos | Séries | Desejos | Abandonados
  const filterButtons = [
    { label: 'Todos', value: 'all' as FilterStatus, tabKey: 'all', count: books.length },
    { label: 'Lendo', value: BookStatus.Reading as FilterStatus, tabKey: 'reading', count: books.filter(b => b.status === BookStatus.Reading).length },
    { label: 'Quero Ler', value: BookStatus.TBR as FilterStatus, tabKey: 'tbr', count: books.filter(b => b.status === BookStatus.TBR).length },
    { label: 'Lidos', value: BookStatus.Read as FilterStatus, tabKey: 'read', count: books.filter(b => b.status === BookStatus.Read).length },
    { label: 'Séries', value: 'series' as FilterStatus, tabKey: 'series', count: books.filter(b => Boolean(b.series && b.series.trim() !== '')).length },
    { label: 'Desejos', value: BookStatus.Wishlist as FilterStatus, tabKey: 'wishlist', count: books.filter(b => b.status === BookStatus.Wishlist).length },
    { label: 'Abandonados', value: BookStatus.Dropped as FilterStatus, tabKey: 'dropped', count: books.filter(b => b.status === BookStatus.Dropped).length },
  ];

  const quickReadCount = useMemo(() => {
    return books.filter(b => b.pages > 0 && b.pages < 200).length;
  }, [books]);

  const handleChipClick = (btn: typeof filterButtons[number]) => {
    setStatusFilter(btn.value);
    onTabChange?.(btn.tabKey);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-50 tracking-tight">
              Minha Estante <span className="text-primary/50 text-xl ml-2">({filteredBooks.length})</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Explore e organize sua jornada literária.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onRandomPick}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-emerald-500/20"
              title="Sortear próximo livro"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
              Leitura Aleatória
            </button>

            {/* View Switcher (Lista vs Estante) */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-inner">
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Visualização em Lista"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                Lista
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('shelf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  viewMode === 'shelf'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Visualização em Estante"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                Estante
              </button>
            </div>
          </div>
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

      <ShelfProgress books={allBooks} stats={stats} />

      <div className="bg-white dark:bg-slate-900 p-4 sm:p-7 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft space-y-6 sm:space-y-8 transition-all hover:border-slate-200 dark:hover:border-slate-700">
        {/* Status and Sort */}
        <div className="flex flex-col space-y-6 pb-6 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] mr-1">Filtros:</span>
              {filterButtons.map((btn) => {
                const isSelected = statusFilter === btn.value;
                return (
                  <button
                    key={btn.tabKey}
                    type="button"
                    data-testid={`filter-chip-${btn.tabKey}`}
                    onClick={() => handleChipClick(btn)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700 hover:border-primary/40 hover:text-primary dark:hover:text-primary'
                    }`}
                  >
                    <span>{btn.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {btn.count}
                    </span>
                  </button>
                );
              })}
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
                <option value="isDigital">Digitais Primeiro</option>
                <option value="isLoaned">Emprestados Primeiro</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] mr-1">Formato:</span>
              <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                {(['all', 'physical', 'digital'] as FormatFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormatFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      formatFilter === f 
                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'physical' ? 'Físico' : 'Digital'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] mr-1">Empréstimo:</span>
              <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                {(['all', 'loaned', 'not_loaned'] as LoanFilter[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setLoanFilter(l)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      loanFilter === l 
                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {l === 'all' ? 'Todos' : l === 'loaned' ? 'Emprestado' : 'Na Estante'}
                  </button>
                ))}
              </div>
            </div>

            {/* Leitura Rápida Filter (< 200 páginas) */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setQuickReadFilter(!quickReadFilter)}
                data-testid="filter-quick-read"
                aria-pressed={quickReadFilter}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                  quickReadFilter
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
                title="Exibir apenas livros curtos com menos de 200 páginas"
              >
                <span>⚡</span>
                <span>Leitura Rápida (&lt;200p)</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                  quickReadFilter
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {quickReadCount}
                </span>
                {quickReadFilter && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white ml-0.5" />
                )}
              </button>
            </div>

            {/* Toggle Filtros Avançados Button */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm cursor-pointer ${
                  showAdvanced || minRating !== 'all' || selectedYear !== 'all'
                    ? 'bg-primary/5 text-primary border-primary/30 dark:bg-primary/10 dark:text-primary'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`h-4 w-4 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
                {showAdvanced ? 'Ocultar Filtros Avançados' : 'Filtros Avançados'}
                {(minRating !== 'all' || selectedYear !== 'all') && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-50 dark:border-slate-800 animate-in fade-in duration-300">
            {/* Rating Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em]">Nota Mínima:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { label: 'Todas', value: 'all' },
                  { label: '5 ★', value: '5' },
                  { label: '4★+', value: '4' },
                  { label: '3★+', value: '3' },
                  { label: '2★+', value: '2' },
                  { label: 'Sem Nota', value: 'unrated' }
                ] as const).map(option => {
                  const isSelected = minRating === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setMinRating(option.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-95 ring-2 ring-amber-500/20'
                          : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:text-amber-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Year Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em]">Ano de Leitura:</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    selectedYear === 'all'
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md scale-95 ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-500'
                  }`}
                >
                  Todos
                </button>

                {availableYears.map(year => {
                  const isSelected = selectedYear === year;
                  return (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        isSelected
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-md scale-95 ring-2 ring-indigo-500/20'
                          : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-500'
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}

                {books.some(b => b.status === BookStatus.Read && !b.dateFinished) && (
                  <button
                    onClick={() => setSelectedYear('none')}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      selectedYear === 'none'
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-md scale-95 ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-500'
                    }`}
                  >
                    Sem data
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
              {(selectedGenres.length > 0 || selectedTags.length > 0 || minRating !== 'all' || selectedYear !== 'all' || statusFilter !== 'all' || formatFilter !== 'all' || loanFilter !== 'all') && (
                <button 
                  onClick={() => { 
                    setSelectedGenres([]); 
                    setSelectedTags([]); 
                    setMinRating('all');
                    setSelectedYear('all');
                    setStatusFilter('all');
                    setFormatFilter('all');
                    setLoanFilter('all');
                  }}
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

      {/* 3. Global search results across all reading statuses */}
      {isGlobalSearching ? (
        <div className="space-y-6">
          <div 
            data-testid="global-search-banner"
            className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔍</span>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  Buscando em todo o acervo por &quot;{debouncedSearchQuery}&quot;
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {filteredBooks.length} livro(s) encontrado(s) em todos os status (Lendo, Lidos, Quero Ler, Séries, Desejos e Abandonados)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              Limpar busca
            </button>
          </div>

          {viewMode === 'list' ? (
            <motion.div 
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.04
                  }
                }
              }}
            >
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
                  <motion.div
                    key={book.id}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { 
                        opacity: 1, 
                        y: 0, 
                        transition: { type: 'spring', stiffness: 280, damping: 25 } 
                      }
                    }}
                  >
                    <BookListItem 
                      book={book} 
                      allBooks={books}
                      onEdit={onEdit} 
                      onDelete={onDelete} 
                      onDuplicate={onDuplicate}
                      onViewDetails={onViewDetails}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  illustration="search"
                  title="Nenhum livro encontrado"
                  description={`Nenhum livro no seu acervo corresponde a "${debouncedSearchQuery}". Tente buscar por outros termos, autores ou gêneros.`}
                  primaryAction={{
                    label: 'Limpar Busca',
                    onClick: () => setSearchQuery(''),
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ),
                    'data-testid': 'search-empty-clear-btn',
                  }}
                  secondaryAction={
                    onAddBook ? {
                      label: 'Cadastrar Este Livro',
                      onClick: () => onAddBook(),
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      ),
                    } : undefined
                  }
                />
              )}
            </motion.div>
          ) : (
            <ShelfView books={filteredBooks} onViewDetails={onViewDetails} />
          )}
        </div>
      ) : statusFilter === 'series' ? (
        /* Dedicated Series View integrated inside Estante Hub */
        <div className="pt-2 animate-in fade-in duration-200" data-testid="integrated-series-view">
          <SeriesView 
            books={books} 
            profile={profile} 
            onEdit={onEdit} 
            onUpdateBook={onUpdateBook as any} 
            onDelete={onDelete} 
            onViewDetails={onViewDetails || (() => {})} 
            onAddBook={() => onAddBook ? onAddBook() : undefined} 
            onRefresh={onRefresh} 
          />
        </div>
      ) : statusFilter === BookStatus.Wishlist ? (
        /* Dedicated Wishlist View integrated inside Estante Hub */
        <div className="pt-2 animate-in fade-in duration-200" data-testid="integrated-wishlist-view">
          <Wishlist 
            books={books.filter(b => b.status === BookStatus.Wishlist)} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onDuplicate={onDuplicate} 
            onMoveToShelf={onMoveToShelf || ((b) => handleUpdateStatus(b, BookStatus.Reading))} 
            onAddWishlistItem={() => onAddBook ? onAddBook(BookStatus.Wishlist) : undefined} 
          />
        </div>
      ) : viewMode === 'list' ? (
        <motion.div 
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.04
              }
            }
          }}
        >
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { 
                        opacity: 1, 
                        y: 0, 
                        transition: { type: 'spring', stiffness: 280, damping: 25 } 
                  }
                }}
              >
                <BookListItem 
                  book={book} 
                  allBooks={books}
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  onDuplicate={onDuplicate}
                  onViewDetails={onViewDetails}
                  onUpdateStatus={handleUpdateStatus}
                />
              </motion.div>
            ))
          ) : (
            <EmptyState
              illustration={quickReadFilter ? 'filter' : statusFilter === 'all' ? 'bookshelf' : 'filter'}
              title={
                quickReadFilter 
                  ? 'Nenhum livro de leitura rápida (< 200p)'
                  : statusFilter !== 'all'
                  ? `Nenhum livro nesta estante (${filterButtons.find(b => b.value === statusFilter)?.label || 'Filtro'})`
                  : 'Nenhum livro corresponde aos filtros'
              }
              description={
                quickReadFilter
                  ? 'Você não possui livros com menos de 200 páginas nesta categoria. Experimente desativar o filtro de leitura rápida ou redefinir os filtros.'
                  : 'Parece que seus filtros estão muito específicos ou esta categoria ainda não possui obras adicionadas.'
              }
              primaryAction={{
                label: 'Redefinir Filtros',
                onClick: () => { 
                  setStatusFilter('all'); 
                  setSearchQuery(''); 
                  setSelectedGenres([]); 
                  setSelectedTags([]); 
                  setGenreSearch(''); 
                  setFormatFilter('all');
                  setLoanFilter('all');
                  setMinRating('all');
                  setSelectedYear('all');
                  setQuickReadFilter(false);
                },
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                'data-testid': 'shelf-reset-filters-btn',
              }}
              secondaryAction={
                onAddBook ? {
                  label: 'Adicionar Livro',
                  onClick: () => onAddBook(statusFilter in BookStatus ? (statusFilter as BookStatus) : undefined),
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  ),
                } : undefined
              }
            />
          )}
        </motion.div>
      ) : (
        <ShelfView books={filteredBooks} onViewDetails={onViewDetails} />
      )}
    </div>
  );
});
