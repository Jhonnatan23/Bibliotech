
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Book, ReadingStats, NewBook, DateFilter, MonthlyStat, TypeStat } from '../types';
import { BookStatus, BookType } from '../types';
import { dbService } from '../services/database';
import { generateBookCover } from '../services/geminiService';
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
  
  const autoGenRunning = useRef(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setSchemaError(null);
    try {
      dbService.setSchemaErrorCallback((type, detail) => {
          setSchemaError({ type, detail });
          setIsLocalMode(true);
      });

      const [storedBooks, quickStats] = await Promise.all([
        dbService.getAllBooks(),
        dbService.getQuickStatsSummary()
      ]);

      if (quickStats) setQuickSummary(quickStats);
      setBooks(storedBooks);
    } catch (error: any) {
      console.error('Erro crítico ao carregar dados:', error.message);
      setIsLocalMode(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addBook = useCallback(async (newBook: NewBook) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Necessário login.");

    const book: Book = {
      ...newBook,
      id: crypto.randomUUID(),
      user_id: user.id,
      dateAdded: newBook.dateAdded || new Date().toISOString().split('T')[0],
    };
    
    // Atualiza estado local imediatamente para feedback instantâneo
    setBooks(prev => [book, ...prev]);
    
    try {
        await dbService.saveBook(book);
    } catch (err: any) {
        console.error("Erro ao persistir novo livro:", err);
        // Se falhar no banco, avisamos mas mantemos no local para não frustrar o usuário
        throw new Error(err.message || "Erro ao salvar no banco de dados.");
    }
  }, []);

  const updateBook = useCallback(async (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    
    try {
        await dbService.saveBook(updatedBook);
    } catch (err: any) {
        console.error("Erro ao persistir atualização:", err);
        throw new Error(err.message || "Erro ao atualizar no banco de dados.");
    }
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    try {
        await dbService.deleteBook(id);
    } catch (err) {
        console.error("Erro ao deletar do banco:", err);
    }
  }, []);

  useEffect(() => {
    if (isLoading || books.length === 0 || autoGenRunning.current) return;

    const generateCovers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      autoGenRunning.current = true;
      const booksWithoutCover = books.filter(b => 
        !b.coverImageUrl || 
        b.coverImageUrl.includes('picsum.photos')
      );

      if (booksWithoutCover.length > 0) {
        for (const book of booksWithoutCover) {
          try {
            const newCoverUrl = await generateBookCover(book.title, book.genre, book.type, book.author);
            if (newCoverUrl && !newCoverUrl.includes('picsum.photos')) {
              await updateBook({ ...book, coverImageUrl: newCoverUrl });
            }
          } catch (err) {
            console.error(`Erro ao gerar capa para ${book.title}:`, err);
            break; 
          }
        }
      }
      autoGenRunning.current = false;
    };

    const timer = setTimeout(generateCovers, 3000); 
    return () => clearTimeout(timer);
  }, [isLoading, books.length, updateBook]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    books.forEach(book => {
      if (book.dateFinished) years.add(new Date(book.dateFinished).getFullYear());
      else if (book.dateAdded) years.add(new Date(book.dateAdded).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (book.status !== BookStatus.Read) return true;
      if (!book.dateFinished) return true;

      const finishDate = new Date(book.dateFinished);
      if (dateFilter === 'thisYear') {
        return finishDate.getFullYear() === new Date().getFullYear();
      }
      if (dateFilter === 'specificYear') {
        return finishDate.getFullYear() === selectedYear;
      }
      if (dateFilter === 'custom') {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        return finishDate >= start && finishDate <= end;
      }
      return true;
    });
  }, [books, dateFilter, selectedYear, customRange]);

  const stats: ReadingStats = useMemo(() => {
    let tbrCount = quickSummary?.tbrCount || 0;
    let wishlistCount = quickSummary?.wishlistCount || 0;
    
    if (books.length > 0) {
      tbrCount = 0;
      wishlistCount = 0;
      books.forEach(book => {
        if (book.status === BookStatus.TBR) tbrCount++;
        if (book.status === BookStatus.Wishlist) wishlistCount++;
      });
    }

    const yearly = { booksRead: 0, pagesRead: 0, totalRating: 0, ratingCount: 0 };
    const monthlyDataMap = MONTHS.map(month => ({ month, booksRead: 0, pagesRead: 0, totalRating: 0, ratingCount: 0 }));
    const byTypeMap: Record<string, { type: BookType, count: number, pages: number, totalRating: 0, ratingCount: 0 }> = {
      [BookType.Book]: { type: BookType.Book, count: 0, pages: 0, totalRating: 0, ratingCount: 0 },
      [BookType.HQ]: { type: BookType.HQ, count: 0, pages: 0, totalRating: 0, ratingCount: 0 }
    };

    filteredBooks.forEach(book => {
      if (book.status === BookStatus.Read) {
        yearly.booksRead++;
        yearly.pagesRead += (book.pages || 0);
        if (book.rating) {
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

        const tData = byTypeMap[book.type];
        if (tData) {
          tData.count++;
          tData.pages += (book.pages || 0);
          if (book.rating) {
            tData.totalRating += book.rating;
            tData.ratingCount++;
          }
        }
      }
    });

    return {
      tbrCount,
      wishlistCount,
      yearly: {
        booksRead: books.length === 0 && quickSummary ? quickSummary.readCount : yearly.booksRead,
        pagesRead: yearly.pagesRead,
        avgRating: yearly.ratingCount > 0 ? yearly.totalRating / yearly.ratingCount : 0
      },
      monthly: monthlyDataMap.map(m => ({
        month: m.month,
        booksRead: m.booksRead,
        pagesRead: m.pagesRead,
        avgRating: m.ratingCount > 0 ? m.totalRating / m.ratingCount : 0
      })),
      byType: Object.values(byTypeMap).map(t => ({
        type: t.type,
        count: t.count,
        pages: t.pages,
        avgRating: t.ratingCount > 0 ? t.totalRating / t.ratingCount : 0
      }))
    };
  }, [books, filteredBooks, quickSummary]);

  const currentlyReading = useMemo(() => {
    return books.find(b => b.status === BookStatus.Reading) || null;
  }, [books]);

  return {
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
  };
};
