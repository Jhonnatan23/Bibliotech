
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useBookData } from './hooks/useBookData';
import { Header } from './components/Header';
import { AddBookModal } from './components/AddBookModal';
import { ProfileModal } from './components/ProfileModal';
import { PlusIcon, XMarkIcon } from './components/Icons';
import type { Book, NewBook, Profile } from './types';
import { ConfirmationModal } from './components/ConfirmationModal';
import { BookStatus } from './types';
import { BottomNav } from './components/BottomNav';
import { Auth } from './components/Auth';
import { PricePaidModal } from './components/PricePaidModal'; 
import { BookDetailsModal } from './components/BookDetailsModal';
import { NextReadModal } from './components/NextReadModal';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './services/supabase';
import { dbService } from './services/database';
import { NotificationModal } from './components/NotificationModal';

// Lazy loaded views
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const BookList = lazy(() => import('./components/BookList').then(m => ({ default: m.BookList })));
const Wishlist = lazy(() => import('./components/Wishlist').then(m => ({ default: m.Wishlist })));
const StatsView = lazy(() => import('./components/StatsView').then(m => ({ default: m.StatsView })));
const HistoryView = lazy(() => import('./components/HistoryView').then(m => ({ default: m.HistoryView })));
const LoansView = lazy(() => import('./components/LoansView').then(m => ({ default: m.LoansView })));
const BookSearch = lazy(() => import('./components/BookSearch').then(m => ({ default: m.BookSearch })));
const SeriesView = lazy(() => import('./components/SeriesView').then(m => ({ default: m.SeriesView })));
const ReadingChallenges = lazy(() => import('./components/ReadingChallenges').then(m => ({ default: m.ReadingChallenges })));
const CommunityView = lazy(() => import('./components/CommunityView').then(m => ({ default: m.CommunityView })));
const ReadingJournal = lazy(() => import('./components/ReadingJournal').then(m => ({ default: m.ReadingJournal })));

import { ShareToCommunityModal } from './components/ShareToCommunityModal';

