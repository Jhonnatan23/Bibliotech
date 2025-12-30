
import { useState, useMemo, useCallback } from 'react';
import type { Book, ReadingStats, NewBook, DateFilter } from '../types';
import { BookStatus, BookType } from '../types';
import { generateBookCover, generateBookSummary } from '../services/geminiService';

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
  { id: '3', title: 'Watchmen', author: 'Alan Moore', pages: 464, genre: 'Super-herói', type: BookType.HQ, status: BookStatus.Read, rating: 10, yearRead: 2024, monthRead: 'Julho', dateAdded: '2024-03-05', dateFinished: '2024-07-20' },
  { id: '8', title: 'Neuromancer', author: 'William Gibson', pages: 320, genre: 'Ficção Científica, Cyberpunk', type: BookType.Book, status: BookStatus.TBR, dateAdded: '2024-08-20' },
];

export const useBookData = () => {
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [dateFilter, setDateFilter] = useState<DateFilter>('thisYear');
  const [customRange, setCustomRange] = useState({ 
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const stats: ReadingStats = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // Filtra livros lidos com base no período selecionado
    const filteredReadBooks = books.filter(b => {
      if (b.status !== BookStatus.Read) return false;
      const finishedDate = b.dateFinished || `${b.yearRead}-${b.monthRead}-01`; // Fallback simple para compatibilidade
      if (!finishedDate) return false;

      const date = new Date(finishedDate);
      
      if (dateFilter === 'thisYear') return date.getFullYear() === currentYear;
      if (dateFilter === 'allTime') return true;
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
        // Para o gráfico mensal, agrupamos os livros do período filtrado pelo mês de conclusão
        const booksInMonth = filteredReadBooks.filter(b => {
            const date = new Date(b.dateFinished || '');
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
  }, [books, dateFilter, customRange]);

  const currentlyReading = useMemo(() => books.find(book => book.status === BookStatus.Reading) || null, [books]);
  
  const addBook = useCallback(async (newBookData: NewBook) => {
    const id = Date.now().toString();
    const summary = newBookData.summary || await generateBookSummary(newBookData.title, newBookData.author);
    const coverImageUrl = newBookData.coverImageUrl || await generateBookCover(newBookData.title, newBookData.genre, newBookData.type);
    const newBook: Book = { ...newBookData, id, summary, coverImageUrl };
    setBooks(prev => [...prev, newBook]);
  }, []);

  const updateBook = useCallback((updatedBook: Book) => {
    setBooks(prev => prev.map(book => book.id === updatedBook.id ? updatedBook : book));
  }, []);
  
  const deleteBook = useCallback((bookId: string) => {
    setBooks(prev => prev.filter(book => book.id !== bookId));
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
    customRange,
    setCustomRange
  };
};
