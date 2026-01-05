
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Book, ReadingStats, NewBook, DateFilter } from '../types';
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
      console.warn("Sincronização com a nuvem falhou, mantendo dados locais.");
    } finally {
      setIsLoading(false);
      isSincronizing.current = false;
    }
  }, []);

  useEffect(() => {
    loadCache().then(() => syncWithCloud());
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        syncWithCloud();
      }
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

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    books.forEach(book => {
      if (book.dateFinished) years.add(new Date(book.dateFinished).getFullYear());
      else if (book.dateAdded) years.add(new Date(book.dateAdded).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  // Define se um livro pertence ao período filtrado
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

  const filteredBooks = useMemo(() => {
    return books.filter(isBookInFilter);
  }, [books, isBookInFilter]);

  const stats: ReadingStats = useMemo(() => {
    const global = { booksRead: 0, pagesRead: 0, totalRating: 0, ratingCount: 0 };
    const yearly = { booksRead: 0, pagesRead: 0, totalRating: 0, ratingCount: 0 };
    
    const monthlyDataMap = MONTHS.map(month => ({ month, booksRead: 0, pagesRead: 0, totalRating: 0, ratingCount: 0 }));
    const byTypeMap: Record<string, any> = {
      [BookType.Book]: { type: BookType.Book, count: 0, pages: 0, totalRating: 0, ratingCount: 0 },
      [BookType.HQ]: { type: BookType.HQ, count: 0, pages: 0, totalRating: 0, ratingCount: 0 }
    };

    let tbrCount = 0;
    let wishlistCount = 0;

    books.forEach(book => {
      // Contagens globais de status
      if (book.status === BookStatus.TBR) tbrCount++;
      if (book.status === BookStatus.Wishlist) wishlistCount++;

      // Se possui nota, computa na média global independentemente do status
      if (book.rating !== undefined && book.rating > 0) {
        global.totalRating += book.rating;
        global.ratingCount++;
      }

      // Se foi lido, computa no total global de livros e páginas (considerando re-leituras)
      if (book.status === BookStatus.Read) {
        const reads = book.timesRead || 1;
        global.booksRead += reads;
        global.pagesRead += (book.pages || 0) * reads;

        const typeData = byTypeMap[book.type];
        if (typeData) {
          typeData.count += reads;
          typeData.pages += (book.pages || 0) * reads;
          if (book.rating) {
            typeData.totalRating += book.rating;
            typeData.ratingCount++;
          }
        }
      }

      // Processamento do Filtro Atual
      if (isBookInFilter(book)) {
        if (book.status === BookStatus.Read) {
          yearly.booksRead++; // No filtro anual, contamos 1 se concluído no período
          yearly.pagesRead += (book.pages || 0);
          
          if (book.rating && book.rating > 0) {
            yearly.totalRating += book.rating;
            yearly.ratingCount++;
          }

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

    return {
      tbrCount: books.length === 0 && quickSummary ? quickSummary.tbrCount : tbrCount,
      wishlistCount: books.length === 0 && quickSummary ? quickSummary.wishlistCount : wishlistCount,
      global: {
        booksRead: global.booksRead || (books.length === 0 && quickSummary ? quickSummary.readCount : 0),
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
      }))
    };
  }, [books, isBookInFilter, quickSummary]);

  const currentlyReading = useMemo(() => books.find(b => b.status === BookStatus.Reading) || null, [books]);

  return {
    books, stats, currentlyReading, addBook, updateBook, deleteBook, 
    dateFilter, setDateFilter, selectedYear, setSelectedYear, availableYears,
    customRange, setCustomRange, isLocalMode, schemaError, isLoading
  };
};