const ViewLoader = () => (
  <div className="flex flex-col items-center justify-center py-20 animate-pulse">
    <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4"></div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Carregando visualização...</p>
  </div>
);

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

      // Preload lazy views in the background during idle time for instant, buttery-smooth screen switching!
      const preloadViews = () => {
        const views = [
          () => import('./components/Dashboard'),
          () => import('./components/BookList'),
          () => import('./components/Wishlist'),
          () => import('./components/StatsView'),
          () => import('./components/HistoryView'),
          () => import('./components/LoansView'),
          () => import('./components/BookSearch'),
          () => import('./components/SeriesView'),
          () => import('./components/ReadingChallenges')
        ];
        const scheduler = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 1000));
        scheduler(() => {
          views.forEach(v => {
            try { v(); } catch (err) {}
          });
        });
      };
      preloadViews();
    }
  }, [session]);

  const checkPlatformApiKey = async () => {
    if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
    } else {
        // Enviamos true pois o servidor deve ter a chave GEMINI_API_KEY configurada
        setHasApiKey(true);
    }
  };

  const { 
    books, stats, currentlyReading, addBook, updateBook, deleteBook, refresh,
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
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [view, setView] = useState<'dashboard' | 'list' | 'wishlist' | 'stats' | 'search' | 'history' | 'loans' | 'series' | 'challenges' | 'community' | 'journal'>('dashboard');
  const [selectedJournalBookId, setSelectedJournalBookId] = useState<string | null>(null);
  const [sharingBook, setSharingBook] = useState<Book | null>(null);

  useEffect(() => {
    if (userProfile?.id) {
      const loadUnreadCount = () => {
        try {
          const savedAlerts = localStorage.getItem(`biblio_tech_alerts_${userProfile.id}`);
          if (savedAlerts) {
            const parsed = JSON.parse(savedAlerts);
            const count = parsed.filter((a: any) => !a.isRead).length;
            setUnreadNotifCount(count);
          } else {
            setUnreadNotifCount(1); // default welcoming alert
          }
        } catch (e) {}
      };
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 2500);
      return () => clearInterval(interval);
    }
  }, [userProfile]);

  const triggerFinishBookNotification = (book: Book) => {
    if (!userProfile?.id) return;
    try {
      const userSettingsKey = `biblio_tech_notif_config_${userProfile.id}`;
      const userAlertsKey = `biblio_tech_alerts_${userProfile.id}`;
      const userEmailsKey = `biblio_tech_emails_${userProfile.id}`;
      
      const settingsRaw = localStorage.getItem(userSettingsKey);
      const settings = settingsRaw ? JSON.parse(settingsRaw) : {
        emailBookFinishedEnabled: true,
      };
      
      const recipientEmail = userProfile.email || 'jhonnatan.fernandes23@gmail.com';

      // 1. Alerta
      const currentAlerts = JSON.parse(localStorage.getItem(userAlertsKey) || '[]');
      const newAlert = {
        id: `alert_finished_${Date.now()}`,
        title: `🎉 Livro Concluído: ${book.title}`,
        description: `Parabéns pela conclusão de "${book.title}" por ${book.author}! Você adicionou com sucesso ${book.pages} páginas lidas à sua estante.`,
        category: 'goals',
        timestamp: new Date().toISOString(),
        isRead: false
      };
      localStorage.setItem(userAlertsKey, JSON.stringify([newAlert, ...currentAlerts]));

      // 2. Email
      if (settings.emailBookFinishedEnabled) {
        const currentEmails = JSON.parse(localStorage.getItem(userEmailsKey) || '[]');
        const html = `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; color: #1e293b; background-color: #f5f3ff; padding: 24px;">
            <div style="background-color: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #ddd6fe; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <p style="font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #7c3aed; margin: 0 0 12px 0;">🏆 Livro Concluído!</p>
              <h2 style="font-size: 24px; font-weight: 900; color: #1e1b4b; margin: 0 0 12px 0; letter-spacing: -0.02em;">PARABÉNS PELA JORNADA! 🎉</h2>
              <p style="font-size: 13px; font-weight: 500; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
                Olá, <strong>${userProfile.fullName || 'Leitor'}</strong>!<br/><br/>
                Você acaba de encerrar as páginas de mais uma incrível jornada. Que tremenda conquista pessoal adicionar este marco de dedicação à sua mente!
              </p>
              
              <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
                <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #a21caf; margin: 0 0 8px 0;">Resumo da Obra Concluída:</p>
                <h4 style="font-size: 16px; font-weight: 950; color: #4c1d95; margin: 0 0 4px 0;">${book.title}</h4>
                <p style="font-size: 12px; color: #6b21a8; font-weight: 600; margin: 0 0 12px 0;">por ${book.author} — ${book.pages} páginas</p>
              </div>

              <p style="font-size: 12.5px; font-weight: 500; color: #52525b; line-height: 1.6; margin-bottom: 24px;">
                💡 Recomendação rápida de IA: Que abrir o seu estúdio e buscar livros similares por gênero, ou escrever suas observações e notas para consolidar seus aprendizados?
              </p>
            </div>
          </div>
        `;
        const subject = `🎉 Parabéns! Livro concluído à sua estante: ${book.title}`;
        const newEmail = {
          id: `email_finished_${Date.now()}`,
          subject,
          recipient: recipientEmail,
          sentAt: new Date().toISOString(),
          status: 'Entregue' as const,
          contentHtml: html
        };
        localStorage.setItem(userEmailsKey, JSON.stringify([newEmail, ...currentEmails]));

        // Envia o e-mail real via API
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: recipientEmail, subject, html })
        })
        .then(res => res.json())
        .then(data => console.log("[Email Service] Sucesso no disparo real:", data))
        .catch(err => console.error("[Email Service] Erro no disparo real:", err));
      }
    } catch (e) {
      console.error("Error triggering auto-finish notification:", e);
    }
  };
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [convertingBook, setConvertingBook] = useState<Book | null>(null); 
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<BookStatus | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<{
    finishedBook?: Book;
    recommendedBook: Book;
    ruleUsed: 'linked' | 'tag' | 'genre' | 'random' | 'random_pick';
  } | null>(null);

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
  
  // App component
  const handleUpdateBook = async (updatedBook: Book) => {
    const oldBook = books.find(b => b.id === updatedBook.id);
    const wasJustFinished = oldBook && oldBook.status !== BookStatus.Read && updatedBook.status === BookStatus.Read;

    try {
        await updateBook(updatedBook);
        if (viewingBook?.id === updatedBook.id) {
            setViewingBook(updatedBook);
        }
        setIsModalOpen(false);
        showToast(`"${updatedBook.title}" atualizado.`);

        if (wasJustFinished) {
            triggerFinishBookNotification(updatedBook);
            // Abrir modal de compartilhar na comunidade
            setTimeout(() => {
                setSharingBook(updatedBook);
            }, 600);
            // Pequeno delay para permitir que o toast e a atualização da UI aconteçam antes do popup de recomendação
            setTimeout(() => {
                findAndSetRecommendation(updatedBook);
            }, 1400);
        }
    } catch (err: any) {
        showToast(`Erro ao atualizar: ${err.message}`);
    }
  };

  const findAndSetRecommendation = (finishedBook: Book) => {
    // Candidatos: Livros que não estão Lidos e não estão na Lista de Desejos
    // Focamos em livros na estante (Quero Ler ou Lendo Atualmente)
    const candidates = books.filter(b => 
        b.id !== finishedBook.id && 
        b.status !== BookStatus.Read && 
        b.status !== BookStatus.Wishlist &&
        b.status !== BookStatus.Dropped
    );
    
    if (candidates.length === 0) return;

    // Regra 1: Livros Vinculados (linkedBookIds) que ainda não foram lidos
    if (finishedBook.linkedBookIds && finishedBook.linkedBookIds.length > 0) {
        const linkedCandidates = candidates.filter(b => finishedBook.linkedBookIds?.includes(b.id));
        if (linkedCandidates.length > 0) {
            setRecommendation({
                finishedBook,
                recommendedBook: linkedCandidates[Math.floor(Math.random() * linkedCandidates.length)],
                ruleUsed: 'linked'
            });
            return;
        }
    }

    // Regra 2: Mesma Tag
    if (finishedBook.tags && finishedBook.tags.length > 0) {
        const tagCandidates = candidates.filter(b => b.tags?.some(t => finishedBook.tags?.includes(t)));
        if (tagCandidates.length > 0) {
            setRecommendation({
                finishedBook,
                recommendedBook: tagCandidates[Math.floor(Math.random() * tagCandidates.length)],
                ruleUsed: 'tag'
            });
            return;
        }
    }

    // Regra 3: Mesmo Tema (Genre)
    const finishedGenres = finishedBook.genre.split(',').map(g => g.trim()).filter(g => g !== '');
    if (finishedGenres.length > 0) {
        const genreCandidates = candidates.filter(b => {
            const bGenres = b.genre.split(',').map(g => g.trim()).filter(g => g !== '');
            return bGenres.some(bg => finishedGenres.includes(bg));
        });
        if (genreCandidates.length > 0) {
            setRecommendation({
                finishedBook,
                recommendedBook: genreCandidates[Math.floor(Math.random() * genreCandidates.length)],
                ruleUsed: 'genre'
            });
            return;
        }
    }

    // Regra 4: Aleatório dentro dos candidatos (estante)
    setRecommendation({
        finishedBook,
        recommendedBook: candidates[Math.floor(Math.random() * candidates.length)],
        ruleUsed: 'random'
    });
  };

  const handleRandomPick = () => {
    // Candidatos: Livros que não estão Lidos e não estão na Lista de Desejos
    const candidates = books.filter(b => 
        b.status === BookStatus.TBR || 
        b.status === BookStatus.Reading
    );
    
    if (candidates.length === 0) {
        showToast("Nenhum livro para sortear na sua estante.");
        return;
    }

    // Preferência para livros que ainda não começou (TBR)
    const tbrOnly = candidates.filter(b => b.status === BookStatus.TBR);
    const pool = tbrOnly.length > 0 ? tbrOnly : candidates;

    const picked = pool[Math.floor(Math.random() * pool.length)];
    
    setRecommendation({
        recommendedBook: picked,
        ruleUsed: 'random_pick'
    });
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
        setView={setView}
        onNotifClick={() => setIsNotifOpen(true)}
        unreadCount={unreadNotifCount}
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
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Suspense fallback={<ViewLoader />}>
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
                  onRandomPick={handleRandomPick}
                  profile={userProfile}
                  onOpenJournal={(bookId) => {
                    setSelectedJournalBookId(bookId);
                    setView('journal');
                  }}
                />
              )}
              {view === 'list' && (
                <BookList 
                  profile={userProfile} 
                  books={books.filter(b => b.status !== BookStatus.Wishlist)} 
                  allBooks={books}
                  stats={stats}
                  onEdit={(b) => { setEditingBook(b); setIsDuplicating(false); setIsModalOpen(true); }} 
                  onDelete={setDeletingBook} 
                  onDuplicate={handleDuplicateRequest} 
                  onViewDetails={setViewingBook} 
                  onUpdateBook={handleUpdateBook}
                  onRandomPick={handleRandomPick}
                />
              )}
              {view === 'wishlist' && <Wishlist books={books.filter(b => b.status === BookStatus.Wishlist)} onEdit={(b) => { setEditingBook(b); setIsDuplicating(false); setIsModalOpen(true); }} onDelete={setDeletingBook} onDuplicate={handleDuplicateRequest} onMoveToShelf={(b) => setConvertingBook(b)} onAddWishlistItem={() => openAddModal(BookStatus.Wishlist)} />}
              {view === 'stats' && <StatsView books={books} availableYears={availableYears} readingGoal={readingGoal} />}
              {view === 'history' && <HistoryView books={books} profile={userProfile} onUpdateBook={handleUpdateBook} onEdit={(b) => { setEditingBook(b); setIsDuplicating(false); setIsModalOpen(true); }} onDelete={setDeletingBook} onShareBook={(b) => setSharingBook(b)} />}
              {view === 'loans' && <LoansView books={books} profile={userProfile} onUpdateBook={handleUpdateBook} />}
              {view === 'series' && (
                <SeriesView 
                  books={books} 
                  profile={userProfile} 
                  onEdit={(b) => { setEditingBook(b); setIsDuplicating(false); setIsModalOpen(true); }} 
                  onUpdateBook={handleUpdateBook}
                  onDelete={setDeletingBook} 
                  onViewDetails={setViewingBook} 
                  onAddBook={() => openAddModal()} 
                  onRefresh={refresh} 
                />
              )}
              {view === 'search' && <BookSearch onAddWishlist={handleAddBook} existingBooks={books} />}
              {view === 'challenges' && <ReadingChallenges books={books} profile={userProfile} />}
              {view === 'community' && (
                <CommunityView 
                  profile={userProfile} 
                  onAddToWishlist={async (bookData) => {
                    try {
                      await handleAddBook({
                        title: bookData.title,
                        author: bookData.author,
                        pages: bookData.pages || 150,
                        genre: bookData.genre || 'Ficção',
                        type: bookData.type || 'Livro',
                        status: BookStatus.Wishlist,
                        dateAdded: new Date().toISOString().split('T')[0],
                        currentPage: 0,
                        timesRead: 0,
                        wasWishlist: true,
                      });
                    } catch (err: any) {
                      showToast(`Erro ao adicionar à Wishlist: ${err.message}`);
                    }
                  }} 
                />
              )}
              {view === 'journal' && (
                <ReadingJournal 
                  books={books} 
                  profile={userProfile} 
                  onUpdateBook={handleUpdateBook}
                  preselectedBookId={selectedJournalBookId}
                  onClosePreselect={() => setSelectedJournalBookId(null)}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      
      <div className="fixed bottom-24 right-6 flex flex-col gap-3">
        <button onClick={() => openAddModal()} className="bg-primary text-white p-4 rounded-full shadow-2xl hover:bg-tertiary transition-all z-40 active:scale-95"><PlusIcon className="h-6 w-6" /></button>
      </div>

      <BottomNav view={view} setView={setView} />
      {toastMessage && <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3"><p className="text-[11px] font-black uppercase tracking-widest">{toastMessage}</p></div></div>}
      
      {isModalOpen && <AddBookModal onClose={() => setIsModalOpen(false)} onAddBook={handleAddBook} onUpdateBook={handleUpdateBook} bookToEdit={editingBook} isDuplicating={isDuplicating} defaultStatus={defaultStatusForModal} existingBooks={books} profile={userProfile} />}
      
      {viewingBook && <BookDetailsModal book={viewingBook} allBooks={books} onClose={() => setViewingBook(null)} onNavigateToBook={(b) => setViewingBook(b)} profile={userProfile} onUpdateBook={handleUpdateBook} />}
      
      {convertingBook && <PricePaidModal book={convertingBook} onClose={() => setConvertingBook(null)} onConfirm={handleFinishConversion} />}
      
      {isSettingsOpen && <ProfileModal books={books} onClose={() => setIsSettingsOpen(false)} readingGoal={readingGoal} onSetReadingGoal={handleSetReadingGoal} profile={userProfile} onUpdateProfile={handleUpdateProfile} />}
      
      {isNotifOpen && <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} books={books} profile={userProfile} />}
      
      <AnimatePresence>
        {sharingBook && (
          <ShareToCommunityModal 
            book={sharingBook} 
            onClose={() => setSharingBook(null)} 
            onSuccess={() => { 
              setSharingBook(null); 
              showToast("Compartilhado na comunidade! 🎉"); 
              setView('community'); 
            }} 
          />
        )}
      </AnimatePresence>
      
      {deletingBook && <ConfirmationModal isOpen={!!deletingBook} onClose={() => setDeletingBook(null)} onConfirm={async () => { await deleteBook(deletingBook.id); setDeletingBook(null); showToast(`Removido.`); }} title="Excluir" message={`Apagar "${deletingBook.title}"?`} />}

      <AnimatePresence>
        {recommendation && (
            <NextReadModal 
                finishedBook={recommendation.finishedBook}
                recommendedBook={recommendation.recommendedBook}
                ruleUsed={recommendation.ruleUsed}
                onClose={() => setRecommendation(null)}
                onStartReading={(book) => {
                    if (book.status !== BookStatus.Reading) {
                        handleUpdateBook({ ...book, status: BookStatus.Reading, dateStarted: new Date().toISOString().split('T')[0] });
                    }
                    setView('dashboard');
                }}
            />
        )}
      </AnimatePresence>
    </div>
  );
}
