
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Book, ReadingStats, NewBook, DateFilter } from '../types';
import { BookStatus, BookType } from '../types';
import { generateBookCover, generateBookSummary } from '../services/geminiService';
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
    dateStarted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    coverImageUrl: 'https://picsum.photos/seed/lotr/400/600',
    summary: 'Em uma terra fantástica e única, um hobbit recebe de presente de seu tio um anel mágico e maligno que precisa ser destruído antes que caia nas mãos do mal.',
  },
  { 
    id: '2', 
    title: 'Duna', 
    author: 'Frank Herbert', 
    pages: 688, 
    genre: 'Ficção Científica', 
    type: BookType.Book, 
    status: BookStatus.Read, 
    rating: 9, 
    yearRead: 2024, 
    monthRead: 'Julho', 
    dateAdded: '2024-02-10',
    dateStarted: '2024-06-20',
    dateFinished: '2024-07-15'
  },
];

export const useBookData = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('thisYear');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customRange, setCustomRange] = useState({ 
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Carregar dados iniciais do IndexedDB
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedBooks = await dbService.getAllBooks();
        if (storedBooks.length === 0) {
          // Se estiver vazio, popula com dados de exemplo e salva no banco
          for (const book of INITIAL_BOOKS) {
            await dbService.saveBook(book);
          }
          setBooks(INITIAL_BOOKS);
        } else {
          setBooks(storedBooks);
        }
      } catch (error) {
        console.error('Failed to load books from DB:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    books.forEach(b => {
      if (b.dateFinished) {
        years.add(new Date(b.dateFinished).getFullYear());
      } else if (b.yearRead) {
        years.add(b.yearRead);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  const stats: ReadingStats = useMemo(() => {
    const currentYear = new Date().getFullYear();

    const filteredReadBooks = books.filter(b => {
      if (b.status !== BookStatus.Read) return false;
      const finishedDateStr = b.dateFinished || (b.yearRead ? `${b.yearRead}-01-01` : null);
      if (!finishedDateStr) return false;

      const date = new Date(finishedDateStr);
      const year = date.getFullYear();
      
      if (dateFilter === 'thisYear') return year === currentYear;
      if (dateFilter === 'allTime') return true;
      if (dateFilter === 'specificYear') return year === selectedYear;
      if (dateFilter === 'custom') {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        return date >= start && date <= end;
      }
      return true;
    });

    const booksWithRating = filteredReadBooks.filter(b => typeof b.rating === 'number');
    
    const yearly = {
        booksRead: filteredReadBooks.length,
        pagesRead: filteredReadBooks.reduce((acc, book) => acc + book.pages, 0),
        avgRating: booksWithRating.length > 0
            ? booksWithRating.reduce((acc, book) => acc + (book.rating || 0), 0) / booksWithRating.length
            : 0,
    };
    
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const monthly = months.map(monthName => {
        const booksInMonth = filteredReadBooks.filter(b => {
            const dateStr = b.dateFinished || (b.yearRead && b.monthRead ? `${b.yearRead}-${b.monthRead}-01` : null);
            if (!dateStr) return false;
            const date = new Date(dateStr);
            return months[date.getMonth()] === monthName;
        });

        const pagesInMonth = booksInMonth.reduce((acc, book) => acc + book.pages, 0);
        const ratedBooksInMonth = booksInMonth.filter(b => typeof b.rating === 'number');
        const avgRatingInMonth = ratedBooksInMonth.length > 0
            ? ratedBooksInMonth.reduce((acc, book) => acc + (book.rating || 0), 0) / ratedBooksInMonth.length
            : 0;
        return {
            month: monthName,
            booksRead: booksInMonth.length,
            pagesRead: pagesInMonth,
            avgRating: avgRatingInMonth,
        };
    });

    const byType = (Object.values(BookType) as BookType[]).map(type => {
        const booksOfType = filteredReadBooks.filter(b => b.type === type);
        const pagesOfType = booksOfType.reduce((acc, book) => acc + book.pages, 0);
        const ratedBooksOfType = booksOfType.filter(b => typeof b.rating === 'number');
        return {
            type,
            count: booksOfType.length,
            pages: pagesOfType,
            avgRating: ratedBooksOfType.length > 0 ? ratedBooksOfType.reduce((acc, b) => acc + (b.rating || 0), 0) / ratedBooksOfType.length : 0,
        };
    });

    const tbrCount = books.filter(b => b.status === BookStatus.TBR).length;
    const wishlistCount = books.filter(b => b.status === BookStatus.Wishlist).length;

    return { tbrCount, wishlistCount, yearly, monthly, byType };
  }, [books, dateFilter, customRange, selectedYear]);

  // Modificado para selecionar o livro mais recente que está sendo lido
  const currentlyReading = useMemo(() => {
    const reading = books.filter(book => book.status === BookStatus.Reading);
    if (reading.length === 0) return null;
    
    // Ordenar por data de início (mais recente primeiro)
    return reading.sort((a, b) => {
        const dateA = a.dateStarted ? new Date(a.dateStarted).getTime() : 0;
        const dateB = b.dateStarted ? new Date(b.dateStarted).getTime() : 0;
        return dateB - dateA;
    })[0];
  }, [books]);
  
  const addBook = useCallback(async (newBookData: NewBook) => {
    const id = Date.now().toString();
    const summary = newBookData.summary || await generateBookSummary(newBookData.title, newBookData.author);
    const coverImageUrl = newBookData.coverImageUrl || await generateBookCover(newBookData.title, newBookData.genre, newBookData.type);
    const newBook: Book = { ...newBookData, id, summary, coverImageUrl };
    
    try {
      await dbService.saveBook(newBook);
      setBooks(prev => [...prev, newBook]);
    } catch (error) {
      console.error('Error adding book to DB:', error);
    }
  }, []);

  const updateBook = useCallback(async (updatedBook: Book) => {
    try {
      await dbService.saveBook(updatedBook);
      setBooks(prev => prev.map(book => book.id === updatedBook.id ? updatedBook : book));
    } catch (error) {
      console.error('Error updating book in DB:', error);
    }
  }, []);
  
  const deleteBook = useCallback(async (bookId: string) => {
    try {
      await dbService.deleteBook(bookId);
      setBooks(prev => prev.filter(book => book.id !== bookId));
    } catch (error) {
      console.error('Error deleting book from DB:', error);
    }
  }, []);

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
    isLoading
  };
};
