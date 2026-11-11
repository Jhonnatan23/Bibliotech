
import React, { useState, useMemo } from 'react';
import type { Book } from '../types';
import { WishlistItem } from './WishlistItem';
import { PlusIcon, TagIcon } from './Icons';
import { EmptyState } from './EmptyState';

interface WishlistProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onDuplicate: (book: Book) => void;
  onMoveToShelf: (book: Book) => void;
  onAddWishlistItem: () => void;
}

export const Wishlist: React.FC<WishlistProps> = React.memo(({ books, onEdit, onDelete, onDuplicate, onMoveToShelf, onAddWishlistItem }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = useMemo(() => {
    const sortedBooks = [...books].sort((a, b) => a.title.localeCompare(b.title));
    if (!searchQuery) {
      return sortedBooks;
    }
    return sortedBooks.filter(book =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  const totalValue = useMemo(() => {
    return filteredBooks.reduce((acc, book) => acc + (book.estimatedPrice || 0), 0);
  }, [filteredBooks]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
        <div>
          <h2 className="text-4xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight italic">
            Lista de Desejos <span className="text-primary/40 text-2xl ml-2">({filteredBooks.length})</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mt-2 ml-1">✦ Sonhos em papel e tinta</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
          {/* Card de Valor Total */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 px-6 rounded-[2rem] shadow-xl flex items-center gap-4 group transition-all hover:border-primary/20">
             <div className="bg-pink-50 dark:bg-pink-900/20 p-2.5 rounded-xl border border-pink-100 dark:border-pink-800/50 text-pink-500">
                <TagIcon className="h-5 w-5" />
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Total Estimado</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
             </div>
          </div>

          <div className="relative flex-1 sm:w-80 group">
            <input
              type="text"
              placeholder="Pesquisar desejos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-4 pl-12 pr-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-lg"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <button
              onClick={onAddWishlistItem}
              className="px-8 py-4 rounded-full bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 dark:hover:bg-slate-50 dark:hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl shadow-primary/20"
          >
              <PlusIcon className="h-5 w-5" />
              Adicionar
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {filteredBooks.length > 0 ? (
          filteredBooks.map(book => (
            <WishlistItem 
              key={book.id} 
              book={book} 
              onEdit={onEdit} 
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onMoveToShelf={onMoveToShelf}
            />
          ))
        ) : (
          <EmptyState
            illustration="wishlist"
            title={searchQuery ? 'Nenhum desejo encontrado para sua busca' : 'Sua lista de desejos está vazia'}
            description={
              searchQuery
                ? `Não encontramos nenhum item correspondente a "${searchQuery}". Tente outro termo ou limpe a pesquisa.`
                : 'Que tal adicionar aquele livro especial que você está namorando há tempos ou planeja adquirir em breve?'
            }
            primaryAction={{
              label: searchQuery ? 'Limpar Busca' : 'Adicionar Primeiro Desejo',
              onClick: searchQuery ? () => setSearchQuery('') : onAddWishlistItem,
              icon: (
                <PlusIcon className="h-4 w-4" />
              ),
              'data-testid': 'wishlist-empty-cta',
            }}
            secondaryAction={
              searchQuery ? {
                label: 'Adicionar Novo Desejo',
                onClick: onAddWishlistItem,
                icon: <PlusIcon className="h-4 w-4" />,
              } : undefined
            }
          />
        )}
      </div>
    </div>
  );
});
