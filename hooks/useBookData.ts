
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Book, ReadingStats, NewBook, DateFilter, MonthlyStat, TypeStat } from '../types';
import { BookStatus, BookType } from '../types';
import { dbService } from '../services/database';

const INITIAL_BOOKS: Book[] = [
  {
    id: '1',
    title: 'O Senhor dos Anéis - A Sociedade do Anel',
    author: 'J.R.R. Tolkien',
    pages: 434,
    genre: 'Aventura, Fantasia',
    type: BookType.Book,
    status: BookStatus.Reading,
    currentPage: 152,
    dateAdded: '2024-01-15',
    dateStarted: '2024-01-10',
    coverImageUrl: 'https://picsum.photos/seed/lotr/400/600',
    summary: 'Em uma terra fantástica e única, um hobbit recebe de presente de seu tio um anel mágico e maligno.',
  }
];

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const useBookData = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('allTime');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customRange, setCustomRange] = useState({ 
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedBooks = await dbService.getAllBooks();
      if (storedBooks.length === 0) {
        setBooks(INITIAL_BOOKS);
      } else {
        setBooks(storedBooks);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error.message || 'Erro desconhecido');
      setBooks(INITIAL_BOOKS);
      setIsLocalMode(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    books.forEach(b => {
      const date = b.dateFinished || b.dateAdded;
      if (date) {
          const year = new Date(date).getFullYear();
          if (!isNaN(year)) years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  const stats: ReadingStats = useMemo(() => {
    const filtered = books.filter(b => {
      if (b.status !== BookStatus.Read) return false;
      const date = b.dateFinished ? new Date(b.dateFinished) : null;
      if (!date) return false;

      if (dateFilter === 'thisYear') {
        return date.getFullYear() === new Date().getFullYear();
      }
      if (dateFilter === 'specificYear') {
        return date.getFullYear() === selectedYear;
      }
      if (dateFilter === 'custom') {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        return date >= start && date <= end;
      }
      return true;
    });

    const yearly = {
      booksRead: filtered.length,
      pagesRead: filtered.reduce((acc, b) => acc + (b.pages || 0), 0),
      avgRating: filtered.length > 0 ? filtered.reduce((acc, b) => acc + (b.rating || 0), 0) / filtered.length : 0
    };

    const monthly: MonthlyStat[] = MONTHS.map((m, idx) => {
      const monthBooks = filtered.filter(b => {
        const dateStr = b.dateFinished;
        if (!dateStr) return false;
        return new Date(dateStr).getMonth() === idx;
      });
      return {
        month: m,
        booksRead: monthBooks.length,
        pagesRead: monthBooks.reduce((acc, b) => acc + (b.pages || 0), 0),
        avgRating: monthBooks.length > 0 ? monthBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / monthBooks.length : 0
      };
    });

    const byType: TypeStat[] = [BookType.Book, BookType.HQ].map(type => {
      const typeBooks = filtered.filter(b => b.type === type);
      return {
        type,
        count: typeBooks.length,
        pages: typeBooks.reduce((acc, b) => acc + (b.pages || 0), 0),
        avgRating: typeBooks.length > 0 ? typeBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / typeBooks.length : 0
      };
    });

    return {
      tbrCount: books.filter(b => b.status === BookStatus.TBR).length,
      wishlistCount: books.filter(b => b.status === BookStatus.Wishlist).length,
      yearly,
      monthly,
      byType
    };
  }, [books, dateFilter, selectedYear, customRange]);

  const currentlyReading = useMemo(() => {
    return books.find(b => b.status === BookStatus.Reading) || null;
  }, [books]);

  const addBook = async (newBook: NewBook) => {
    const book: Book = {
      ...newBook,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString().split('T')[0]
    };
    await dbService.saveBook(book);
    setBooks(prev => [book, ...prev]);
  };

  const updateBook = async (updatedBook: Book) => {
    await dbService.saveBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
  };

  const deleteBook = async (id: string) => {
    await dbService.deleteBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
  };

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
    isLoading,
    isLocalMode
  };
};
