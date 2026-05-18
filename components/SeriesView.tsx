
import React, { useMemo, useState, useEffect } from 'react';
import type { Book, Profile, Series } from '../types';
import { BookStatus, STATUS_COLORS, STATUS_CONFIGS } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from './Icons';
import { dbService } from '../services/database';
import { motion, AnimatePresence } from 'motion/react';

interface SeriesViewProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onUpdateBook: (book: Book) => Promise<void>;
  onDelete: (book: Book) => void;
  onViewDetails: (book: Book) => void;
  onAddBook: () => void;
  onRefresh?: () => Promise<void>;
  profile: Profile | null;
}

interface SeriesGroup {
  id?: string;
  name: string;
  books: Book[];
  missingVolumes: number[];
  completedCount: number;
  totalVolumes?: number;
}

export const SeriesView: React.FC<SeriesViewProps> = React.memo(({ books, onEdit, onUpdateBook, onDelete, onViewDetails, onAddBook, onRefresh, profile }) => {
  const [definedSeries, setDefinedSeries] = useState<Series[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingBooks, setIsAddingBooks] = useState<SeriesGroup | null>(null);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesTotal, setNewSeriesTotal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSeries();
  }, []);

  useEffect(() => {
    if (!isAddingBooks) {
      setSearchTerm('');
    }
  }, [isAddingBooks]);

  const loadSeries = async () => {
    try {
      const data = await dbService.getAllSeries();
      setDefinedSeries(data);
    } catch (err) {
      console.error("Erro ao carregar séries no SeriesView:", err);
    }
  };

  const seriesGroups = useMemo(() => {
    // Map of series defined in the database
    const groupsById: Record<string, { books: Book[], name: string, totalVolumes?: number }> = {};
    definedSeries.forEach(s => {
      groupsById[s.id] = { books: [], name: s.name, totalVolumes: s.total_volumes };
    });

    // Map for ad-hoc series (books with a series name but no formal seriesId found)
    const adhocGroups: Record<string, { books: Book[], name: string }> = {};

    // Group books
    books.forEach(book => {
      const seriesName = book.series?.trim();
      const sId = book.seriesId;

      // 1. Try grouping by seriesId first
      if (sId && groupsById[sId]) {
        groupsById[sId].books.push(book);
      } 
      // 2. Otherwise try grouping by name
      else if (seriesName) {
        const nameLower = seriesName.toLowerCase();
        
        // Check if there is a defined series with this name
        const matchingDefined = definedSeries.find(s => s.name.toLowerCase() === nameLower);
        
        if (matchingDefined) {
          groupsById[matchingDefined.id].books.push(book);
        } else {
          if (!adhocGroups[nameLower]) {
            adhocGroups[nameLower] = { books: [], name: seriesName };
          }
          adhocGroups[nameLower].books.push(book);
        }
      }
    });

    // Combine both group types
    const combined = [
      ...Object.entries(groupsById).map(([id, data]) => ({
        id,
        name: data.name,
        books: data.books,
        totalVolumes: data.totalVolumes
      })),
      ...Object.entries(adhocGroups).map(([, data]) => ({
        id: undefined,
        name: data.name,
        books: data.books,
        totalVolumes: undefined
      }))
    ];

    // Remove empty ad-hoc groups (optional, but keeps UI clean)
    // Actually, keep empty defined series so user can add books to them
    const filtered = combined.filter(g => g.id || g.books.length > 0);

    return filtered.map((group) => {
      const seriesBooks = [...group.books].sort((a, b) => (a.volume || 0) - (b.volume || 0));
      
      const volumesPresent = seriesBooks
        .map(b => b.volume)
        .filter((v): v is number => v !== undefined);
        
      const missingVolumes: number[] = [];
      const maxVolumePresent = volumesPresent.length > 0 ? Math.max(...volumesPresent) : 0;
      const targetMax = group.totalVolumes || maxVolumePresent;

      if (targetMax > 0) {
        for (let i = 1; i <= targetMax; i++) {
          if (!volumesPresent.includes(i)) {
            missingVolumes.push(i);
          }
        }
      }

      const completedCount = seriesBooks.filter(b => b.status === BookStatus.Read).length;

      return {
        id: group.id,
        name: group.name,
        books: seriesBooks,
        missingVolumes,
        completedCount,
        totalVolumes: group.totalVolumes
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [books, definedSeries]);

  const handleCreateSeries = async () => {
    if (!newSeriesName.trim()) return;
    setIsSubmitting(true);
    try {
      console.log("[SeriesView] Criando nova saga:", newSeriesName);
      await dbService.saveSeries({
        name: newSeriesName.trim(),
        total_volumes: newSeriesTotal ? parseInt(newSeriesTotal, 10) : undefined
      });
      
      setNewSeriesName('');
      setNewSeriesTotal('');
      setIsCreating(false);
      
      await loadSeries();
      
      if (onRefresh) {
        await onRefresh();
      }
      
      alert('Saga criada com sucesso!');
    } catch (e: any) {
      console.error("[SeriesView] Falha ao criar saga:", e);
      const detail = e.message || JSON.stringify(e);
      alert(`Erro ao criar saga: ${detail}\n\nNota: Verifique se você executou o script SQL no Supabase.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSeries = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta série? Os livros continuarão na estante, mas o vínculo e meta de volumes serão removidos.')) return;
    try {
      await dbService.deleteSeries(id);
      await loadSeries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBookToSeries = async (book: Book, group: SeriesGroup) => {
    try {
        console.log(`[SeriesView] Tentando vincular livro "${book.title}" à série "${group.name}"`, { groupId: group.id });
        
        // Determinar volume sugerido
        const lastVolume = group.books.length > 0 
            ? Math.max(...group.books.map(b => b.volume || 0))
            : 0;
        const suggestedVolume = lastVolume + 1;
        
        const volume = prompt(`Qual o número do volume de "${book.title}" na série "${group.name}"?`, suggestedVolume.toString());
        
        if (volume === null) return;
        
        const volNum = parseInt(volume, 10);
        if (isNaN(volNum)) {
          alert("Número de volume inválido");
          return;
        }

        const updatedBook = {
            ...book,
            series: group.name,
            volume: volNum,
            seriesId: group.id || undefined // Garante que seja undefined se não houver ID de saga formal
        };

        console.log("[SeriesView] Chamando onUpdateBook para vincular:", { bookId: updatedBook.id, seriesId: updatedBook.seriesId });
        await onUpdateBook(updatedBook);
        
        await loadSeries();
        setIsAddingBooks(null);
        setSearchTerm('');
        
        alert("Livro vinculado com sucesso!");
    } catch (e: any) {
        console.error("[SeriesView] Erro fatal ao vincular livro:", e);
        const errorMsg = e.message || JSON.stringify(e);
        alert(`Erro ao vincular livro: ${errorMsg}`);
    }
  };

  const availableBooks = useMemo(() => {
    // Permitir vincular livros que não têm série OU que estão em uma série diferente da atual
    const base = books.filter(b => !b.series || (isAddingBooks && b.seriesId !== isAddingBooks.id && b.series !== isAddingBooks.name));
    if (!searchTerm.trim()) return base;
    const term = searchTerm.toLowerCase();
    return base.filter(b => 
      b.title.toLowerCase().includes(term) || 
      b.author.toLowerCase().includes(term)
    );
  }, [books, searchTerm, isAddingBooks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
            Séries & Sagas
            <span className="text-primary/50 text-xl font-sans">({seriesGroups.length})</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">Gerencie suas coleções e complete suas sequências.</p>
        </div>
        
        <div className="flex gap-3">
          {onRefresh && (
            <button 
                onClick={onRefresh}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all active:scale-95 shadow-sm"
                title="Sincronizar Dados"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </button>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <PlusIcon className="h-4 w-4" />
            Nova Saga
          </button>
        </div>
      </div>

      {isCreating && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-primary/20 shadow-xl animate-in slide-in-from-top duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black font-serif italic text-slate-900 dark:text-white">Definir Nova Série</h3>
                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-red-500"><XMarkIcon className="h-6 w-6" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nome da Série (Ex: Harry Potter, One Piece)</label>
                    <input 
                        type="text" 
                        value={newSeriesName}
                        onChange={(e) => setNewSeriesName(e.target.value)}
                        placeholder="Nome da saga..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Total de Volumes (Opcional)</label>
                    <input 
                        type="number" 
                        value={newSeriesTotal}
                        onChange={(e) => setNewSeriesTotal(e.target.value)}
                        placeholder="Ex: 7"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold text-center"
                    />
                  </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                  <button onClick={() => setIsCreating(false)} className="px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Cancelar</button>
                  <button 
                    onClick={handleCreateSeries}
                    disabled={isSubmitting || !newSeriesName.trim()}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Salvando...' : 'Confirmar e Criar'}
                  </button>
              </div>
          </div>
      )}

      {seriesGroups.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {seriesGroups.map((group) => (
            <div key={group.name} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft overflow-hidden group hover:border-primary/20 transition-all">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif italic">{group.name}</h3>
                        {group.id && (
                            <button onClick={() => handleDeleteSeries(group.id!)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Excluir metadados da série">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                      {group.books.length} volumes na estante {group.totalVolumes ? `de ${group.totalVolumes}` : ''} • {group.completedCount} lidos
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-center">
                    {group.missingVolumes.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                            Faltam: {group.missingVolumes.join(', ')}
                        </span>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsAddingBooks(group)}
                        className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-primary hover:border-primary transition-all flex items-center gap-2"
                    >
                        <PlusIcon className="h-3 w-3" />
                        Vincular Livro
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.books.map((book) => (
                    <div 
                      key={book.id}
                      onClick={() => onViewDetails(book)}
                      className="relative p-5 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-800/10 group/item"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="bg-white dark:bg-slate-800 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
                          {book.volume || '?'}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${STATUS_COLORS[STATUS_CONFIGS[book.status].color].bg} ${STATUS_COLORS[STATUS_CONFIGS[book.status].color].text} ${STATUS_COLORS[STATUS_CONFIGS[book.status].color].border}`}>
                          {STATUS_CONFIGS[book.status].label}
                        </div>
                      </div>
                      
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-1 group-hover/item:text-primary transition-colors">{book.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{book.author}</p>
                      
                      <div className="mt-4 flex items-center justify-end gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(book); }}
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-primary border border-slate-100 dark:border-slate-700 shadow-sm"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(book); }}
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-100 dark:border-slate-700 shadow-sm"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Missing Volume Placeholders */}
                  {group.missingVolumes.map(volNum => (
                    <div 
                      key={`missing-${volNum}`}
                      className="p-5 rounded-3xl border-2 border-dashed border-amber-200 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-900/5 flex flex-col items-center justify-center text-center opacity-60"
                    >
                       <div className="bg-amber-100 dark:bg-amber-900/40 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-amber-500 mb-3">
                          {volNum}
                        </div>
                        <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">Volume Faltante</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-xl border border-slate-100 dark:border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12a2.25 2.25 0 0 1 2.25-2.25h15A2.25 2.25 0 0 1 21.75 12v.75m-8.625-12.125L4.5 9.75h15l-3.375-9.125A2.25 2.25 0 0 0 13.875 0h-3.75a2.25 2.25 0 0 0-2.25 2.25Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75h19.5v8.25a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25v-8.25Z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-3 font-serif italic">Nenhuma Saga Identificada</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
            Crie uma saga ou adicione o nome da série e o volume ao cadastrar um livro para ativar a gestão de coleções.
          </p>
          <div className="flex gap-4 mt-10">
            <button 
                onClick={() => setIsCreating(true)}
                className="bg-white dark:bg-slate-800 text-primary border border-primary/20 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all active:scale-95 flex items-center gap-2 shadow-lg"
            >
                <PlusIcon className="h-4 w-4" />
                Criar Nova Saga
            </button>
            <button 
                onClick={onAddBook}
                className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-2"
            >
                <PlusIcon className="h-4 w-4" />
                Começar Coleção
            </button>
          </div>
        </div>
      )}

      {/* Modal Vincular Livros */}
      <AnimatePresence>
        {isAddingBooks && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAddingBooks(null)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
                >
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black font-serif italic text-slate-900 dark:text-white">Vincular à "{isAddingBooks.name}"</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Selecione livros da sua estante para adicionar à coleção</p>
                        </div>
                        <button onClick={() => setIsAddingBooks(null)} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <XMarkIcon className="h-6 w-6 text-slate-400" />
                        </button>
                    </div>

                    <div className="px-8 pt-6 pb-2">
                        <div className="relative">
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filtrar por nome ou autor..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 focus:border-primary/30 outline-none rounded-2xl px-5 py-4 font-bold text-sm transition-all"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-8 pt-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                        {availableBooks.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {availableBooks.map(book => (
                                    <div
                                        key={book.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => isAddingBooks && handleAddBookToSeries(book, isAddingBooks)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                isAddingBooks && handleAddBookToSeries(book, isAddingBooks);
                                            }
                                        }}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group cursor-pointer"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-primary transition-colors">{book.title}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{book.author}</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity border border-slate-100 dark:border-slate-700">
                                            <PlusIcon className="h-4 w-4 text-primary" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-sm font-bold text-slate-400 italic">Nenhum livro sem série encontrado na sua estante.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                        <button 
                            onClick={() => setIsAddingBooks(null)}
                            className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-slate-900 transition-all flex items-center gap-2"
                        >
                            Concluído
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
});

