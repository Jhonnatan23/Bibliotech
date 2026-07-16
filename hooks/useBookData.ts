
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Book, ReadingStats, NewBook, DateFilter, GenreStat, StatusStat } from '../types';
import { BookStatus, BookType } from '../types';
import { dbService } from '../services/database';
import { supabase } from '../services/supabase';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const useBookData = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [schemaError, setSchemaError] = useState<{type: 'table' | 'column' | 'permission', detail?: string} | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('allTime');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customRange, setCustomRange] = useState({ 
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [quickSummary, setQuickSummary] = useState<{readCount: number, tbrCount: number, wishlistCount: number} | null>(null);
  const isSincronizing = useRef(false);

  const loadCache = useCallback(async () => {
    try {
      const cachedBooks = await dbService.getLocalBooks();
      const cachedStats = await dbService.getLocalStats();
      if (cachedBooks.length > 0) setBooks(cachedBooks);
      if (cachedStats) setQuickSummary(cachedStats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncWithCloud = useCallback(async () => {
    if (isSincronizing.current) return;
    isSincronizing.current = true;

    dbService.setSchemaErrorCallback((type, detail) => {
        setSchemaError({ type, detail });
        setIsLocalMode(true);
    });

    try {
      const [booksResult, statsResult] = await Promise.allSettled([
        dbService.getAllBooks(),
        dbService.getQuickStatsSummary()
      ]);

      if (booksResult.status === 'fulfilled') {
        setBooks(booksResult.value);
      }
      if (statsResult.status === 'fulfilled' && statsResult.value) {
        setQuickSummary(statsResult.value);
      }
    } catch (e) {
      console.warn("Sincronização falhou.");
    } finally {
      setIsLoading(false);
      isSincronizing.current = false;
    }
  }, []);

  useEffect(() => {
    loadCache().then(() => syncWithCloud());
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') syncWithCloud();
    });
    return () => subscription.unsubscribe();
  }, [loadCache, syncWithCloud]);

  const addBook = useCallback(async (newBook: NewBook) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error("Necessário login.");
    
    const book: Book = {
      ...newBook,
      id: crypto.randomUUID(),
      user_id: user.id,
      dateAdded: newBook.dateAdded || new Date().toISOString().split('T')[0],
    };
    
    setBooks(prev => [book, ...prev]);
    await dbService.saveBook(book);
  }, []);

  const updateBook = useCallback(async (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    await dbService.saveBook(updatedBook);
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    await dbService.deleteBook(id);
  }, []);

  const importBooks = useCallback(async (importedBooks: Book[]) => {
    const updatedBooks = await dbService.importBooks(importedBooks);
    setBooks(updatedBooks);
    const statsResult = await dbService.getQuickStatsSummary();
    if (statsResult) {
      setQuickSummary(statsResult);
    }
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    books.forEach(book => {
      if (book.dateFinished) years.add(new Date(book.dateFinished).getFullYear());
      else if (book.dateAdded) years.add(new Date(book.dateAdded).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  const isBookInFilter = useCallback((book: Book) => {
    if (dateFilter === 'allTime') return true;
    const dateToCompare = book.dateFinished || book.dateAdded;
    if (!dateToCompare) return false;
    const date = new Date(dateToCompare);
    if (dateFilter === 'thisYear') return date.getFullYear() === new Date().getFullYear();
    if (dateFilter === 'specificYear') return date.getFullYear() === selectedYear;
    if (dateFilter === 'custom') {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      return date >= start && date <= end;
    }
    return true;
  }, [dateFilter, selectedYear, customRange]);

  const stats: ReadingStats = useMemo(() => {
    const global = { booksRead: 0, pagesRead: 0, totalRating: 0, ratingCount: 0, totalSpent: 0 };
    const yearly = { booksRead: 0, pagesRead: 0, totalRating: 0, ratingCount: 0, totalSpent: 0, totalDays: 0 };
    
    const monthlyDataMap = MONTHS.map(month => ({ month, booksRead: 0, pagesRead: 0, totalRating: 0, ratingCount: 0 }));
    
    const byTypeMap: Record<string, any> = {
      [BookType.Book]: { type: BookType.Book, count: 0, pages: 0, totalRating: 0, ratingCount: 0 },
      [BookType.HQ]: { type: BookType.HQ, count: 0, pages: 0, totalRating: 0, ratingCount: 0 }
    };

    const genreCountMap: Record<string, number> = {};
    const authorCountMap: Record<string, number> = {};
    const statusCountMap: Record<string, number> = {};

    let tbrCountTotal = 0;
    let wishlistCountTotal = 0;
    let loanedCountTotal = 0;

    books.forEach(book => {
      const isInFilter = isBookInFilter(book);
      
      // Contagens globais simples para os cards rápidos que não sofrem filtro
      if (book.status === BookStatus.TBR) tbrCountTotal++;
      if (book.status === BookStatus.Wishlist) wishlistCountTotal++;
      if (book.isLoaned) loanedCountTotal++;

      // MÉTRICAS GLOBAIS VITAIS (Sempre baseadas no acervo todo)
      if (book.rating !== undefined && book.rating > 0) {
        global.totalRating += book.rating;
        global.ratingCount++;
      }

      if (book.pricePaid) {
        global.totalSpent += book.pricePaid;
      }

      if (book.status === BookStatus.Read) {
        const reads = Math.max(1, book.timesRead || 1);
        global.booksRead += reads;
        global.pagesRead += (book.pages || 0) * reads;
      }

      // MÉTRICAS FILTRADAS (Dashboard dinâmico)
      if (isInFilter) {
        // Distribuição de Status no Período
        statusCountMap[book.status] = (statusCountMap[book.status] || 0) + 1;

        if (book.pricePaid) {
          yearly.totalSpent += book.pricePaid;
        }

        if (book.status === BookStatus.Read) {
          yearly.booksRead++;
          yearly.pagesRead += (book.pages || 0);
          if (book.rating && book.rating > 0) {
            yearly.totalRating += book.rating;
            yearly.ratingCount++;
          }

          if (book.daysToFinish) {
            yearly.totalDays += book.daysToFinish;
          }
          
          // Agregação por Tipo (no período)
          const typeData = byTypeMap[book.type];
          if (typeData) {
            typeData.count++;
            typeData.pages += (book.pages || 0);
            if (book.rating) {
                typeData.totalRating += book.rating;
                typeData.ratingCount++;
            }
          }

          // Agregação por Gênero (no período)
          const genres = book.genre.split(',').map(g => g.trim()).filter(g => g !== '');
          genres.forEach(g => {
            genreCountMap[g] = (genreCountMap[g] || 0) + 1;
          });

          // Agregação por Autor (no período)
          const authors = book.author.split(',').map(a => a.trim()).filter(a => a !== '');
          authors.forEach(a => {
            authorCountMap[a] = (authorCountMap[a] || 0) + 1;
          });

          // Mensal (no período)
          if (book.dateFinished) {
            const monthIndex = new Date(book.dateFinished).getMonth();
            const mData = monthlyDataMap[monthIndex];
            if (mData) {
              mData.booksRead++;
              mData.pagesRead += (book.pages || 0);
              if (book.rating) {
                mData.totalRating += book.rating;
                mData.ratingCount++;
              }
            }
          }
        }
      }
    });

    const activeMonths = monthlyDataMap.filter(m => m.booksRead > 0).length;
    const consistency = (activeMonths / 12) * 100;

    return {
      tbrCount: tbrCountTotal,
      wishlistCount: wishlistCountTotal,
      loanedCount: loanedCountTotal,
      totalSpent: yearly.totalSpent,
      avgPagesPerDay: yearly.totalDays > 0 ? yearly.pagesRead / yearly.totalDays : 0,
      consistency,
      global: {
        booksRead: global.booksRead,
        pagesRead: global.pagesRead,
        avgRating: global.ratingCount > 0 ? global.totalRating / global.ratingCount : 0
      },
      yearly: {
        booksRead: yearly.booksRead,
        pagesRead: yearly.pagesRead,
        avgRating: yearly.ratingCount > 0 ? yearly.totalRating / yearly.ratingCount : 0
      },
      monthly: monthlyDataMap.map(m => ({
        month: m.month, booksRead: m.booksRead, pagesRead: m.pagesRead,
        avgRating: m.ratingCount > 0 ? m.totalRating / m.ratingCount : 0
      })),
      byType: Object.values(byTypeMap).map(t => ({
        type: t.type, count: t.count, pages: t.pages,
        avgRating: t.ratingCount > 0 ? t.totalRating / t.ratingCount : 0
      })),
      byGenre: Object.entries(genreCountMap)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      byAuthor: Object.entries(authorCountMap)
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      byStatus: Object.entries(statusCountMap)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count)
    };
  }, [books, isBookInFilter]);

  const currentlyReading = useMemo(() => books.find(b => b.status === BookStatus.Reading) || null, [books]);

  return {
    books, stats, currentlyReading, addBook, updateBook, deleteBook, importBooks, refresh: syncWithCloud,
    dateFilter, setDateFilter, selectedYear, setSelectedYear, availableYears,
    customRange, setCustomRange, isLocalMode, schemaError, isLoading
  };
};
