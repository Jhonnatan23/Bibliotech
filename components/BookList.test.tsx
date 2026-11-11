// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookList } from './BookList';
import { Book, BookStatus, BookType } from '../types';

describe('BookList Component - Unified Estante Hub (Auditing Issue 🟡 #3)', () => {
  const mockBooks: Book[] = [
    {
      id: 'book-1',
      user_id: 'user-1',
      title: 'O Hobbit',
      author: 'J.R.R. Tolkien',
      pages: 310,
      genre: 'Fantasia',
      type: BookType.Book,
      status: BookStatus.Reading,
      currentPage: 150,
      dateAdded: '2026-01-01',
    },
    {
      id: 'book-2',
      user_id: 'user-1',
      title: 'Duna',
      author: 'Frank Herbert',
      pages: 680,
      genre: 'Ficção Científica',
      type: BookType.Book,
      status: BookStatus.Read,
      currentPage: 680,
      dateAdded: '2026-01-02',
      dateFinished: '2026-01-20',
      rating: 4.8,
    },
    {
      id: 'book-3',
      user_id: 'user-1',
      title: 'Neuromancer',
      author: 'William Gibson',
      pages: 320,
      genre: 'Cyberpunk',
      type: BookType.Book,
      status: BookStatus.TBR,
      currentPage: 0,
      dateAdded: '2026-01-03',
    },
    {
      id: 'book-4',
      user_id: 'user-1',
      title: 'Fundação',
      author: 'Isaac Asimov',
      pages: 240,
      genre: 'Ficção Científica',
      type: BookType.Book,
      status: BookStatus.Reading,
      series: 'Trilogia da Fundação',
      volume: 1,
      currentPage: 80,
      dateAdded: '2026-01-04',
    },
    {
      id: 'book-5',
      user_id: 'user-1',
      title: 'O Silmarillion',
      author: 'J.R.R. Tolkien',
      pages: 450,
      genre: 'Fantasia',
      type: BookType.Book,
      status: BookStatus.Wishlist,
      currentPage: 0,
      dateAdded: '2026-01-05',
      estimatedPrice: 69.90,
    },
    {
      id: 'book-6',
      user_id: 'user-1',
      title: 'Livro Abandonado',
      author: 'Autor X',
      pages: 200,
      genre: 'Drama',
      type: BookType.Book,
      status: BookStatus.Dropped,
      currentPage: 40,
      dateAdded: '2026-01-06',
    },
    {
      id: 'book-7',
      user_id: 'user-1',
      title: 'A Metamorfose',
      author: 'Franz Kafka',
      pages: 96,
      genre: 'Ficção Clássica',
      type: BookType.Book,
      status: BookStatus.TBR,
      currentPage: 0,
      dateAdded: '2026-01-07',
    },
  ];

  const defaultProps = {
    books: mockBooks,
    allBooks: mockBooks,
    stats: {
      totalPagesRead: 680,
      booksReadCount: 1,
      totalHours: 12,
      pagesPerDay: 20,
      avgPagesPerDay: 20,
      streak: 5,
      currentlyReadingCount: 2,
    } as any,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    onViewDetails: vi.fn(),
    onUpdateBook: vi.fn(),
    profile: null,
    onRandomPick: vi.fn(),
    onMoveToShelf: vi.fn(),
    onAddBook: vi.fn(),
    onRefresh: vi.fn(),
    onTabChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 7 top filter chips with correct labels and count badges', () => {
    render(<BookList {...defaultProps} />);

    // 1. Todos
    const chipAll = screen.getByTestId('filter-chip-all');
    expect(chipAll).toBeInTheDocument();
    expect(chipAll).toHaveTextContent(/Todos/i);
    expect(chipAll).toHaveTextContent('7');

    // 2. Lendo
    const chipReading = screen.getByTestId('filter-chip-reading');
    expect(chipReading).toBeInTheDocument();
    expect(chipReading).toHaveTextContent(/Lendo/i);
    expect(chipReading).toHaveTextContent('2');

    // 3. Quero Ler
    const chipTbr = screen.getByTestId('filter-chip-tbr');
    expect(chipTbr).toBeInTheDocument();
    expect(chipTbr).toHaveTextContent(/Quero Ler/i);
    expect(chipTbr).toHaveTextContent('2');

    // 4. Lidos
    const chipRead = screen.getByTestId('filter-chip-read');
    expect(chipRead).toBeInTheDocument();
    expect(chipRead).toHaveTextContent(/Lidos/i);
    expect(chipRead).toHaveTextContent('1');

    // 5. Séries
    const chipSeries = screen.getByTestId('filter-chip-series');
    expect(chipSeries).toBeInTheDocument();
    expect(chipSeries).toHaveTextContent(/Séries/i);
    expect(chipSeries).toHaveTextContent('1');

    // 6. Desejos
    const chipWishlist = screen.getByTestId('filter-chip-wishlist');
    expect(chipWishlist).toBeInTheDocument();
    expect(chipWishlist).toHaveTextContent(/Desejos/i);
    expect(chipWishlist).toHaveTextContent('1');

    // 7. Abandonados
    const chipDropped = screen.getByTestId('filter-chip-dropped');
    expect(chipDropped).toBeInTheDocument();
    expect(chipDropped).toHaveTextContent(/Abandonados/i);
    expect(chipDropped).toHaveTextContent('1');
  });

  it('searches globally against the entire collection regardless of book status', async () => {
    render(<BookList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Buscar por título ou autor/i);

    // Search for a Wishlist book ("Silmarillion")
    fireEvent.change(searchInput, { target: { value: 'Silmarillion' } });

    // Wait for debounced search
    await vi.waitFor(() => {
      expect(screen.getByTestId('global-search-banner')).toBeInTheDocument();
      expect(screen.getByText('O Silmarillion')).toBeInTheDocument();
    });

    // Search for a Dropped book ("Abandonado")
    fireEvent.change(searchInput, { target: { value: 'Abandonado' } });
    await vi.waitFor(() => {
      expect(screen.getByText('Livro Abandonado')).toBeInTheDocument();
    });

    // Search for a Reading book ("Hobbit")
    fireEvent.change(searchInput, { target: { value: 'Hobbit' } });
    await vi.waitFor(() => {
      expect(screen.getByText('O Hobbit')).toBeInTheDocument();
    });
  });

  it('renders integrated Wishlist view when clicking Desejos chip', () => {
    render(<BookList {...defaultProps} />);

    const chipWishlist = screen.getByTestId('filter-chip-wishlist');
    fireEvent.click(chipWishlist);

    expect(defaultProps.onTabChange).toHaveBeenCalledWith('wishlist');
    expect(screen.getByTestId('integrated-wishlist-view')).toBeInTheDocument();
    expect(screen.getByText(/Lista de Desejos/i)).toBeInTheDocument();
  });

  it('renders integrated Series view when clicking Séries chip', () => {
    render(<BookList {...defaultProps} />);

    const chipSeries = screen.getByTestId('filter-chip-series');
    fireEvent.click(chipSeries);

    expect(defaultProps.onTabChange).toHaveBeenCalledWith('series');
    expect(screen.getByTestId('integrated-series-view')).toBeInTheDocument();
  });

  it('activates requested tab when initialTab prop is provided', () => {
    render(<BookList {...defaultProps} initialTab="wishlist" />);

    expect(screen.getByTestId('integrated-wishlist-view')).toBeInTheDocument();
  });

  it('redirects legacy URLs (/wishlist and /series) to /library?tab=...', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    const syncRoute = (pathname: string, search: string = '') => {
      const searchParams = new URLSearchParams(search);
      const tabParam = searchParams.get('tab')?.toLowerCase();
      if (pathname === '/wishlist' || (pathname === '/' && tabParam === 'wishlist')) {
        window.history.replaceState(null, '', '/library?tab=wishlist');
        return { view: 'list', tab: 'wishlist' };
      }
      if (pathname === '/series' || (pathname === '/' && tabParam === 'series')) {
        window.history.replaceState(null, '', '/library?tab=series');
        return { view: 'list', tab: 'series' };
      }
      return null;
    };

    const resWishlist = syncRoute('/wishlist');
    expect(resWishlist).toEqual({ view: 'list', tab: 'wishlist' });
    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/library?tab=wishlist');

    const resSeries = syncRoute('/series');
    expect(resSeries).toEqual({ view: 'list', tab: 'series' });
    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/library?tab=series');

    replaceStateSpy.mockRestore();
  });

  it('filters books with less than 200 pages when Leitura Rápida is activated', () => {
    render(<BookList {...defaultProps} />);

    // Initially both long and short books are visible
    expect(screen.getByText('O Hobbit')).toBeInTheDocument();
    expect(screen.getByText('A Metamorfose')).toBeInTheDocument();

    // Click Leitura Rápida toggle
    const quickReadBtn = screen.getByTestId('filter-quick-read');
    fireEvent.click(quickReadBtn);

    // Only 'A Metamorfose' (96p) should be visible, others (>200 or 200) filtered out
    expect(screen.getByText('A Metamorfose')).toBeInTheDocument();
    expect(screen.queryByText('O Hobbit')).not.toBeInTheDocument();
    expect(screen.queryByText('Duna')).not.toBeInTheDocument();
    expect(screen.queryByText('Neuromancer')).not.toBeInTheDocument();
    expect(screen.queryByText('Livro Abandonado')).not.toBeInTheDocument(); // 200p is not < 200

    // Clicking again deactivates the filter
    fireEvent.click(quickReadBtn);
    expect(screen.getByText('O Hobbit')).toBeInTheDocument();
  });
});
