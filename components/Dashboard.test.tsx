// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { Book, BookStatus, BookType, ReadingStats } from '../types';

describe('Dashboard Component Restructuring Tests', () => {
  const mockUpdateBook = vi.fn().mockResolvedValue(undefined);
  const mockSetDateFilter = vi.fn();
  const mockSetSelectedYear = vi.fn();
  const mockSetReadingGoal = vi.fn();
  const mockAddBook = vi.fn().mockResolvedValue(undefined);
  const mockRandomPick = vi.fn();
  const mockOpenJournal = vi.fn();

  const mockStats: ReadingStats = {
    tbrCount: 2,
    wishlistCount: 3,
    loanedCount: 1,
    global: {
      booksRead: 10,
      pagesRead: 3000,
      avgRating: 4.5,
    },
    yearly: {
      booksRead: 5,
      pagesRead: 1500,
      avgRating: 4.5,
    },
    avgPagesPerDay: 25.0,
    totalSpent: 120.5,
    consistency: 80,
    monthly: [],
    byAuthor: [{ author: 'Machado de Assis', count: 3 }],
    byStatus: [{ status: 'Lido', count: 5 }],
    byType: [{ type: BookType.Book, count: 8, pages: 2000, avgRating: 4.5 }],
    byGenre: [{ genre: 'Ficção', count: 6 }],
  };

  const sampleBook: Book = {
    id: 'book-reading-1',
    user_id: 'user-1',
    title: 'Dom Casmurro',
    author: 'Machado de Assis',
    pages: 256,
    currentPage: 120,
    genre: 'Ficção',
    type: BookType.Book,
    status: BookStatus.Reading,
    dateAdded: '2026-01-01',
    dateStarted: '2026-01-10',
    notes: 'Capitu e os olhos de ressaca',
  };

  const defaultProps = {
    stats: mockStats,
    currentlyReading: sampleBook,
    updateBook: mockUpdateBook,
    dateFilter: 'thisYear' as const,
    setDateFilter: mockSetDateFilter,
    selectedYear: 2026,
    setSelectedYear: mockSetSelectedYear,
    availableYears: [2026, 2025],
    books: [sampleBook],
    readingGoal: 20,
    onSetReadingGoal: mockSetReadingGoal,
    addBook: mockAddBook,
    onRandomPick: mockRandomPick,
    profile: null,
    onOpenJournal: mockOpenJournal,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Foco Diário tab by default with CurrentlyReading and ReadingGoal', () => {
    render(<Dashboard {...defaultProps} />);

    // Tab buttons exist
    const dailyTabBtn = screen.getByTestId('tab-daily-focus');
    const analyticsTabBtn = screen.getByTestId('tab-analytics');
    expect(dailyTabBtn).toBeInTheDocument();
    expect(analyticsTabBtn).toBeInTheDocument();

    // Default view shows currently reading
    expect(screen.getByText('Dom Casmurro')).toBeInTheDocument();
    expect(screen.getByText(/Machado de Assis/i)).toBeInTheDocument();

    // Diário shortcut card should be visible
    expect(screen.getByText(/Diário & Reflexões/i)).toBeInTheDocument();

    // Analytics charts should not be visible in daily focus tab
    expect(screen.queryByText(/Relatórios & Métricas Analíticas/i)).not.toBeInTheDocument();
  });

  it('switches to Insights & Acervo tab when analytics tab is clicked', () => {
    render(<Dashboard {...defaultProps} />);

    const analyticsTabBtn = screen.getByTestId('tab-analytics');
    fireEvent.click(analyticsTabBtn);

    // Insights header and KPI metrics should now be displayed
    expect(screen.getByText(/Relatórios & Métricas Analíticas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Livros Concluídos/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Evolução de Leitura/i)).toBeInTheDocument();
    expect(screen.getByText(/Top Autores/i)).toBeInTheDocument();
  });

  it('allows switching from banner in Foco Diário to Insights & Acervo tab', () => {
    render(<Dashboard {...defaultProps} />);

    const bannerLink = screen.getByRole('button', { name: /Ver Insights & Acervo →/i });
    expect(bannerLink).toBeInTheDocument();
    fireEvent.click(bannerLink);

    expect(screen.getByText(/Relatórios & Métricas Analíticas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Livros Concluídos/i).length).toBeGreaterThan(0);
  });

  it('triggers onOpenJournal when Diário shortcut is clicked', () => {
    render(<Dashboard {...defaultProps} />);

    const openJournalBtn = screen.getByRole('button', { name: /Abrir Diário →/i });
    expect(openJournalBtn).toBeInTheDocument();
    fireEvent.click(openJournalBtn);

    expect(mockOpenJournal).toHaveBeenCalledTimes(1);
    expect(mockOpenJournal).toHaveBeenCalledWith('book-reading-1');
  });
});
