
import React, { useState, useMemo, useEffect } from 'react';
import { useBookData } from './hooks/useBookData';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AddBookModal } from './components/AddBookModal';
import { SettingsModal } from './components/SettingsModal';
import { PlusIcon } from './components/Icons';
import type { Book, NewBook, Profile } from './types';
import { BookList } from './components/BookList';
import { ConfirmationModal } from './components/ConfirmationModal';
import { BookStatus } from './types';
import { Wishlist } from './components/Wishlist';
import { BottomNav } from './components/BottomNav';
import { Auth } from './components/Auth';
import { supabase } from './services/supabase';
import { dbService } from './services/database';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    setCustomRange,
    isLocalMode,
    schemaError,
    isLoading
  } = useBookData();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const [readingGoal, setReadingGoal] = useState(() => {
    const saved = localStorage.getItem('biblio_tech_goal');
    return saved ? parseInt(saved, 10) : 12;
  });

  // Carrega perfil e meta do Supabase
  useEffect(() => {
    if (session) {
      dbService.getProfile().then(profile => {
        if (profile) {
          setUserProfile(profile);
          if (profile.readingGoal) {
            setReadingGoal(profile.readingGoal);
            localStorage.setItem('biblio_tech_goal', profile.readingGoal.toString());
          }
        }
      });
    }
  }, [session]);

  const handleSetReadingGoal = (val: number) => {
    setReadingGoal(val);
    localStorage.setItem('biblio_tech_goal', val.toString());
    dbService.updateReadingGoal(val);
  };

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (userProfile) {
        const newProfile = { ...userProfile, ...updates };
        setUserProfile(newProfile);
        await dbService.updateProfile(updates);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [view, setView] = useState<'dashboard' | 'list' | 'wishlist'>('dashboard');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<BookStatus | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddBook = async (newBook: NewBook) => {
    try {
      await addBook(newBook);
      setIsModalOpen(false);
      setEditingBook(null);
      showToast(`"${newBook.title}" salvo com sucesso!`);
    } catch (error) {
      showToast("Erro de segurança ou rede ao salvar.");
    }
  };
  
  const handleUpdateBook = async (updatedBook: Book) => {
    try {
      await updateBook(updatedBook);
      setIsModalOpen(false);
      setEditingBook(null);
      if (updatedBook.status === BookStatus.Read) {
          showToast(`Parabéns por concluir "${updatedBook.title}"!`);
      } else {
          showToast(`"${updatedBook.title}" atualizado.`);
      }
    } catch (error) {
      showToast("Ação negada ou erro no banco.");
    }
  };

  const openAddModal = (defaultStatus?: BookStatus) => {
    setEditingBook(null);
    setDefaultStatusForModal(defaultStatus);
    setIsModalOpen(true);
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Sincronizando Biblioteca...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 text-text-main dark:text-slate-200 pb-24 relative transition-colors duration-300">
      <Header 
        profile={userProfile}
        onLogoClick={() => handleSetView('dashboard')} 
        onSettingsClick={() => setIsSettingsOpen(true)}
        theme={theme} 
        toggleTheme={toggleTheme} 
        isConnected={!isLocalMode}
      />
      
      {isLocalMode && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/50 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                    {schemaError?.type === 'column' 
                      ? `Atenção: Coluna '${schemaError.detail}' faltando. Verifique o SQL.`
                      : schemaError?.type === 'permission'
                      ? 'Erro de Permissão (RLS): O banco negou a operação.'
                      : 'Modo Offline: Usando banco de dados local.'}
                </p>
            </div>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="text-[9px] font-black text-amber-700 hover:underline uppercase"
            >
              Sair da Conta
            </button>
        </div>
      )}

      <main className={`p-4 md:p-8 transition-all duration-300 transform ${isFading ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
        {view === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            currentlyReading={currentlyReading} 
            updateBook={handleUpdateBook}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter} 
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            availableYears={availableYears}
            books={books}
            customRange={customRange}
            setCustomRange={setCustomRange}
            readingGoal={readingGoal}
            onSetReadingGoal={handleSetReadingGoal}
          />
        )}
        {view === 'list' && (
          <BookList 
            books={shelfBooks} 
            onEdit={(b) => { setEditingBook(b); setIsModalOpen(true); }} 
            onDelete={setDeletingBook} 
            onUpdateBook={handleUpdateBook}
          />
        )}
        {view === 'wishlist' && (
          <Wishlist 
            books={wishlistBooks} 
            onEdit={(b) => { setEditingBook(b); setIsModalOpen(true); }} 
            onDelete={setDeletingBook} 
            onMoveToShelf={(b) => handleUpdateBook({ ...b, status: BookStatus.TBR })} 
            onAddWishlistItem={() => openAddModal(BookStatus.Wishlist)}
          />
        )}
      </main>
      
      <div className="fixed bottom-24 right-6 flex flex-col gap-3">
        <button
            onClick={() => openAddModal()}
            className="bg-primary text-background p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-40 active:scale-95 flex items-center justify-center"
            title="Adicionar Livro"
        >
            <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      <BottomNav view={view} setView={handleSetView} />

      {toastMessage && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
            <div className="bg-emerald-500 rounded-full p-1 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      {isModalOpen && (
        <AddBookModal
          onClose={() => { setIsModalOpen(false); setEditingBook(null); }}
          onAddBook={handleAddBook}
          onUpdateBook={handleUpdateBook}
          bookToEdit={editingBook}
          defaultStatus={defaultStatusForModal}
          existingBooks={books}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          readingGoal={readingGoal}
          onSetReadingGoal={handleSetReadingGoal}
          profile={userProfile}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {deletingBook && (
        <ConfirmationModal
          isOpen={!!deletingBook}
          onClose={() => setDeletingBook(null)}
          onConfirm={async () => { 
            const title = deletingBook.title;
            await deleteBook(deletingBook.id); 
            setDeletingBook(null); 
            showToast(`"${title}" removido.`);
          }}
          title="Excluir Registro"
          message={`Tem certeza que deseja apagar "${deletingBook.title}"?`}
        />
      )}
    </div>
  );
}
