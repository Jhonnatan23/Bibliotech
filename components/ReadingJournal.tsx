import { logger } from '../services/monitoring';
import React, { useState, useMemo, useEffect } from 'react';
import type { Book, Profile } from '../types';
import { BookStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Calendar, 
  ChevronDown, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Smile, 
  Check, 
  Sparkles, 
  Clock, 
  PenTool,
  ListFilter,
  X,
  BookMarked
} from 'lucide-react';

export interface JournalEntry {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  date: string;
  currentPage: number;
  totalPages: number;
  thoughts: string;
  mood: string;
}

interface ReadingJournalProps {
  books: Book[];
  profile: Profile | null;
  onUpdateBook: (book: Book) => Promise<void>;
  preselectedBookId?: string | null;
  onClosePreselect?: () => void;
}

const MOODS = [
  { emoji: '🎯', label: 'Inspirado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
  { emoji: '🤯', label: 'Impressionado', color: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30' },
  { emoji: '🤔', label: 'Pensativo', color: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30' },
  { emoji: '⚡', label: 'Empolgado', color: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' },
  { emoji: '🕯️', label: 'Reflexivo', color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700' },
  { emoji: '😴', label: 'Entediado', color: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-800' },
  { emoji: '😢', label: 'Triste', color: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30' },
  { emoji: '😍', label: 'Apaixonado', color: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' },
];

export const ReadingJournal: React.FC<ReadingJournalProps> = ({
  books,
  profile,
  onUpdateBook,
  preselectedBookId,
  onClosePreselect
}) => {
  const userId = profile?.id || 'anonymous';
  const localStorageKey = `biblio_tech_journal_entries_${userId}`;

  // State for Journal Entries
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [currentPageInput, setCurrentPageInput] = useState<number>(0);
  const [thoughtsText, setThoughtsText] = useState('');
  const [selectedMood, setSelectedMood] = useState(MOODS[2].label); // Default: Pensativo

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBookId, setFilterBookId] = useState('all');

  // Currently reading books to choose from
  const activeBooks = useMemo(() => {
    return books.filter(b => b.status === BookStatus.Reading);
  }, [books]);

  // All books that could be chosen (excluding wishlist)
  const selectableBooks = useMemo(() => {
    return books.filter(b => b.status !== BookStatus.Wishlist);
  }, [books]);

  // Selected Book Object
  const selectedBook = useMemo(() => {
    return books.find(b => b.id === selectedBookId);
  }, [selectedBookId, books]);

  // Handle book selection change
  useEffect(() => {
    if (selectedBook) {
      setCurrentPageInput(selectedBook.currentPage || 0);
    }
  }, [selectedBookId, selectedBook]);

  // Pre-select book if requested
  useEffect(() => {
    if (preselectedBookId) {
      setSelectedBookId(preselectedBookId);
      setIsFormOpen(true);
      if (onClosePreselect) onClosePreselect();
    }
  }, [preselectedBookId]);

  // Sync entries to localstorage
  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(entries));
    } catch (e) {
      logger.error('Failed to save journal entries:', e);
    }
  }, [entries, localStorageKey]);

  // Filtered Entries for Display
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    if (filterBookId !== 'all') {
      result = result.filter(e => e.bookId === filterBookId);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(e => 
        e.bookTitle.toLowerCase().includes(term) ||
        e.bookAuthor.toLowerCase().includes(term) ||
        e.thoughts.toLowerCase().includes(term) ||
        e.mood.toLowerCase().includes(term)
      );
    }

    // Sort entries by date desc (newest first)
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, filterBookId, searchTerm]);

  // Available books that have journal entries (for filtering list)
  const booksWithEntries = useMemo(() => {
    const ids = new Set(entries.map(e => e.bookId));
    return books.filter(b => ids.has(b.id));
  }, [entries, books]);

  const handleOpenNewForm = () => {
    setEditingEntryId(null);
    setThoughtsText('');
    setSelectedMood(MOODS[2].label);
    
    if (activeBooks.length > 0) {
      setSelectedBookId(activeBooks[0].id);
      setCurrentPageInput(activeBooks[0].currentPage || 0);
    } else if (selectableBooks.length > 0) {
      setSelectedBookId(selectableBooks[0].id);
      setCurrentPageInput(selectableBooks[0].currentPage || 0);
    } else {
      setSelectedBookId('');
      setCurrentPageInput(0);
    }
    
    setIsFormOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setSelectedBookId(entry.bookId);
    setCurrentPageInput(entry.currentPage);
    setThoughtsText(entry.thoughts);
    setSelectedMood(entry.mood);
    setIsFormOpen(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Deseja realmente excluir esta anotação do seu diário?')) {
      setEntries(prev => prev.filter(e => e.id !== entryId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBookId) {
      alert('Por favor, selecione um livro.');
      return;
    }

    if (!thoughtsText.trim()) {
      alert('Por favor, escreva seus pensamentos.');
      return;
    }

    const currentBook = books.find(b => b.id === selectedBookId);
    if (!currentBook) return;

    // Create or update entry
    if (editingEntryId) {
      setEntries(prev => prev.map(entry => {
        if (entry.id === editingEntryId) {
          return {
            ...entry,
            currentPage: currentPageInput,
            thoughts: thoughtsText,
            mood: selectedMood,
            date: new Date().toISOString()
          };
        }
        return entry;
      }));
    } else {
      const newEntry: JournalEntry = {
        id: `journal_${Date.now()}`,
        userId,
        bookId: selectedBookId,
        bookTitle: currentBook.title,
        bookAuthor: currentBook.author,
        date: new Date().toISOString(),
        currentPage: currentPageInput,
        totalPages: currentBook.pages,
        thoughts: thoughtsText,
        mood: selectedMood
      };
      setEntries(prev => [newEntry, ...prev]);
    }

    // Sync progress to the book model if user advanced their pages read
    if (currentPageInput !== currentBook.currentPage) {
      const updatedBook: Book = {
        ...currentBook,
        currentPage: Math.min(currentPageInput, currentBook.pages)
      };
      
      // If book reached total pages, mark it as read!
      if (currentPageInput >= currentBook.pages && currentBook.pages > 0 && updatedBook.status !== BookStatus.Read) {
        updatedBook.status = BookStatus.Read;
        updatedBook.dateFinished = new Date().toISOString().split('T')[0];
      }
      
      await onUpdateBook(updatedBook);
    }

    setIsFormOpen(false);
    setEditingEntryId(null);
    setThoughtsText('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 space-y-6 md:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <PenTool className="h-5 w-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Estúdio Criativo</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Diário de Leitura</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Guarde citações importantes, sentimentos e memórias dos livros que você lê.</p>
        </div>
        
        <button
          onClick={handleOpenNewForm}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-tertiary text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-primary/20 transition-all hover:scale-102 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Nova Anotação
        </button>
      </div>

      {/* Main Grid: Filters + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Filters Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft space-y-6 sticky top-24">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <ListFilter className="h-4 w-4" /> Filtros & Busca
            </h2>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar no diário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-150 dark:border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold outline-none focus:border-primary transition-colors"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Book Filter Select */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Filtrar por Obra</label>
              <div className="relative">
                <select
                  value={filterBookId}
                  onChange={(e) => setFilterBookId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-150 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold appearance-none outline-none focus:border-primary transition-colors pr-10"
                >
                  <option value="all">📚 Todos os Livros ({entries.length})</option>
                  {booksWithEntries.map(b => (
                    <option key={b.id} value={b.id}>
                      📖 {b.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Summary statistics */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Total de Pensamentos:</span>
                <span className="font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{entries.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Obras anotadas:</span>
                <span className="font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{booksWithEntries.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline / Annotations List */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredEntries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 rounded-[2rem] text-center shadow-soft flex flex-col items-center justify-center gap-4"
              >
                <div className="p-4 bg-primary/5 rounded-full text-primary">
                  <PenTool className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Nenhum registro encontrado</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1">
                    {searchTerm || filterBookId !== 'all' 
                      ? "Experimente mudar os filtros ou limpar sua busca para ver outras anotações."
                      : "Seu diário está em branco! Clique em 'Nova Anotação' acima para guardar seu primeiro pensamento literário."}
                  </p>
                </div>
                {!searchTerm && filterBookId === 'all' && (
                  <button
                    onClick={handleOpenNewForm}
                    className="mt-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Começar Diário
                  </button>
                )}
              </motion.div>
            ) : (
              filteredEntries.map((entry, index) => {
                const moodObj = MOODS.find(m => m.label === entry.mood);
                const progressPercent = entry.totalPages > 0 ? (entry.currentPage / entry.totalPages) * 100 : 0;
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-lg transition-all group relative overflow-hidden"
                  >
                    {/* Visual left accent bar matching the mood color */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      moodObj?.emoji === '🎯' ? 'bg-emerald-500' :
                      moodObj?.emoji === '🤯' ? 'bg-purple-500' :
                      moodObj?.emoji === '🤔' ? 'bg-blue-500' :
                      moodObj?.emoji === '⚡' ? 'bg-amber-500' :
                      moodObj?.emoji === '😍' ? 'bg-rose-500' :
                      moodObj?.emoji === '😢' ? 'bg-sky-400' :
                      'bg-slate-400'
                    }`} />

                    <div className="flex flex-col gap-4">
                      {/* Meta information row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800/40 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-slate-100/50 dark:border-slate-700">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-slate-100/50 dark:border-slate-700">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-2 text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar anotação"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                            title="Deletar anotação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Book info & Reading progress */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-950 dark:text-slate-50 font-serif leading-tight group-hover:text-primary transition-colors">
                          {entry.bookTitle}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none">
                          por {entry.bookAuthor}
                        </p>
                        
                        {/* Progress tag */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <span className="bg-blue-50/50 dark:bg-blue-900/10 text-primary text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-blue-100/50 dark:border-blue-800/40">
                            📖 Pág. {entry.currentPage} de {entry.totalPages} ({progressPercent.toFixed(0)}%)
                          </span>
                          
                          {moodObj && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border flex items-center gap-1 ${moodObj.color}`}>
                              <span>{moodObj.emoji}</span> {moodObj.label}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Annotation Content */}
                      <div className="pt-2">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line bg-slate-50/40 dark:bg-slate-900/20 p-4 rounded-2xl border border-slate-100/30 dark:border-slate-800/30 font-serif italic">
                          "{entry.thoughts}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slide-over or Modal form for Create/Edit Entry */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl relative"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest flex items-center gap-2">
                    <PenTool className="h-4.5 w-4.5 text-primary" />
                    {editingEntryId ? 'Editar Anotação' : 'Novo Pensamento'}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    Registre seu momento de leitura
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Select Book */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Qual livro você está lendo?</label>
                  <div className="relative">
                    <select
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      disabled={!!editingEntryId} // Prevent changing book during edit to preserve historical integrity
                      className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-150 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs font-bold appearance-none outline-none focus:border-primary transition-colors pr-10 disabled:opacity-60"
                    >
                      {activeBooks.length > 0 && (
                        <optgroup label="Lendo Atualmente">
                          {activeBooks.map(b => (
                            <option key={b.id} value={b.id}>📖 {b.title} ({b.currentPage} / {b.pages} pág)</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Minha Estante">
                        {selectableBooks.filter(b => b.status !== BookStatus.Reading).map(b => (
                          <option key={b.id} value={b.id}>📘 {b.title} ({b.currentPage} / {b.pages} pág)</option>
                        ))}
                      </optgroup>
                    </select>
                    {!editingEntryId && <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />}
                  </div>
                </div>

                {/* Progress Tracking Sync */}
                {selectedBook && (
                  <div className="bg-slate-50/60 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-150/50 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Progresso atual da leitura</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Página atual do livro: <span className="font-black text-slate-950 dark:text-slate-50">{selectedBook.currentPage}</span> de <span className="font-bold">{selectedBook.pages}</span> ({selectedBook.pages > 0 ? ((selectedBook.currentPage || 0) / selectedBook.pages * 100).toFixed(0) : 0}%)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label htmlFor="currentPageInput" className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Estou na pág:</label>
                      <input
                        id="currentPageInput"
                        type="number"
                        min="0"
                        max={selectedBook.pages}
                        value={currentPageInput}
                        onChange={(e) => setCurrentPageInput(Math.min(parseInt(e.target.value) || 0, selectedBook.pages))}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2 text-xs font-black text-center text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                {/* Select Mood */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Smile className="h-3.5 w-3.5" /> Como este trecho faz você se sentir?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MOODS.map(m => {
                      const isSelected = selectedMood === m.label;
                      return (
                        <button
                          key={m.label}
                          type="button"
                          onClick={() => setSelectedMood(m.label)}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all active:scale-95 ${
                            isSelected 
                              ? 'bg-primary border-primary text-white dark:text-white shadow-md shadow-primary/10 scale-102' 
                              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="text-sm">{m.emoji}</span>
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Thoughts Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Escreva seus pensamentos ou citações</label>
                  <textarea
                    rows={4}
                    value={thoughtsText}
                    onChange={(e) => setThoughtsText(e.target.value)}
                    placeholder="Adicione um parágrafo que te marcou, suas teorias sobre a história ou uma reflexão pessoal..."
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-150 dark:border-slate-700/80 rounded-2xl p-4 text-xs font-semibold font-serif leading-relaxed italic placeholder:not-italic outline-none focus:border-primary transition-colors shadow-inner"
                  />
                </div>

                {/* Submit button */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-tertiary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-primary/20 transition-all hover:scale-102 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Check className="h-4.5 w-4.5" />
                    {editingEntryId ? 'Atualizar Registro' : 'Salvar no Diário'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-4 rounded-2xl border border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-600 text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Voltar
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
