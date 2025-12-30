
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
import { BottomNav } from './components/BottomNav';

export default function App() {
  const { 
    books, 
    stats, 
    currentlyReading, 
    addBook, 
    updateBook, 
    deleteBook, 
    dateFilter, 
    setDateFilter,
    selectedYear,
    setSelectedYear,
    availableYears,
    customRange,
    setCustomRange 
  } = useBookData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'dashboard' | 'list' | 'wishlist'>('dashboard');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<BookStatus | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddBook = (newBook: NewBook) => {
    addBook(newBook);
    setIsModalOpen(false);
    setEditingBook(null);
    showToast(`"${newBook.title}" adicionado com sucesso!`);
  };
  
  const handleUpdateBook = (updatedBook: Book) => {
    updateBook(updatedBook);
    setIsModalOpen(false);
    setEditingBook(null);
    if (updatedBook.status === BookStatus.Read) {
        showToast(`Parabéns por concluir "${updatedBook.title}"!`);
    } else {
        showToast(`"${updatedBook.title}" atualizado.`);
    }
  };

  const openAddModal = (defaultStatus?: BookStatus) => {
    setEditingBook(null);
    setDefaultStatusForModal(defaultStatus);
    setIsModalOpen(true);
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
      }, 200);
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
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  availableYears={availableYears}
                  customRange={customRange}
                  setCustomRange={setCustomRange}
                />;
      case 'list':
        return <BookList 
                  books={shelfBooks} 
                  onEdit={(b) => { setEditingBook(b); setIsModalOpen(true); }} 
                  onDelete={setDeletingBook} 
                  onUpdateBook={handleUpdateBook}
                />;
      case 'wishlist':
        return <Wishlist 
                  books={wishlistBooks} 
                  onEdit={(b) => { setEditingBook(b); setIsModalOpen(true); }} 
                  onDelete={setDeletingBook} 
                  onMoveToShelf={(b) => handleUpdateBook({ ...b, status: BookStatus.TBR })} 
                  onAddWishlistItem={() => openAddModal(BookStatus.Wishlist)}
                />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-main pb-24 relative">
      <Header onLogoClick={() => handleSetView('dashboard')} />
      
      <main className={`p-4 md:p-8 transition-all duration-300 transform ${isFading ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
        {renderContent()}
      </main>
      
      <button
        onClick={() => openAddModal()}
        className="fixed bottom-24 right-6 bg-primary text-background p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-40 active:scale-90"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      <BottomNav view={view} setView={handleSetView} />

      {toastMessage && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
            <div className="bg-emerald-500 rounded-full p-1 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

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
          onConfirm={() => { 
            const title = deletingBook.title;
            deleteBook(deletingBook.id); 
            setDeletingBook(null); 
            showToast(`Livro "${title}" excluído com sucesso`);
          }}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir "${deletingBook.title}"?`}
        />
      )}
    </div>
  );
}
