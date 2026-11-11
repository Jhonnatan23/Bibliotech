// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrentlyReading } from './CurrentlyReading';
import { Book, BookStatus, BookType } from '../types';

describe('CurrentlyReading Component Rating Scale', () => {
  const mockBook: Book = {
    id: 'book-current-1',
    user_id: 'user-1',
    title: 'O Hobbit',
    author: 'J.R.R. Tolkien',
    pages: 310,
    genre: 'Fantasia',
    type: BookType.Book,
    status: BookStatus.Reading,
    currentPage: 150,
    dateAdded: '2026-01-01',
    dateStarted: '2026-01-01',
  };

  const defaultProps = {
    book: mockBook,
    updateBook: vi.fn().mockResolvedValue(undefined),
    profile: null,
  };

  it('renders finish reading modal with 5-star rating scale and X.X / 5.0 label', () => {
    render(<CurrentlyReading {...defaultProps} />);

    // Click "Finalizar" button
    const finishBtn = screen.getByRole('button', { name: /Finalizar/i });
    fireEvent.click(finishBtn);

    // Should display Congratulations and 5-star scale
    expect(screen.getByText(/Parabéns!/i)).toBeInTheDocument();
    expect(screen.getByText(/Nota \(0 a 5.0\):/i)).toBeInTheDocument();

    // Verify there are exactly 5 stars rendered in the finish section, NOT 10
    const stars = screen.getAllByTestId(/^star-\d+$/);
    expect(stars).toHaveLength(5);

    // Number input should have max="5"
    const numberInput = screen.getByLabelText(/Nota numérica de 0 a 5.0/i) as HTMLInputElement;
    expect(numberInput).toBeInTheDocument();
    expect(numberInput.getAttribute('max')).toBe('5');
    expect(numberInput.getAttribute('min')).toBe('0');

    // Slider should also have max="5"
    const slider = screen.getByLabelText(/Controle deslizante de nota/i) as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    expect(slider.getAttribute('max')).toBe('5');
    expect(slider.getAttribute('min')).toBe('0');
  });

  it('renders quick increment buttons (+5p, +10p, +20p, +50p) and increments currentPage', () => {
    render(<CurrentlyReading {...defaultProps} />);

    // Check all quick buttons are rendered
    const inc5 = screen.getByTestId('quick-inc-5');
    const inc10 = screen.getByTestId('quick-inc-10');
    const inc20 = screen.getByTestId('quick-inc-20');
    const inc50 = screen.getByTestId('quick-inc-50');

    expect(inc5).toBeInTheDocument();
    expect(inc10).toBeInTheDocument();
    expect(inc20).toBeInTheDocument();
    expect(inc50).toBeInTheDocument();

    // Initial page is 150 of 310
    expect(screen.getByText('150 de 310')).toBeInTheDocument();

    // Click +10p -> 160
    fireEvent.click(inc10);
    expect(screen.getByText('160 de 310')).toBeInTheDocument();

    // Click +20p -> 180
    fireEvent.click(inc20);
    expect(screen.getByText('180 de 310')).toBeInTheDocument();
  });

  it('bounds quick increment to totalPages and triggers celebration when reaching total pages', () => {
    const bookNearEnd: Book = {
      ...mockBook,
      currentPage: 300,
      pages: 310,
    };
    render(<CurrentlyReading {...defaultProps} book={bookNearEnd} />);

    expect(screen.getByText('300 de 310')).toBeInTheDocument();

    // Click +50p -> Should be bounded to 310, triggering completion celebration modal
    const inc50 = screen.getByTestId('quick-inc-50');
    fireEvent.click(inc50);

    // Bounded to 310 and celebration modal appears
    expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
    expect(screen.getByText(/Leitura Concluída! 100%/i)).toBeInTheDocument();
  });

  it('triggers floating micro-toast when quick increment is clicked', () => {
    render(<CurrentlyReading {...defaultProps} />);

    const inc10 = screen.getByTestId('quick-inc-10');
    fireEvent.click(inc10);

    const toast = screen.getByTestId('reading-micro-toast');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent('+10 páginas registradas!');
    expect(toast).toHaveTextContent('Faltam 150p para concluir.');
  });

  it('sets currentPage to totalPages and triggers celebration modal when Concluir Livro is clicked', () => {
    render(<CurrentlyReading {...defaultProps} />);

    const completeBtn = screen.getByTestId('complete-book-btn');
    expect(completeBtn).toBeInTheDocument();

    fireEvent.click(completeBtn);

    // Should prompt celebratory modal with rating and share options
    expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
    expect(screen.getByText(/Parabéns pelo marco!/i)).toBeInTheDocument();
    expect(screen.getByTestId('celebration-confirm-btn')).toBeInTheDocument();
    expect(screen.getByTestId('celebration-share-btn')).toBeInTheDocument();
  });
});

