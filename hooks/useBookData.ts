
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
    dateStarted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 dias atrás
    coverImageUrl: 'https://picsum.photos/seed/lotr/400/600',
    summary: 'Em uma terra fantástica e única, um hobbit recebe de presente de seu tio um anel mágico e maligno que precisa ser destruído antes que caia nas mãos do mal. Para isso, ele precisa unir forças com elfos, anões, magos e humanos para conseguir destruí-lo.',
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
  { id: '3', title: 'Watchmen', author: 'Alan Moore', pages: 464, genre: 'Super-herói', type: BookType.HQ, status: BookStatus.Read, rating: 10, yearRead: 2024, monthRead: 'Julho', dateAdded: '2024-03-05' },
  { id: '4', title: 'O Guia do Mochileiro das Galáxias', author: 'Douglas Adams', pages: 208, genre: 'Ficção Científica, Comédia', type: BookType.Book, status: BookStatus.Read, rating: 8, yearRead: 2024, monthRead: 'Junho', dateAdded: '2024-04-12' },
  { id: '5', title: 'Maus', author: 'Art Spiegelman', pages: 296, genre: 'Biografia', type: BookType.HQ, status: BookStatus.Read, rating: 9, yearRead: 2024, monthRead: 'Junho', dateAdded: '2024-05-20' },
  { id: '6', title: 'A Guerra dos Tronos', author: 'George R. R. Martin', pages: 600, genre: 'Fantasia', type: BookType.Book, status: BookStatus.Wishlist, summary: 'As famílias mais poderosas dos Sete Reinos de Westeros lutam pelo Trono de Ferro, enquanto uma antiga ameaça ressurge no Norte.', estimatedPrice: 59.90, dateAdded: '2024-06-15'},
  { id: '7', title: 'Persépolis', author: 'Marjane Satrapi', pages: 152, genre: 'Autobiografia, HQ', type: BookType.HQ, status: BookStatus.Wishlist, summary: 'Uma poderosa história em quadrinhos autobiográfica que narra a infância e a adolescência da autora durante a Revolução Islâmica no Irã.', estimatedPrice: 45.50, dateAdded: '2024-07-01'},
  { id: '8', title: 'Neuromancer', author: 'William Gibson', pages: 320, genre: 'Ficção Científica, Cyberpunk', type: BookType.Book, status: BookStatus.TBR, dateAdded: '2024-08-20' },
  { id: '9', title: 'Sapiens: Uma Breve História da Humanidade', author: 'Yuval Noah Harari', pages: 464, genre: 'Não-ficção, História', type: BookType.Book, status: BookStatus.Read, rating: 9, yearRead: 2023, monthRead: 'Maio', dateAdded: '2023-01-10' },
];


export const useBookData = () => {
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [dateFilter, setDateFilter] = useState<DateFilter>('thisYear');

  const stats: ReadingStats = useMemo(() => {
    const currentYear = new Date().getFullYear();

    const readBooks = books.filter(b => b.status === BookStatus.Read && b.yearRead);
    
    const filteredReadBooks = dateFilter === 'thisYear'
        ? readBooks.filter(b => b.yearRead === currentYear)
        : readBooks;

    const booksWithRating = filteredReadBooks.filter(b => typeof b.rating === 'number');
    
    const yearly = {
        booksRead: filteredReadBooks.length,
        pagesRead: filteredReadBooks.reduce((acc, book) => acc + book.pages, 0),
        avgRating: booksWithRating.length > 0
            ? booksWithRating.reduce((acc, book) => acc + (book.rating || 0), 0) / booksWithRating.length
            : 0,
    };
    
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // O gráfico de evolução agora usa o mesmo conjunto de livros filtrado pelo seletor de data global
    const monthly = months.map(monthName => {
        const booksInMonth = filteredReadBooks.filter(b => b.monthRead === monthName);
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
        const ratedBooksOfType = booksOfType.filter(b => typeof b.rating === 'number');
        const pagesOfType = booksOfType.reduce((acc, book) => acc + book.pages, 0);
        const avgRatingOfType = ratedBooksOfType.length > 0
            ? ratedBooksOfType.reduce((acc, book) => acc + (book.rating || 0), 0) / ratedBooksOfType.length
            : 0;
        return {
            type,
            count: booksOfType.length,
            pages: pagesOfType,
            avgRating: avgRatingOfType,
        };
    });

    const tbrCount = books.filter(b => b.status === BookStatus.TBR).length;
    const wishlistCount = books.filter(b => b.status === BookStatus.Wishlist).length;

    return { tbrCount, wishlistCount, yearly, monthly, byType };
  }, [books, dateFilter]);

  const currentlyReading = useMemo(() => {
    return books.find(book => book.status === BookStatus.Reading) || null;
  }, [books]);
  
  const addBook = useCallback(async (newBookData: NewBook) => {
    const id = (books.length + 1).toString() + Date.now();
    
    const summary = (newBookData.summary && newBookData.summary.trim() !== '') 
      ? newBookData.summary 
      : await generateBookSummary(newBookData.title, newBookData.author);
      
    const coverImageUrl = newBookData.coverImageUrl || await generateBookCover(newBookData.title, newBookData.genre, newBookData.type);

    const newBook: Book = {
      ...newBookData,
      id,
      summary,
      coverImageUrl,
      dateAdded: newBookData.dateAdded || new Date().toISOString().split('T')[0],
      dateStarted: newBookData.status === BookStatus.Reading ? (newBookData.dateStarted || new Date().toISOString().split('T')[0]) : newBookData.dateStarted,
      dateFinished: newBookData.status === BookStatus.Read ? (newBookData.dateFinished || new Date().toISOString().split('T')[0]) : undefined
    };
    
    setBooks(prev => [...prev, newBook]);
  }, [books.length]);

  const updateBook = useCallback((updatedBook: Book) => {
    setBooks(prev => prev.map(book => {
      if (book.id === updatedBook.id) {
        let finalBook = { ...updatedBook };
        
        // Se mudou para Reading e não tinha data de início, define hoje
        if (updatedBook.status === BookStatus.Reading && !updatedBook.dateStarted) {
          finalBook.dateStarted = new Date().toISOString().split('T')[0];
        }
        
        // Se mudou para Read e não tinha data de fim, define hoje
        if (updatedBook.status === BookStatus.Read && !updatedBook.dateFinished) {
          finalBook.dateFinished = new Date().toISOString().split('T')[0];
        }
        
        return finalBook;
      }
      return book;
    }));
  }, []);
  
  const deleteBook = useCallback((bookId: string) => {
    setBooks(prev => prev.filter(book => book.id !== bookId));
  }, []);

  return { books, stats, currentlyReading, addBook, updateBook, deleteBook, dateFilter, setDateFilter };
};
