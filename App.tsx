
import React, { useState, useMemo, useEffect } from 'react';
import { useBookData } from './hooks/useBookData';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AddBookModal } from './components/AddBookModal';
import { SettingsModal } from './components/SettingsModal';
import { PlusIcon, XMarkIcon } from './components/Icons';
import type { Book, NewBook, Profile } from './types';
import { BookList } from './components/BookList';
import { ConfirmationModal } from './components/ConfirmationModal';
import { BookStatus } from './types';
import { Wishlist } from './components/Wishlist';
import { BottomNav } from './components/BottomNav';
import { Auth } from './components/Auth';
import { StatsView } from './components/StatsView';
import { PricePaidModal } from './components/PricePaidModal'; 
import { BookSearch } from './components/BookSearch';
import { supabase } from './services/supabase';
import { dbService } from './services/database';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((err) => {
        console.warn("⚠️ Não foi possível sincronizar sessão inicial (Offline/Fetch Error).");
      })
      .finally(() => {
        setIsAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      dbService.getProfile().then(profile => {
        if (profile) {
          setUserProfile(profile);
          if (profile.readingGoal) setReadingGoal(profile.readingGoal);
          checkPlatformApiKey();
        }
      });
    }
  }, [session]);

  const checkPlatformApiKey = async () => {
    if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
    } else {
        const envKey = process.env.API_KEY;
        setHasApiKey(!!(envKey && envKey !== 'undefined' && envKey !== ''));
    }
  };

  const { 
    books, stats, currentlyReading, addBook, updateBook, deleteBook, 
    dateFilter, setDateFilter, selectedYear, setSelectedYear, availableYears,
    customRange, setCustomRange, isLocalMode, schemaError, isLoading
  } = useBookData();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [readingGoal, setReadingGoal] = useState(() => parseInt(localStorage.getItem('biblio_tech_goal') || '12', 10));

  const handleSetReadingGoal = async (val: number) => {
    try {
        setReadingGoal(val);
        localStorage.setItem('biblio_tech_goal', val.toString());
        await dbService.updateReadingGoal(val);
        showToast("Meta de leitura atualizada.");
    } catch (err: any) {
        showToast(`Erro ao salvar meta: ${err.message}`);
    }
  };

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (userProfile) {
        try {
            const newProfile = { ...userProfile, ...updates };
            setUserProfile(newProfile);
            await dbService.updateProfile(updates);
            checkPlatformApiKey();
            showToast("Perfil atualizado.");
        } catch (err: any) {
            showToast(`Erro ao atualizar perfil: ${err.message}`);
        }
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [view, setView] = useState<'dashboard' | 'list' | 'wishlist' | 'stats' | 'search'>('dashboard');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [convertingBook, setConvertingBook] = useState<Book | null>(null); 
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<BookStatus | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    theme === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddBook = async (newBook: NewBook) => {
    try {
        await addBook(newBook);
        setIsModalOpen(false);
        showToast(`"${newBook.title}" salvo!`);
    } catch (err: any) {
        showToast(`Erro ao salvar: ${err.message}`);
    }
  };
  
  const handleUpdateBook = async (updatedBook: Book) => {
    try {
        await updateBook(updatedBook);
        setIsModalOpen(false);
        showToast(`"${updatedBook.title}" atualizado.`);
    } catch (err: any) {
        showToast(`Erro ao atualizar: ${err.message}`);
    }
  };

  const handleFinishConversion = async (price: number) => {
    if (convertingBook) {
      const updated: Book = {
        ...convertingBook,
        status: BookStatus.TBR,
        wasWishlist: true,
        pricePaid: price,
        dateAdded: new Date().toISOString().split('T')[0] 
      };
      await handleUpdateBook(updated);
      setConvertingBook(null);
      showToast("Movido para sua estante!");
    }
  };

  const openAddModal = (status?: BookStatus) => {
    setEditingBook(null);
    setIsDuplicating(false);
    setDefaultStatusForModal(status);
    setIsModalOpen(true);
  };

  const handleDuplicateRequest = (book: Book) => {
    setEditingBook(book);
    setIsDuplicating(true);
    setIsModalOpen(true);
  };

  if (isAuthLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session) return <Auth />;
  if (isLoading) return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando...</p></div>;

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 text-text-main dark:text-slate-200 pb-24 relative transition-colors duration-300">
      <Header 
        profile={userProfile} onLogoClick={() => setView('dashboard')} onSettingsClick={() => setIsSettingsOpen(true)}
        theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
        isConnected={!isLocalMode} hasApiKey={hasApiKey}
      />
      
      {schemaError && (
        <div className="bg-red-600 text-white px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-4 animate-in slide-in-from-top duration-500">
          <div className="flex-1">
             ⚠️ Erro de Sincronização: {schemaError.detail || "O banco de dados está desatualizado."} 
             <span className="block mt-1 font-bold opacity-80">Rode o script SQL do arquivo instrucoes_sql.txt no painel do Supabase!</span>
          </div>
        </div>
      )}

      {!hasApiKey && !schemaError && (
        <div className="bg-red-500 text-white px-6 py-2 text-center text-[10px] font-black uppercase tracking-widest animate-pulse cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
          IA Indisponível: Clique aqui para configurar sua Chave de API nas Preferências.
        </div>
      )}

      <main className="p-4 md:p-8">
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
            addBook={handleAddBook}
          />
        )}
        {view === 'list' && <BookList books={books.filter(b => b.status !== BookStatus.Wishlist)} onEdit={(b) => { setEditingBook(b); setIsDuplicating(false); setIsModalOpen(true); }} onDelete={setDeletingBook} onDuplicate={handleDuplicateRequest} onUpdateBook={handleUpdateBook} />}
        {view === 'wishlist' && <Wishlist books={books.filter(b => b.status === BookStatus.Wishlist)} onEdit={(b) => { setEditingBook(b); setIsDuplicating(false); setIsModalOpen(true); }} onDelete={setDeletingBook} onDuplicate={handleDuplicateRequest} onMoveToShelf={(b) => setConvertingBook(b)} onAddWishlistItem={() => openAddModal(BookStatus.Wishlist)} />}
        {view === 'stats' && <StatsView books={books} availableYears={availableYears} />}
        {view === 'search' && <BookSearch onAddWishlist={handleAddBook} existingBooks={books} />}
      </main>
      
      <div className="fixed bottom-24 right-6 flex flex-col gap-3">
        <button onClick={() => openAddModal()} className="bg-primary text-background p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-40 active:scale-95"><PlusIcon className="h-6 w-6" /></button>
      </div>

      <BottomNav view={view} setView={setView} />
      {toastMessage && <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3"><p className="text-[11px] font-black uppercase tracking-widest">{toastMessage}</p></div></div>}
      
      {isModalOpen && <AddBookModal onClose={() => setIsModalOpen(false)} onAddBook={handleAddBook} onUpdateBook={handleUpdateBook} bookToEdit={editingBook} isDuplicating={isDuplicating} defaultStatus={defaultStatusForModal} existingBooks={books} />}
      
      {convertingBook && <PricePaidModal book={convertingBook} onClose={() => setConvertingBook(null)} onConfirm={handleFinishConversion} />}
      
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} readingGoal={readingGoal} onSetReadingGoal={handleSetReadingGoal} profile={userProfile} onUpdateProfile={handleUpdateProfile} />}
      
      {deletingBook && <ConfirmationModal isOpen={!!deletingBook} onClose={() => setDeletingBook(null)} onConfirm={async () => { await deleteBook(deletingBook.id); setDeletingBook(null); showToast(`Removido.`); }} title="Excluir" message={`Apagar "${deletingBook.title}"?`} />}
    </div>
  );
}
