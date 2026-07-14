
import React, { useState, useMemo } from 'react';
import type { Book, Profile } from '../types';
import { BookStatus, STATUS_CONFIGS, STATUS_COLORS, GENRES } from '../types';
import { TrashIcon, PencilIcon, XMarkIcon, PlusIcon, TagIcon } from './Icons';

interface HistoryViewProps {
  books: Book[];
  onUpdateBook: (book: Book) => Promise<void>;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  profile: Profile | null;
}

type FilterStatus = 'all' | BookStatus.Read | BookStatus.Dropped;
type FormatFilter = 'all' | 'physical' | 'digital';
type LoanFilter = 'all' | 'loaned' | 'not_loaned';
type SortOrder = 'dateFinished' | 'title' | 'isDigital' | 'pages' | 'rating' | 'isLoaned';

export const HistoryView: React.FC<HistoryViewProps> = React.memo(({ books, onUpdateBook, onEdit, onDelete, profile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [loanFilter, setLoanFilter] = useState<LoanFilter>('all');
  const [sortBy, setSortBy] = useState<SortOrder>('dateFinished');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [genreSearch, setGenreSearch] = useState('');
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [obsInput, setObsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  // Filtra apenas lidos e abandonados com base nos novos filtros
  const historyBooks = useMemo(() => {
    let result = books.filter(b => b.status === BookStatus.Read || b.status === BookStatus.Dropped);

    // Search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(query) || 
        b.author.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
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

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'isDigital') {
        return (a.isDigital === b.isDigital ? 0 : a.isDigital ? -1 : 1);
      } else if (sortBy === 'isLoaned') {
        return (a.isLoaned === b.isLoaned ? 0 : a.isLoaned ? -1 : 1);
      } else if (sortBy === 'pages') {
        return (b.pages || 0) - (a.pages || 0);
      } else if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else {
        const dateA = a.dateFinished || a.dateAdded;
        const dateB = b.dateFinished || b.dateAdded;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
    });

    return result;
  }, [books, searchTerm, statusFilter, formatFilter, loanFilter, sortBy, selectedGenres, selectedTags]);

  const filteredGenresList = useMemo(() => {
    if (!genreSearch) return GENRES;
    return GENRES.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()));
  }, [genreSearch]);

  const handleStartEditObs = (book: Book) => {
    setEditingObsId(book.id);
    setObsInput(book.historyObservation || '');
  };

  const handleSaveObs = async (book: Book) => {
    setIsSaving(true);
    try {
      await onUpdateBook({ ...book, historyObservation: obsInput });
      setEditingObsId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 sm:px-0">
        <div>
          <h2 className="text-4xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight italic">Meu Histórico</h2>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mt-2 ml-1">✦ Registro de todas as suas jornadas literárias</p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <input 
            type="text" 
            placeholder="Buscar histórico..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft space-y-8">
        {/* Status and Sort */}
        <div className="flex flex-col space-y-6 pb-6 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-50 uppercase tracking-[0.2em] mr-1">Status:</span>
              {[
                { label: 'Todos', value: 'all' },
                { label: 'Lidos', value: BookStatus.Read },
                { label: 'Abandonados', value: BookStatus.Dropped },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setStatusFilter(btn.value as FilterStatus)}
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
                <option value="dateFinished">Mais Recentes</option>
                <option value="title">Título (A-Z)</option>
                <option value="pages">Páginas</option>
                <option value="rating">Avaliação</option>
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
              {(selectedGenres.length > 0 || selectedTags.length > 0 || statusFilter !== 'all' || formatFilter !== 'all' || loanFilter !== 'all') && (
                <button 
                  onClick={() => { 
                    setSelectedGenres([]); 
                    setSelectedTags([]); 
                    setStatusFilter('all');
                    setFormatFilter('all');
                    setLoanFilter('all');
                  }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  Limpar Todos
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

      <div className="grid grid-cols-1 gap-6">
        {historyBooks.length > 0 ? (
          historyBooks.map((book) => {
            const config = STATUS_CONFIGS[book.status];
            const colorStyles = STATUS_COLORS[config.color as keyof typeof STATUS_COLORS];
            const isRead = book.status === BookStatus.Read;

            return (
              <div 
                key={book.id} 
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft overflow-hidden group hover:shadow-xl transition-all duration-500"
              >
                <div className="p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start">
                  {/* Info Principal */}
                  <div className="flex-1 space-y-4 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colorStyles.bg} ${colorStyles.text} ${colorStyles.border}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                        {isRead ? 'Concluído em' : 'Abandonado em'}: {formatDate(book.dateFinished || book.dateAdded)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight font-serif italic mb-1 group-hover:text-primary transition-colors">
                        {book.title}
                        {book.series && (
                            <span className="ml-3 text-sm font-black text-primary/40 not-italic font-sans uppercase tracking-[0.2em]">
                                {book.series} {book.volume ? `#${book.volume}` : ''}
                            </span>
                        )}
                      </h3>
                      <p className="text-slate-400 dark:text-slate-500 font-bold text-base">de {book.author}</p>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1">Duração</span>
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                             {book.daysToFinish || '--'} <span className="text-[10px] opacity-60">dias</span>
                          </span>
                       </div>
                       {book.status === BookStatus.Dropped && book.currentPage !== undefined && (
                          <div className="flex flex-col">
                             <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1">Parou na pág</span>
                             <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                                {book.currentPage} <span className="text-[10px] opacity-60">/ {book.pages}</span>
                             </span>
                          </div>
                       )}
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1">Páginas</span>
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                             {book.pages} <span className="text-[10px] opacity-60">pág</span>
                          </span>
                       </div>
                       {book.rating && (
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1">Avaliação</span>
                            <span className="text-sm font-black text-amber-500 flex items-center gap-1">
                               {book.rating} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>
                            </span>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Campo de Observação Exclusiva */}
                  <div className="w-full md:w-96 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         {book.status === BookStatus.Dropped ? 'Motivo do Abandono / Observações' : 'Observação do Leitor'}
                      </h4>
                      {editingObsId !== book.id && (
                        <button 
                          onClick={() => handleStartEditObs(book)}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all active:scale-90"
                          title="Editar observação"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {editingObsId === book.id ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <textarea 
                          autoFocus
                          value={obsInput}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setObsInput(e.target.value)}
                          placeholder={book.status === BookStatus.Dropped ? "O que te fez desistir dessa leitura? Deixe registrado..." : "O que você achou dessa obra?"}
                          className="w-full min-h-[120px] bg-slate-50 dark:bg-slate-800/50 border border-primary/20 rounded-2xl p-4 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-primary transition-all resize-none shadow-inner"
                        />
                        <div className="flex gap-2">
                          <button 
                            disabled={isSaving}
                            onClick={() => handleSaveObs(book)}
                            className="flex-1 bg-primary text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50"
                          >
                            {isSaving ? 'Salvando...' : 'Confirmar'}
                          </button>
                          <button 
                            disabled={isSaving}
                            onClick={() => setEditingObsId(null)}
                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleStartEditObs(book)}
                        className="min-h-[100px] p-5 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800/50 text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic font-medium cursor-pointer hover:border-primary/30 transition-all"
                      >
                        {book.historyObservation ? (
                          <p className="line-clamp-4">{book.historyObservation}</p>
                        ) : (
                          <div className="h-full flex items-center justify-center py-4">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            <span>Adicionar observação...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas de Gestão */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => onEdit(book)}
                     className="p-2.5 rounded-xl text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-primary transition-all active:scale-95 border border-transparent hover:border-slate-100 shadow-none hover:shadow-md"
                   >
                     <PencilIcon className="h-4 w-4" />
                   </button>
                   <button 
                     onClick={() => onDelete(book)}
                     className="p-2.5 rounded-xl text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-red-500 transition-all active:scale-95 border border-transparent hover:border-slate-100 shadow-none hover:shadow-md"
                   >
                     <TrashIcon className="h-4 w-4" />
                   </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
             <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 dark:border-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
             </div>
             <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-2 font-serif italic">Nenhum registro encontrado</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto">Tente ajustar seus filtros para encontrar o que procura.</p>
             <button 
                onClick={() => { 
                    setStatusFilter('all'); 
                    setSearchTerm(''); 
                    setSelectedGenres([]); 
                    setSelectedTags([]); 
                    setGenreSearch(''); 
                    setFormatFilter('all');
                    setLoanFilter('all');
                }}
                className="mt-8 px-8 py-3 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95"
            >
                Limpar Filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
