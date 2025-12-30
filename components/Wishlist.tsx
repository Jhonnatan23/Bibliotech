
import React, { useState, useMemo } from 'react';
import type { Book } from '../types';
import { WishlistItem } from './WishlistItem';
import { PlusIcon } from './Icons';

interface WishlistProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onMoveToShelf: (book: Book) => void;
  onAddWishlistItem: () => void;
}

export const Wishlist: React.FC<WishlistProps> = ({ books, onEdit, onDelete, onMoveToShelf, onAddWishlistItem }) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold font-serif text-primary">Lista de Desejos ({filteredBooks.length})</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-auto flex-grow">
            <input
              type="text"
              placeholder="Pesquisar por título ou autor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-secondary rounded-full py-2 px-4 text-text-main placeholder:text-text-secondary focus:ring-primary focus:border-primary"
            />
          </div>
          <button
              onClick={onAddWishlistItem}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-primary text-background font-bold hover:bg-secondary transition-colors duration-300 flex items-center gap-2"
          >
              <PlusIcon className="h-5 w-5" />
              Adicionar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredBooks.length > 0 ? (
          filteredBooks.map(book => (
            <WishlistItem 
              key={book.id} 
              book={book} 
              onEdit={onEdit} 
              onDelete={onDelete}
              onMoveToShelf={onMoveToShelf}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-surface rounded-lg">
            <p className="text-text-secondary">Sua lista de desejos está vazia. Adicione um novo livro para começar!</p>
          </div>
        )}
      </div>
    </div>
  );
};
