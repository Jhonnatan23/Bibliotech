
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
  
  const autoGenRunning = useRef(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      dbService.setSchemaErrorCallback((type, detail) => {
          setSchemaError({ type, detail });
          setIsLocalMode(true);
      });

      const storedBooks = await dbService.getAllBooks();
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
      dateAdded: new Date().toISOString().split('T')[0],
    };
    
    // Atualiza o estado local primeiro (UI instantânea)
    setBooks(prev => [book, ...prev]);
    
    try {
        // Tenta salvar no banco
        await dbService.saveBook(book);
    } catch (err) {
        console.error("Erro ao persistir novo livro:", err);
    }
  }, []);

  const updateBook = useCallback(async (updatedBook: Book) => {
    // Atualiza o estado local primeiro (UI instantânea)
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    
    try {
        // Tenta salvar no banco
        await dbService.saveBook(updatedBook);
    } catch (err) {
        console.error("Erro ao persistir atualização:", err);
    }
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    await dbService.deleteBook(id);
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
        // Processa um por um para não sobrecarregar
        for (const book of booksWithoutCover) {
          try {
            const newCoverUrl = await generateBookCover(book.title, book.genre, book.type);
            // Se gerou uma capa real (não placeholder)
            if (newCoverUrl && !newCoverUrl.includes('picsum.photos')) {
              await updateBook({ ...book, coverImageUrl: newCoverUrl });
            }
          } catch (err) {
            console.error(`Erro ao gerar capa para ${book.title}:`, err);
            // Se falhou por cota ou erro de IA, não tentamos novamente nesta sessão
          }
        }
      }
      autoGenRunning.current = false;
    };

    generateCovers();
  }, [isLoading, books.length, updateBook]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    books.forEach(book => {
      if (book.dateFinished) years.add(new Date(book.dateFinished).getFullYear());
      if (book.dateAdded) years.add(new Date(book.dateAdded).getFullYear());
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
    const readBooks = filteredBooks.filter(b => b.status === BookStatus.Read);
    
    const yearly = {
      booksRead: readBooks.length,
      pagesRead: readBooks.reduce((acc, b) => acc + (b.pages || 0), 0),
      avgRating: readBooks.length > 0 
        ? readBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / (readBooks.filter(b => b.rating).length || 1)
        : 0
    };

    const monthly: MonthlyStat[] = MONTHS.map((month, index) => {
      const monthBooks = readBooks.filter(b => {
        if (!b.dateFinished) return false;
        return new Date(b.dateFinished).getMonth() === index;
      });
      return {
        month,
        booksRead: monthBooks.length,
        pagesRead: monthBooks.reduce((acc, b) => acc + (b.pages || 0), 0),
        avgRating: monthBooks.length > 0 
          ? monthBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / (monthBooks.filter(b => b.rating).length || 1)
          : 0
      };
    });

    const byType: TypeStat[] = [BookType.Book, BookType.HQ].map(type => {
      const typeBooks = readBooks.filter(b => b.type === type);
      return {
        type,
        count: typeBooks.length,
        pages: typeBooks.reduce((acc, b) => acc + (b.pages || 0), 0),
        avgRating: typeBooks.length > 0 
          ? typeBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / (typeBooks.filter(b => b.rating).length || 1)
          : 0
      };
    });

    return {
      tbrCount: books.filter(b => b.status === BookStatus.TBR).length,
      wishlistCount: books.filter(b => b.status === BookStatus.Wishlist).length,
      yearly,
      monthly,
      byType
    };
  }, [books, filteredBooks]);

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
