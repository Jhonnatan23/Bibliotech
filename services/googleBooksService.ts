
import type { NewBook, BookType } from '../types';
import { BookStatus } from '../types';
import { logger } from './monitoring';

export interface GoogleBookResult {
  id: string;
  title: string;
  authors: string[];
  pageCount: number;
  categories: string[];
  description: string;
  publishedDate: string;
  publisher?: string;
  averageRating?: number;
  ratingsCount?: number;
  previewLink?: string;
  infoLink?: string;
}

export const searchGoogleBooks = async (query: string): Promise<GoogleBookResult[]> => {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `/api/search-books?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);

    if (!response.ok) {
      logger.warn('Google Books Proxy retornou status não-ok:', { status: response.status });
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.warn('Não foi possível conectar ao Google Books Proxy para busca de livros:', { error: error.message || error });
    return [];
  }
};

export const fetchBookByIsbn = async (isbn: string): Promise<GoogleBookResult | null> => {
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
  if (!cleanIsbn) return null;

  try {
    const url = `/api/search-books?isbn=${cleanIsbn}`;
    const response = await fetch(url);

    if (!response.ok) {
      logger.warn('Google Books Proxy (ISBN) retornou status não-ok:', { status: response.status });
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.warn('Não foi possível conectar ao Google Books Proxy para busca por ISBN:', { error: error.message || error });
    return null;
  }
};

export const mapGoogleToNewBook = (gBook: GoogleBookResult): NewBook => {
  return {
    title: gBook.title,
    author: gBook.authors.join(', '),
    pages: gBook.pageCount,
    genre: gBook.categories.length > 0 ? gBook.categories[0] : 'Não especificado',
    type: 'Livro' as any,
    status: BookStatus.TBR,
    dateAdded: new Date().toISOString().split('T')[0],
    summary: gBook.description ? gBook.description.substring(0, 1000) : '',
    currentPage: 0,
    timesRead: 0,
    wasWishlist: false
  };
};
