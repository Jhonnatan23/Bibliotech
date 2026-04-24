
import type { NewBook, BookType } from '../types';
import { BookStatus } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

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
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books${API_KEY ? `&key=${API_KEY}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Erro ao consultar Google Books');

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title || 'Título Desconhecido',
      authors: item.volumeInfo.authors || ['Autor Desconhecido'],
      pageCount: item.volumeInfo.pageCount || 0,
      categories: item.volumeInfo.categories || [],
      description: item.volumeInfo.description || '',
      publishedDate: item.volumeInfo.publishedDate || '',
      publisher: item.volumeInfo.publisher,
      averageRating: item.volumeInfo.averageRating,
      ratingsCount: item.volumeInfo.ratingsCount,
      previewLink: item.volumeInfo.previewLink,
      infoLink: item.volumeInfo.infoLink,
    }));
  } catch (error) {
    console.error('Erro na busca do Google Books:', error);
    return [];
  }
};

export const fetchBookByIsbn = async (isbn: string): Promise<GoogleBookResult | null> => {
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
  if (!cleanIsbn) return null;

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}${API_KEY ? `&key=${API_KEY}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Erro ao consultar ISBN no Google Books');

    const data = await response.json();
    if (!data.items || data.items.length === 0) return null;

    const item = data.items[0];
    return {
      id: item.id,
      title: item.volumeInfo.title || 'Título Desconhecido',
      authors: item.volumeInfo.authors || ['Autor Desconhecido'],
      pageCount: item.volumeInfo.pageCount || 0,
      categories: item.volumeInfo.categories || [],
      description: item.volumeInfo.description || '',
      publishedDate: item.volumeInfo.publishedDate || '',
      publisher: item.volumeInfo.publisher,
      averageRating: item.volumeInfo.averageRating,
      ratingsCount: item.volumeInfo.ratingsCount,
      previewLink: item.volumeInfo.previewLink,
      infoLink: item.volumeInfo.infoLink,
    };
  } catch (error) {
    console.error('Erro na busca por ISBN:', error);
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
    status: BookStatus.Wishlist,
    dateAdded: new Date().toISOString().split('T')[0],
    summary: gBook.description ? gBook.description.substring(0, 1000) : '',
    currentPage: 0,
    timesRead: 0,
    wasWishlist: true
  };
};
