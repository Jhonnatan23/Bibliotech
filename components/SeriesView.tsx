
import React, { useMemo, useState, useEffect } from 'react';
import type { Book, Profile, Series } from '../types';
import { BookStatus, STATUS_COLORS, STATUS_CONFIGS } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon, BookOpenIcon, CheckIcon } from './Icons';
import { dbService } from '../services/database';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationModal } from './ConfirmationModal';

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
  const [editingSeries, setEditingSeries] = useState<SeriesGroup | null>(null);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesTotal, setNewSeriesTotal] = useState('');
  const [editingSeriesName, setEditingSeriesName] = useState('');
  const [editingSeriesTotal, setEditingSeriesTotal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom states for filtering and searching series
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  
  // Clean states for volume prompt modal bypass
  const [selectedBookToLink, setSelectedBookToLink] = useState<Book | null>(null);
  const [volumeToLink, setVolumeToLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<{ id?: string; name: string; books: Book[] } | null>(null);

  const handleStartLinkForVolume = (group: SeriesGroup, volNum: number) => {
    setIsAddingBooks(group);
    setVolumeToLink(volNum.toString());
    setSelectedBookToLink(null);
    setSearchTerm('');
  };

  useEffect(() => {
    loadSeries();
  }, []);

  useEffect(() => {
    if (!isAddingBooks) {
      setSearchTerm('');
      setSelectedBookToLink(null);
      setVolumeToLink('');
      setLinkError(null);
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

  const filteredGroups = useMemo(() => {
    let result = seriesGroups;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(g => g.name.toLowerCase().includes(q));
    }

    // Tab filter
    if (activeFilter === 'completed') {
      result = result.filter(g => g.totalVolumes ? (g.books.length >= g.totalVolumes && g.completedCount === g.totalVolumes) : false);
    } else if (activeFilter === 'in_progress') {
      result = result.filter(g => !g.totalVolumes || (g.books.length < g.totalVolumes || g.completedCount < g.totalVolumes));
    }

    return result;
  }, [seriesGroups, searchQuery, activeFilter]);

  const handleCreateSeries = async () => {
    if (!newSeriesName.trim()) {
      alert("O campo 'Nome da Coleção' é obrigatório.");
      return;
    }
    if (!newSeriesTotal.trim()) {
      alert("O campo 'Total de Edições' é obrigatório.");
      return;
    }

    const totalVolumes = parseInt(newSeriesTotal, 10);
    if (isNaN(totalVolumes) || totalVolumes < 1) {
      alert("O campo 'Total de Edições' deve aceitar apenas números inteiros positivos maiores que zero (mínimo: 1).");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("[SeriesView] Criando nova saga:", newSeriesName);
      await dbService.saveSeries({
        name: newSeriesName.trim(),
        total_volumes: totalVolumes
      });
      
      setNewSeriesName('');
      setNewSeriesTotal('');
      setIsCreating(false);
      
      await loadSeries();
      
      if (onRefresh) {
        await onRefresh();
      }
      
      alert('Coleção criada com sucesso!');
    } catch (e: any) {
      console.error("[SeriesView] Falha ao criar saga:", e);
      const detail = e.message || JSON.stringify(e);
      alert(`Erro ao criar coleção: ${detail}\n\nNota: Verifique se você executou o script SQL no Supabase.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSeries = (id: string | undefined, name: string, booksInGroup: Book[]) => {
    setSeriesToDelete({ id, name, books: booksInGroup });
  };

  const handleConfirmDeleteSeries = async () => {
    if (!seriesToDelete) return;
    const { id, name, books: booksInGroup } = seriesToDelete;
    setSeriesToDelete(null);
    setIsSubmitting(true);
    try {
      if (id) {
        await dbService.deleteSeries(id);
      }
      
      // Unlink all books in this group
      for (const book of booksInGroup) {
        await onUpdateBook({
          ...book,
          series: undefined,
          seriesId: undefined,
          volume: undefined
        });
      }
      
      await loadSeries();
      
      if (onRefresh) {
        await onRefresh();
      }
      
      alert('Coleção excluída com sucesso!');
    } catch (e: any) {
      console.error("[SeriesView] Falha ao excluir coleção:", e);
      alert(`Erro ao excluir coleção: ${e.message || JSON.stringify(e)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditSeries = (group: SeriesGroup) => {
    setEditingSeries(group);
    setEditingSeriesName(group.name);
    setEditingSeriesTotal(group.totalVolumes ? group.totalVolumes.toString() : '');
  };

  const handleSaveEditSeries = async () => {
    if (!editingSeries) return;

    if (!editingSeriesName.trim()) {
      alert("O campo 'Nome da Coleção' é obrigatório.");
      return;
    }
    if (!editingSeriesTotal.trim()) {
      alert("O campo 'Total de Edições' é obrigatório.");
      return;
    }

    const totalVolumes = parseInt(editingSeriesTotal, 10);
    if (isNaN(totalVolumes) || totalVolumes < 1) {
      alert("O campo 'Total de Edições' deve aceitar apenas números inteiros positivos maiores que zero (mínimo: 1).");
      return;
    }

    const maxVolumeInSeries = editingSeries.books.length > 0 
      ? Math.max(...editingSeries.books.map(b => b.volume || 0))
      : 0;

    if (maxVolumeInSeries > totalVolumes) {
      alert(`Você não pode alterar o total de edições para ${totalVolumes} porque existem livros cadastrados com o volume ${maxVolumeInSeries} nessa coleção.`);
      return;
    }

    setIsSubmitting(true);
    try {
      let seriesId = editingSeries.id;
      
      if (!seriesId) {
        // If it's an ad-hoc series, create a new series entry in the database.
        const newSeriesId = crypto.randomUUID();
        console.log("[SeriesView] Criando série formal para grupo ad-hoc:", editingSeriesName, newSeriesId);
        await dbService.saveSeries({
          id: newSeriesId,
          name: editingSeriesName.trim(),
          total_volumes: totalVolumes
        });
        seriesId = newSeriesId;
      } else {
        console.log("[SeriesView] Atualizando saga:", seriesId, editingSeriesName);
        await dbService.saveSeries({
          id: seriesId,
          name: editingSeriesName.trim(),
          total_volumes: totalVolumes
        });
      }

      // Update all books in this collection to reference the updated name and the seriesId
      for (const book of editingSeries.books) {
        await onUpdateBook({
          ...book,
          series: editingSeriesName.trim(),
          seriesId: seriesId
        });
      }

      setEditingSeries(null);
      setEditingSeriesName('');
      setEditingSeriesTotal('');
      
      await loadSeries();
      
      if (onRefresh) {
        await onRefresh();
      }
      
      alert('Coleção atualizada com sucesso!');
    } catch (e: any) {
      console.error("[SeriesView] Falha ao atualizar coleção:", e);
      alert(`Erro ao atualizar coleção: ${e.message || JSON.stringify(e)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectBookToLink = (book: Book, group: SeriesGroup) => {
    const lastVolume = group.books.length > 0 
        ? Math.max(...group.books.map(b => b.volume || 0))
        : 0;
    const suggestedVolume = lastVolume + 1;
    
    setSelectedBookToLink(book);
    setVolumeToLink(suggestedVolume.toString());
    setLinkError(null);
  };

  const handleConfirmLink = async () => {
    if (!selectedBookToLink || !isAddingBooks) return;

    const volNum = parseInt(volumeToLink, 10);
    if (isNaN(volNum) || volNum < 1) {
      setLinkError("Número de volume inválido (deve ser um número inteiro positivo maior que zero)");
      return;
    }

    // RN05 - Limite do Número da Edição
    if (isAddingBooks.totalVolumes && volNum > isAddingBooks.totalVolumes) {
      setLinkError(`O número da edição não pode ser maior do que o total de edições da coleção (Máx: ${isAddingBooks.totalVolumes}).`);
      return;
    }

    // RN06 - Unicidade de Volume
    const isDuplicate = isAddingBooks.books.some(b => b.volume === volNum);
    if (isDuplicate) {
      setLinkError(`Já existe um livro cadastrado com o número de edição ${volNum} na coleção "${isAddingBooks.name}".`);
      return;
    }

    setIsSubmitting(true);
    try {
        const updatedBook = {
            ...selectedBookToLink,
            series: isAddingBooks.name,
            volume: volNum,
            seriesId: isAddingBooks.id || undefined // Garante que seja de fato a ID se for uma coleção cadastrada
        };

        console.log("[SeriesView] Chamando onUpdateBook para vincular:", { bookId: updatedBook.id, seriesId: updatedBook.seriesId });
        await onUpdateBook(updatedBook);
        
        await loadSeries();
        setIsAddingBooks(null);
        setSelectedBookToLink(null);
        setVolumeToLink('');
        setSearchTerm('');
        
        alert("Livro vinculado com sucesso!");
    } catch (e: any) {
        console.error("[SeriesView] Erro fatal ao vincular livro:", e);
        setLinkError(`Erro ao vincular livro: ${e.message || JSON.stringify(e)}`);
    } finally {
        setIsSubmitting(false);
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
            Coleções & Séries
            <span className="text-primary/50 text-xl font-sans">({seriesGroups.length})</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1 uppercase tracking-widest text-[10px]">
            Organize suas coleções, complete suas sequências e visualize seu progresso de leitura.
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
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
            className="btn-primary flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <PlusIcon className="h-4 w-4" />
            Nova Coleção
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros de Coleções */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-3 rounded-[2rem] border border-slate-100 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar coleção pelo nome..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-primary/40 outline-none rounded-xl pl-11 pr-10 py-2.5 font-bold text-xs transition-all text-slate-900 dark:text-white"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            <MagnifyingGlassIcon className="h-4 w-4" />
          </div>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/30'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Todas ({seriesGroups.length})
          </button>
          <button
            onClick={() => setActiveFilter('in_progress')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeFilter === 'in_progress'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/30'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Em Andamento ({seriesGroups.filter(g => !g.totalVolumes || (g.books.length < g.totalVolumes || g.completedCount < g.totalVolumes)).length})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeFilter === 'completed'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/30'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Completas ({seriesGroups.filter(g => g.totalVolumes ? (g.books.length >= g.totalVolumes && g.completedCount === g.totalVolumes) : false).length})
          </button>
        </div>
      </div>

      {isCreating && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-primary/20 shadow-xl animate-in slide-in-from-top duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black font-serif italic text-slate-900 dark:text-white">Definir Nova Coleção</h3>
                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-red-500"><XMarkIcon className="h-6 w-6" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nome da Coleção *</label>
                    <input 
                        type="text" 
                        value={newSeriesName}
                        onChange={(e) => setNewSeriesName(e.target.value)}
                        placeholder="Ex: Batman - Ano Um, Preacher, X-Men..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Total de Edições *</label>
                    <input 
                        type="number" 
                        min="1"
                        value={newSeriesTotal}
                        onChange={(e) => setNewSeriesTotal(e.target.value)}
                        placeholder="Ex: 4"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold text-center text-slate-900 dark:text-white"
                    />
                  </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                  <button onClick={() => setIsCreating(false)} className="px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Cancelar</button>
                  <button 
                    onClick={handleCreateSeries}
                    disabled={isSubmitting || !newSeriesName.trim() || !newSeriesTotal.trim()}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Salvando...' : 'Confirmar e Criar'}
                  </button>
              </div>
          </div>
      )}

      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {filteredGroups.map((group) => {
            const ownedPercent = group.totalVolumes ? Math.min(100, (group.books.length / group.totalVolumes) * 100) : 0;
            const readPercent = group.totalVolumes ? Math.min(100, (group.completedCount / group.totalVolumes) * 100) : (group.books.length > 0 ? (group.completedCount / group.books.length) * 100 : 0);
            const isCompleted = group.totalVolumes ? (group.books.length >= group.totalVolumes && group.completedCount === group.totalVolumes) : false;

            return (
              <div key={group.name} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft overflow-hidden group/card hover:border-primary/20 transition-all">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif italic">{group.name}</h3>
                          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl">
                            <button onClick={() => handleStartEditSeries(group)} className="text-slate-400 hover:text-primary transition-colors p-1" title="Editar coleção">
                                <PencilIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteSeries(group.id, group.name, group.books)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Excluir coleção">
                                <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {isCompleted ? 'Coleção Completa 🎉' : 'Em Andamento'}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {group.books.length} volumes {group.totalVolumes ? `de ${group.totalVolumes}` : ''} • {group.completedCount} lidos
                        </p>
                      </div>

                      {/* Progress bar visualizers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-full max-w-xl">
                        {group.totalVolumes && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estante (Adquiridos)</span>
                              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400">{group.books.length} de {group.totalVolumes} ({Math.round(ownedPercent)}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${ownedPercent}%` }} />
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Leitura (Lidos)</span>
                            <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400">
                              {group.completedCount} de {group.totalVolumes || group.books.length} ({Math.round(readPercent)}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 dark:bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${readPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2.5 items-center w-full lg:w-auto self-stretch lg:self-center justify-start lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
                      <button 
                          onClick={() => setIsAddingBooks(group)}
                          className="w-full sm:w-auto bg-primary text-white border border-transparent px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10"
                      >
                          <PlusIcon className="h-4 w-4" />
                          Vincular Livro
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Régua de Volumes (Sequence Timeline Tracker) */}
                  <div className="bg-slate-50/50 dark:bg-slate-800/10 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5 text-indigo-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                        </svg>
                        Sequência Cronológica da Coleção
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                        <span className="text-emerald-500 font-extrabold mr-1.5">●</span>Lido
                        <span className="text-indigo-500 font-extrabold mx-1.5">●</span>Quero ler
                        <span className="text-amber-500 font-extrabold mx-1.5">●</span>Lendo
                        <span className="text-pink-500 font-extrabold mx-1.5">●</span>Wishlist
                        <span className="text-slate-300 font-extrabold mx-1.5">◌</span>Faltante
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 px-1 custom-scrollbar -mx-2">
                      {Array.from({ length: group.totalVolumes || (group.books.length > 0 ? Math.max(...group.books.map(b => b.volume || 0)) : 1) }).map((_, idx) => {
                        const volNum = idx + 1;
                        const book = group.books.find(b => b.volume === volNum);
                        
                        if (book) {
                          const isRead = book.status === BookStatus.Read;
                          const isReading = book.status === BookStatus.Reading;
                          const isToRead = book.status === BookStatus.TBR;
                          const isWishlist = book.status === BookStatus.Wishlist;
                          
                          let badgeStyle = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                          if (isRead) badgeStyle = "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/10 hover:bg-emerald-600";
                          else if (isReading) badgeStyle = "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/10 animate-pulse hover:bg-amber-600";
                          else if (isToRead) badgeStyle = "bg-indigo-500 text-white border-indigo-600 shadow-sm shadow-indigo-500/10 hover:bg-indigo-600";
                          else if (isWishlist) badgeStyle = "bg-pink-500 text-white border-pink-600 shadow-sm shadow-pink-500/10 hover:bg-pink-600";

                          return (
                            <button
                              key={`badge-${volNum}`}
                              onClick={() => onViewDetails(book)}
                              title={`Volume ${volNum}: ${book.title} (${STATUS_CONFIGS[book.status].label})`}
                              className={`w-9 h-9 rounded-full flex-shrink-0 border-2 font-black text-xs flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${badgeStyle}`}
                            >
                              {isRead ? (
                                <CheckIcon className="h-4 w-4 stroke-[3]" />
                              ) : volNum}
                            </button>
                          );
                        } else {
                          return (
                            <button
                              key={`badge-missing-${volNum}`}
                              onClick={() => handleStartLinkForVolume(group, volNum)}
                              title={`Volume ${volNum}: Faltando na coleção. Clique para vincular!`}
                              className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 text-slate-400 dark:text-slate-600 font-bold text-xs flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-transparent"
                            >
                              {volNum}
                            </button>
                          );
                        }
                      })}
                    </div>
                  </div>

                  {/* Livros Adquiridos */}
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                      Volumes Adquiridos ({group.books.length})
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {group.books.map((book) => (
                        <div 
                          key={book.id}
                          onClick={() => onViewDetails(book)}
                          className="relative p-5 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer bg-slate-50/30 dark:bg-slate-800/10 group/item flex flex-col justify-between h-[135px]"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div className="bg-white dark:bg-slate-800 w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
                                Vol {book.volume || '?'}
                              </div>
                              <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${STATUS_COLORS[STATUS_CONFIGS[book.status].color].bg} ${STATUS_COLORS[STATUS_CONFIGS[book.status].color].text} ${STATUS_COLORS[STATUS_CONFIGS[book.status].color].border}`}>
                                {STATUS_CONFIGS[book.status].label}
                              </div>
                            </div>
                            
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 leading-tight mb-0.5 group-hover/item:text-primary transition-colors">{book.title}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">de {book.author}</p>
                          </div>
                          
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity mt-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEdit(book); }}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-primary border border-slate-100 dark:border-slate-700 shadow-sm"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDelete(book); }}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-100 dark:border-slate-700 shadow-sm"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add/Link Volume Card at the end of the grid */}
                      <button 
                        onClick={() => setIsAddingBooks(group)}
                        className="p-5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/5 dark:hover:bg-indigo-950/5 transition-all text-center flex flex-col items-center justify-center h-[135px] group/add"
                      >
                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/add:bg-indigo-100 group-hover/add:text-indigo-500 w-9 h-9 rounded-full flex items-center justify-center transition-colors mb-2">
                          <PlusIcon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover/add:text-indigo-500 transition-colors">Vincular Livro</span>
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Adicionar mais edições</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-xl border border-slate-100 dark:border-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12a2.25 2.25 0 0 1 2.25-2.25h15A2.25 2.25 0 0 1 21.75 12v.75m-8.625-12.125L4.5 9.75h15l-3.375-9.125A2.25 2.25 0 0 0 13.875 0h-3.75a2.25 2.25 0 0 0-2.25 2.25Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75h19.5v8.25a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25v-8.25Z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-3 font-serif italic">Nenhuma Coleção Encontrada</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
            Nenhuma coleção ou série cadastrada corresponde ao seu filtro. Crie uma nova coleção ou mude os filtros para ver suas sagas.
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
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {selectedBookToLink ? 'Defina o volume do livro para a coleção' : 'Selecione livros da sua estante para adicionar à coleção'}
                            </p>
                        </div>
                        <button onClick={() => setIsAddingBooks(null)} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <XMarkIcon className="h-6 w-6 text-slate-400" />
                        </button>
                    </div>

                    {selectedBookToLink ? (
                        <div className="p-8 space-y-6">
                            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Livro Selecionado</h4>
                                <p className="text-lg font-black text-slate-900 dark:text-white font-serif">{selectedBookToLink.title}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedBookToLink.author}</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Número do Volume na Coleção *</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={volumeToLink}
                                    onChange={(e) => {
                                        setVolumeToLink(e.target.value);
                                        setLinkError(null);
                                    }}
                                    placeholder="Ex: 1"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 focus:border-primary/30 outline-none rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white text-center text-lg"
                                />
                                {linkError && (
                                    <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-wide ml-1 animate-in fade-in slide-in-from-top-1">
                                        {linkError}
                                    </p>
                                )}
                            </div>

                            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <button 
                                    onClick={() => setSelectedBookToLink(null)} 
                                    className="px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    Voltar
                                </button>
                                <button 
                                    onClick={handleConfirmLink}
                                    disabled={isSubmitting || !volumeToLink.trim()}
                                    className="bg-primary text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Salvando...' : 'Confirmar e Vincular'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
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
                                                onClick={() => isAddingBooks && handleSelectBookToLink(book, isAddingBooks)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        isAddingBooks && handleSelectBookToLink(book, isAddingBooks);
                                                    }
                                                }}
                                                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group cursor-pointer"
                                            >
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-primary transition-colors">{book.title}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{book.author}</p>
                                                    {book.series && (
                                                        <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                                            Série Atual: {book.series}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity border border-slate-100 dark:border-slate-700">
                                                    <PlusIcon className="h-4 w-4 text-primary" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <p className="text-sm font-bold text-slate-400 italic">Nenhum livro disponível para vincular encontrado na sua estante.</p>
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
                        </>
                    )}
                </motion.div>
            </div>
        )}

        {editingSeries && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingSeries(null)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-8"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-black font-serif italic text-slate-900 dark:text-white">Editar Coleção</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Altere as configurações de sua coleção</p>
                        </div>
                        <button onClick={() => setEditingSeries(null)} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <XMarkIcon className="h-6 w-6 text-slate-400" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nome da Coleção *</label>
                            <input 
                                type="text" 
                                value={editingSeriesName}
                                onChange={(e) => setEditingSeriesName(e.target.value)}
                                placeholder="Ex: Batman - Ano Um, Preacher, X-Men..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Total de Edições *</label>
                            <input 
                                type="number" 
                                min="1"
                                value={editingSeriesTotal}
                                onChange={(e) => setEditingSeriesTotal(e.target.value)}
                                placeholder="Ex: 4"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none focus:border-primary font-bold text-slate-900 dark:text-white text-center"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <button onClick={() => setEditingSeries(null)} className="px-6 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                        <button 
                            onClick={handleSaveEditSeries}
                            disabled={isSubmitting || !editingSeriesName.trim() || !editingSeriesTotal.trim()}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={!!seriesToDelete}
        onClose={() => setSeriesToDelete(null)}
        onConfirm={handleConfirmDeleteSeries}
        title="Excluir Coleção"
        message={`Tem certeza que deseja excluir a coleção "${seriesToDelete?.name || ''}"? Os livros continuarão na estante, mas o vínculo e a meta de volumes serão removidos.`}
      />
    </div>
  );
});

