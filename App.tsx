
import React, { useState, useMemo } from 'react';
import { useBookData } from './hooks/useBookData';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AddBookModal } from './components/AddBookModal';
import { PlusIcon } from './components/Icons';
import type { Book, NewBook } from './types';
import { BookList } from './components/BookList';
import { ConfirmationModal } from './components/ConfirmationModal';
import { BookStatus } from './types';
import { Wishlist } from './components/Wishlist';

export default function App() {
  const { books, stats, currentlyReading, addBook, updateBook, deleteBook, dateFilter, setDateFilter } = useBookData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'dashboard' | 'list' | 'wishlist'>('dashboard');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<BookStatus | undefined>();

  const handleAddBook = (newBook: NewBook) => {
    addBook(newBook);
    setIsModalOpen(false);
    setEditingBook(null);
  };
  
  const handleUpdateBook = (updatedBook: Book) => {
    updateBook(updatedBook);
    setIsModalOpen(false);
    setEditingBook(null);
  };

  const handleMoveToShelf = (book: Book) => {
    updateBook({ ...book, status: BookStatus.TBR });
  };

  const handleConfirmDelete = () => {
    if (deletingBook) {
      deleteBook(deletingBook.id);
      setDeletingBook(null);
    }
  };

  const openAddModal = (defaultStatus?: BookStatus) => {
    setEditingBook(null);
    setDefaultStatusForModal(defaultStatus);
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };
  
  const openDeleteModal = (book: Book) => {
    setDeletingBook(book);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
    setDefaultStatusForModal(undefined);
  };

  const shelfBooks = useMemo(() => books.filter(book => book.status !== BookStatus.Wishlist), [books]);
  const wishlistBooks = useMemo(() => books.filter(book => book.status === BookStatus.Wishlist), [books]);

  const [isFading, setIsFading] = useState(false);

  const handleSetView = (newView: 'dashboard' | 'list' | 'wishlist') => {
    if (view !== newView) {
      setIsFading(true);
      setTimeout(() => {
        setView(newView);
        setIsFading(false);
      }, 200); // Reduzido ligeiramente para maior responsividade
    }
  };


  const renderContent = () => {
    switch(view) {
      case 'dashboard':
        return <Dashboard 
                  stats={stats} 
                  currentlyReading={currentlyReading} 
                  updateBook={updateBook}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter} 
                />;
      case 'list':
        return <BookList books={shelfBooks} onEdit={openEditModal} onDelete={openDeleteModal} />;
      case 'wishlist':
        return <Wishlist 
                  books={wishlistBooks} 
                  onEdit={openEditModal} 
                  onDelete={openDeleteModal} 
                  onMoveToShelf={handleMoveToShelf} 
                  onAddWishlistItem={() => openAddModal(BookStatus.Wishlist)}
                />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-main">
      <Header view={view} setView={handleSetView} />
      
      {/* Transição suave com Opacidade e Deslocamento Vertical */}
      <main className={`p-4 md:p-8 transition-all duration-300 ease-in-out transform ${
        isFading 
          ? 'opacity-0 -translate-y-2' 
          : 'opacity-100 translate-y-0'
      }`}>
        {renderContent()}
      </main>
      
      <button
        onClick={() => openAddModal()}
        className="fixed bottom-8 right-8 bg-primary text-background p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20 active:scale-95 z-40"
        aria-label="Adicionar novo livro"
      >
        <PlusIcon className="h-8 w-8" />
      </button>

      {isModalOpen && (
        <AddBookModal
          onClose={closeModal}
          onAddBook={handleAddBook}
          onUpdateBook={handleUpdateBook}
          bookToEdit={editingBook}
          defaultStatus={defaultStatusForModal}
          existingBooks={books}
        />
      )}

      {deletingBook && (
        <ConfirmationModal
          isOpen={!!deletingBook}
          onClose={() => setDeletingBook(null)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir o livro "${deletingBook.title}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}
