// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';

describe('BottomNav Component (Material Design 3 / iOS HIG Navigation)', () => {
  const mockSetView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders exactly 4 navigation destinations and no truncated or removed tabs', () => {
    render(<BottomNav view="dashboard" setView={mockSetView} />);

    // Must have exactly 4 items
    const navButtons = screen.getAllByRole('tab');
    expect(navButtons).toHaveLength(4);

    // Expected full labels (no abbreviations)
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Estante')).toBeInTheDocument();
    expect(screen.getByText('Explorar')).toBeInTheDocument();
    expect(screen.getByText('Você')).toBeInTheDocument();

    // Verify removed old truncated tabs and 'Mais' menu
    expect(screen.queryByText('Séri.')).toBeNull();
    expect(screen.queryByText('Hist.')).toBeNull();
    expect(screen.queryByText('Desej.')).toBeNull();
    expect(screen.queryByText('Explor.')).toBeNull();
    expect(screen.queryByText('Mais')).toBeNull();
  });

  it('complies with accessibility standards for touch targets (min 48px)', () => {
    render(<BottomNav view="dashboard" setView={mockSetView} />);

    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab) => {
      // Must contain min-h-[48px] and min-w-[48px] in classes or computed dimensions
      expect(tab.className).toContain('min-w-[48px]');
      expect(tab.className).toContain('min-h-[48px]');
    });
  });

  it('calls setView when each destination is clicked', () => {
    render(<BottomNav view="dashboard" setView={mockSetView} />);

    // Click Estante
    const estanteBtn = screen.getByTestId('bottom-nav-list');
    fireEvent.click(estanteBtn);
    expect(mockSetView).toHaveBeenCalledWith('list');

    // Click Explorar
    const explorarBtn = screen.getByTestId('bottom-nav-search');
    fireEvent.click(explorarBtn);
    expect(mockSetView).toHaveBeenCalledWith('search');

    // Click Você
    const voceBtn = screen.getByTestId('bottom-nav-profile');
    fireEvent.click(voceBtn);
    expect(mockSetView).toHaveBeenCalledWith('stats');

    // Click Início
    const inicioBtn = screen.getByTestId('bottom-nav-dashboard');
    fireEvent.click(inicioBtn);
    expect(mockSetView).toHaveBeenCalledWith('dashboard');
  });

  it('correctly sets active state for unified library sub-views (wishlist, series, history, loans)', () => {
    const { rerender } = render(<BottomNav view="wishlist" setView={mockSetView} />);
    const estanteTabWishlist = screen.getByTestId('bottom-nav-list');
    expect(estanteTabWishlist).toHaveAttribute('aria-selected', 'true');

    rerender(<BottomNav view="series" setView={mockSetView} />);
    const estanteTabSeries = screen.getByTestId('bottom-nav-list');
    expect(estanteTabSeries).toHaveAttribute('aria-selected', 'true');

    rerender(<BottomNav view="history" setView={mockSetView} />);
    const estanteTabHistory = screen.getByTestId('bottom-nav-list');
    expect(estanteTabHistory).toHaveAttribute('aria-selected', 'true');
  });

  it('correctly sets active state for unified profile hub sub-views (community, challenges, journal)', () => {
    const { rerender } = render(<BottomNav view="community" setView={mockSetView} />);
    const voceTabCommunity = screen.getByTestId('bottom-nav-profile');
    expect(voceTabCommunity).toHaveAttribute('aria-selected', 'true');

    rerender(<BottomNav view="challenges" setView={mockSetView} />);
    const voceTabChallenges = screen.getByTestId('bottom-nav-profile');
    expect(voceTabChallenges).toHaveAttribute('aria-selected', 'true');

    rerender(<BottomNav view="journal" setView={mockSetView} />);
    const voceTabJournal = screen.getByTestId('bottom-nav-profile');
    expect(voceTabJournal).toHaveAttribute('aria-selected', 'true');
  });
});
