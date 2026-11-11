// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookDetailsModal } from './BookDetailsModal';
import { Book, BookStatus, BookType, STATUS_CONFIGS } from '../types';

describe('BookDetailsModal component tests', () => {
  const mockOnClose = vi.fn();
  const mockOnNavigateToBook = vi.fn();
  const mockOnUpdateBook = vi.fn().mockResolvedValue(undefined);

  const sampleBookTBR: Book = {
    id: 'book-tbr-1',
    user_id: 'user-1',
    title: 'O Hobbit',
    author: 'J.R.R. Tolkien',
    pages: 310,
    genre: 'Fantasia',
    type: BookType.Book,
    status: BookStatus.TBR,
    dateAdded: '2026-07-01',
  };

  const defaultProps = {
    book: sampleBookTBR,
    allBooks: [sampleBookTBR],
    onClose: mockOnClose,
    onNavigateToBook: mockOnNavigateToBook,
    statusConfigs: STATUS_CONFIGS,
    profile: null,
    onUpdateBook: mockOnUpdateBook,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders book details correctly', () => {
    render(<BookDetailsModal {...defaultProps} />);

    expect(screen.getByText('O Hobbit')).toBeInTheDocument();
    expect(screen.getByText(/de J.R.R. Tolkien/i)).toBeInTheDocument();
    expect(screen.getByText('310')).toBeInTheDocument();
  });

  it('changing status from "Não lido" (TBR) to "Lendo" (Reading) sets dateStarted and calls onUpdateBook', async () => {
    render(<BookDetailsModal {...defaultProps} />);

    const statusSelect = screen.getByLabelText('Status do livro');
    fireEvent.change(statusSelect, { target: { value: BookStatus.Reading } });

    const today = new Date().toISOString().split('T')[0];

    await waitFor(() => {
      expect(mockOnUpdateBook).toHaveBeenCalledTimes(1);
      expect(mockOnUpdateBook).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'book-tbr-1',
          status: BookStatus.Reading,
          dateStarted: today,
        })
      );
    });
  });

  it('changing status to "Lido" (Read) fills dateFinished, currentPage, calculates daysToFinish, and calls onUpdateBook', async () => {
    const bookReading: Book = {
      id: 'book-reading-1',
      user_id: 'user-1',
      title: '1984',
      author: 'George Orwell',
      pages: 328,
      genre: 'Ficção',
      type: BookType.Book,
      status: BookStatus.Reading,
      dateAdded: '2026-07-01',
      dateStarted: '2026-07-10',
    };

    render(<BookDetailsModal {...defaultProps} book={bookReading} allBooks={[bookReading]} />);

    const statusSelect = screen.getByLabelText('Status do livro');
    fireEvent.change(statusSelect, { target: { value: BookStatus.Read } });

    const today = new Date().toISOString().split('T')[0];

    await waitFor(() => {
      expect(mockOnUpdateBook).toHaveBeenCalledTimes(1);
      const callArg = mockOnUpdateBook.mock.calls[0][0];

      expect(callArg.id).toBe('book-reading-1');
      expect(callArg.status).toBe(BookStatus.Read);
      expect(callArg.dateFinished).toBe(today);
      expect(callArg.currentPage).toBe(328);
      expect(typeof callArg.daysToFinish).toBe('number');
      expect(callArg.daysToFinish).toBeGreaterThan(0);
    });
  });

  it('closes modal when close button is clicked', () => {
    render(<BookDetailsModal {...defaultProps} />);

    const closeButtons = screen.getAllByRole('button', { name: /Fechar/i });
    fireEvent.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows editing and saving synopsis directly from the book details modal', async () => {
    const bookWithSummary: Book = {
      ...sampleBookTBR,
      summary: 'Uma jornada inesperada pela Terra Média.',
    };

    render(<BookDetailsModal {...defaultProps} book={bookWithSummary} />);

    // Check synopsis is displayed
    expect(screen.getByText('Uma jornada inesperada pela Terra Média.')).toBeInTheDocument();

    // Click on Edit Synopsis button
    const editBtn = screen.getByRole('button', { name: /Editar Sinopse/i });
    fireEvent.click(editBtn);

    // Edit textarea
    const textarea = screen.getByPlaceholderText(/Escreva a sinopse ou resumo da obra.../i);
    fireEvent.change(textarea, { target: { value: 'Bilbo Bolseiro é convencido por Gandalf a acompanhar treze anões.' } });

    // Click Salvar Sinopse
    const saveBtn = screen.getByRole('button', { name: /Salvar Sinopse/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockOnUpdateBook).toHaveBeenCalledTimes(1);
      expect(mockOnUpdateBook).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'book-tbr-1',
          summary: 'Bilbo Bolseiro é convencido por Gandalf a acompanhar treze anões.',
        })
      );
    });
  });

  it('calls onEdit when the Edit button in header or footer is clicked', () => {
    const mockOnEdit = vi.fn();
    render(<BookDetailsModal {...defaultProps} onEdit={mockOnEdit} />);

    const editHeaderBtn = screen.getByRole('button', { name: /Editar livro/i });
    expect(editHeaderBtn).toBeInTheDocument();
    fireEvent.click(editHeaderBtn);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(sampleBookTBR);

    const editFooterBtn = screen.getByRole('button', { name: /Editar Registro Completo/i });
    expect(editFooterBtn).toBeInTheDocument();
    fireEvent.click(editFooterBtn);

    expect(mockOnEdit).toHaveBeenCalledTimes(2);
  });
});
