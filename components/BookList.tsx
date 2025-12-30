
import React, { useState, useMemo } from 'react';
import type { Book } from '../types';
import { BookStatus, GENRES } from '../types';
import { BookListItem } from './BookListItem';
import { XMarkIcon } from './Icons';

interface BookListProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

type FilterStatus = 'all' | BookStatus;
type SortOrder = 'title' | 'dateAdded';

export const BookList: React.FC<BookListProps> = ({ books, onEdit, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOrder>('dateAdded');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };

  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Ordenação inicial
    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    }

    // Filtrar por Status
    if (statusFilter !== 'all') {
      result = result.filter(book => book.status === statusFilter);
    }

    // Filtrar por Busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    }

    // Filtrar por Gêneros (Lógica: Deve conter pelo menos um dos gêneros selecionados)
    if (selectedGenres.length > 0) {
      result = result.filter(book => {
        const bookGenres = book.genre.split(',').map(g => g.trim().toLowerCase());
        return selectedGenres.some(sg => bookGenres.includes(sg.toLowerCase()));
      });
    }

    return result;
  }, [books, searchQuery, statusFilter, sortBy, selectedGenres]);

  const filterButtons = [
    { label: 'Todos', value: 'all' as FilterStatus },
    { label: 'Lendo', value: BookStatus.Reading as FilterStatus },
    { label: 'Lidos', value: BookStatus.Read as FilterStatus },
    { label: 'Quero Ler', value: BookStatus.TBR as FilterStatus },
  ];

  return (
    <div className="space-y-8">
      {/* Header e Busca */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">
            Minha Estante <span className="text-primary/50 text-xl ml-2">({filteredBooks.length})</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Gerencie seus livros físicos e digitais.</p>
        </div>
        
        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Título ou autor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Controles de Filtragem */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-soft space-y-6">
        {/* Status e Ordenação */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">Status:</span>
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  statusFilter === btn.value
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-primary/30'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ordenar:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOrder)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
            >
              <option value="dateAdded">Mais Recentes</option>
              <option value="title">Título (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filtro de Gêneros */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Filtrar Gêneros:</span>
              {selectedGenres.length > 0 && (
                <button 
                  onClick={() => setSelectedGenres([])}
                  className="text-[9px] font-bold text-primary uppercase tracking-wider hover:underline"
                >
                  Limpar todos
                </button>
              )}
            </div>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              {selectedGenres.length} selecionado(s)
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
            {GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    isSelected
                      ? 'bg-primary/10 text-primary border-primary/30 scale-95 shadow-inner'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <span className="mr-1">✓</span>}
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de Livros */}
      <div className="space-y-4">
        {filteredBooks.length > 0 ? (
          filteredBooks.map(book => (
            <BookListItem key={book.id} book={book} onEdit={onEdit} onDelete={onDelete} />
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Nenhum livro encontrado</h3>
            <p className="text-slate-400 mt-1 max-w-xs mx-auto">Tente ajustar sua busca ou mudar os filtros selecionados.</p>
            {(statusFilter !== 'all' || searchQuery !== '' || selectedGenres.length > 0) ? (
                <button 
                    onClick={() => { setStatusFilter('all'); setSearchQuery(''); setSelectedGenres([]); }}
                    className="mt-6 text-primary font-bold text-sm hover:underline"
                >
                    Limpar todos os filtros
                </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
