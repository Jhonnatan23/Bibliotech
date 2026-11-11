// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddBookModal } from './AddBookModal';
import { Book, BookStatus, BookType, STATUS_CONFIGS } from '../types';

describe('AddBookModal component tests', () => {
  const mockOnClose = vi.fn();
  const mockOnAddBook = vi.fn().mockResolvedValue(undefined);
  const mockOnUpdateBook = vi.fn().mockResolvedValue(undefined);

  const defaultProps = {
    onClose: mockOnClose,
    onAddBook: mockOnAddBook,
    onUpdateBook: mockOnUpdateBook,
    existingBooks: [],
    statusConfigs: STATUS_CONFIGS,
    profile: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with required fields', () => {
    render(<AddBookModal {...defaultProps} />);

    // Title / Header
    expect(screen.getByRole('heading', { name: /Novo Registro/i })).toBeInTheDocument();

    // Required fields inputs
    expect(screen.getByPlaceholderText(/Ex: Cem Anos de Solidão/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Adicione um autor.../i)).toBeInTheDocument();

    // Save button
    expect(screen.getByRole('button', { name: /Salvar Livro/i })).toBeInTheDocument();
  });

  it('validates and prevents submission when required fields (title, author) are empty', async () => {
    render(<AddBookModal {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /Salvar Livro/i });
    fireEvent.click(submitBtn);

    // Validation messages should appear
    await waitFor(() => {
      expect(screen.getByText(/O título é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/Adicione ao menos um autor/i)).toBeInTheDocument();
    });

    // onAddBook should not have been called
    expect(mockOnAddBook).not.toHaveBeenCalled();
  });

  it('submits successfully when required fields are filled', async () => {
    render(<AddBookModal {...defaultProps} />);

    // Fill title
    const titleInput = screen.getByPlaceholderText(/Ex: Cem Anos de Solidão/i);
    fireEvent.change(titleInput, { target: { value: 'Dom Casmurro' } });

    // Fill author
    const authorInput = screen.getByPlaceholderText(/Adicione um autor.../i);
    fireEvent.change(authorInput, { target: { value: 'Machado de Assis' } });

    // Select genre
    const genreBtn = screen.getByRole('button', { name: /Romance/i });
    fireEvent.click(genreBtn);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Salvar Livro/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnAddBook).toHaveBeenCalledTimes(1);
      expect(mockOnAddBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Dom Casmurro',
          author: 'Machado de Assis',
          genre: 'Romance',
        })
      );
    });
  });

  it('renders in edit mode and updates existing book', async () => {
    const bookToEdit: Book = {
      id: 'book-1',
      user_id: 'user-1',
      title: 'Memórias Póstumas de Brás Cubas',
      author: 'Machado de Assis',
      pages: 220,
      genre: 'Romance',
      type: BookType.Book,
      status: BookStatus.Read,
      dateAdded: '2026-01-01',
    };

    render(<AddBookModal {...defaultProps} bookToEdit={bookToEdit} />);

    // Header should indicate Edit Mode
    expect(screen.getByRole('heading', { name: /Editar Registro/i })).toBeInTheDocument();

    // Inputs pre-filled
    const titleInput = screen.getByPlaceholderText(/Ex: Cem Anos de Solidão/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Memórias Póstumas de Brás Cubas');

    // Change title
    fireEvent.change(titleInput, { target: { value: 'Memórias Póstumas (Edição Especial)' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Salvar Livro/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnUpdateBook).toHaveBeenCalledTimes(1);
      expect(mockOnUpdateBook).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'book-1',
          title: 'Memórias Póstumas (Edição Especial)',
          author: 'Machado de Assis',
        })
      );
    });
  });

  it('correctly saves synopsis when registering a new book', async () => {
    render(<AddBookModal {...defaultProps} />);

    // Fill title
    const titleInput = screen.getByPlaceholderText(/Ex: Cem Anos de Solidão/i);
    fireEvent.change(titleInput, { target: { value: 'Grande Sertão: Veredas' } });

    // Fill author
    const authorInput = screen.getByPlaceholderText(/Adicione um autor.../i);
    fireEvent.change(authorInput, { target: { value: 'Guimarães Rosa' } });

    // Select genre
    const genreBtn = screen.getByRole('button', { name: /Romance/i });
    fireEvent.click(genreBtn);

    // Fill synopsis / summary
    const summaryInput = screen.getByPlaceholderText(/Descrição da obra.../i);
    fireEvent.change(summaryInput, { target: { value: 'A clássica travessia de Riobaldo pelo sertão mineiro.' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Salvar Livro/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnAddBook).toHaveBeenCalledTimes(1);
      expect(mockOnAddBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Grande Sertão: Veredas',
          author: 'Guimarães Rosa',
          genre: 'Romance',
          summary: 'A clássica travessia de Riobaldo pelo sertão mineiro.',
        })
      );
    });
  });

  it('correctly saves updated synopsis when editing an existing book', async () => {
    const bookToEdit: Book = {
      id: 'book-2',
      user_id: 'user-1',
      title: 'O Cortiço',
      author: 'Aluísio Azevedo',
      pages: 250,
      genre: 'Romance',
      type: BookType.Book,
      status: BookStatus.Read,
      dateAdded: '2026-01-01',
      summary: 'Sinopse inicial da obra.',
    };

    render(<AddBookModal {...defaultProps} bookToEdit={bookToEdit} />);

    // Edit only the synopsis
    const summaryInput = screen.getByPlaceholderText(/Descrição da obra.../i);
    fireEvent.change(summaryInput, { target: { value: 'Retrato naturalista do cortiço de São Romão no Rio de Janeiro.' } });

    // Submit form without touching any other fields
    const submitBtn = screen.getByRole('button', { name: /Salvar Livro/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnUpdateBook).toHaveBeenCalledTimes(1);
      expect(mockOnUpdateBook).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'book-2',
          title: 'O Cortiço',
          summary: 'Retrato naturalista do cortiço de São Romão no Rio de Janeiro.',
        })
      );
    });
  });

  describe('Progressive Disclosure & Quick Add', () => {
    it('renders the 3 progressive tabs with Tab 1 (Essencial) active by default', () => {
      render(<AddBookModal {...defaultProps} />);

      // Verify all 3 tabs are rendered
      const tab1 = screen.getByTestId('tab-essential');
      const tab2 = screen.getByTestId('tab-reading_experience');
      const tab3 = screen.getByTestId('tab-collection');

      expect(tab1).toBeInTheDocument();
      expect(tab2).toBeInTheDocument();
      expect(tab3).toBeInTheDocument();

      // Tab 1 should be selected
      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
      expect(tab3).toHaveAttribute('aria-selected', 'false');

      // Panels
      const panel1 = screen.getByTestId('tabpanel-essential');
      const panel2 = screen.getByTestId('tabpanel-reading_experience');
      const panel3 = screen.getByTestId('tabpanel-collection');

      expect(panel1).toHaveClass('block');
      expect(panel2).toHaveClass('hidden');
      expect(panel3).toHaveClass('hidden');
    });

    it('allows quick-add with as few as 3 filled fields (Title, Author, Pages) without visiting other tabs', async () => {
      render(<AddBookModal {...defaultProps} />);

      // Fill only 3 fields: Title, Author, Pages
      const titleInput = screen.getByPlaceholderText(/Ex: Cem Anos de Solidão/i);
      fireEvent.change(titleInput, { target: { value: '1984' } });

      const authorInput = screen.getByPlaceholderText(/Adicione um autor.../i);
      fireEvent.change(authorInput, { target: { value: 'George Orwell' } });

      const pagesInput = screen.getByPlaceholderText(/Ex: 350/i);
      fireEvent.change(pagesInput, { target: { value: '328' } });

      // Click Quick Add button directly from Essencial tab
      const quickAddBtn = screen.getByTestId('quick-add-btn');
      expect(quickAddBtn).toBeInTheDocument();
      fireEvent.click(quickAddBtn);

      await waitFor(() => {
        expect(mockOnAddBook).toHaveBeenCalledTimes(1);
        expect(mockOnAddBook).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '1984',
            author: 'George Orwell',
            pages: 328,
          })
        );
      });
    });

    it('switches tabs smoothly and preserves form data across tab changes', () => {
      render(<AddBookModal {...defaultProps} />);

      // Fill in Tab 1
      const titleInput = screen.getByPlaceholderText(/Ex: Cem Anos de Solidão/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'O Pequeno Príncipe' } });
      expect(titleInput.value).toBe('O Pequeno Príncipe');

      // Switch to Tab 2
      const tab2 = screen.getByTestId('tab-reading_experience');
      fireEvent.click(tab2);

      const panel1 = screen.getByTestId('tabpanel-essential');
      const panel2 = screen.getByTestId('tabpanel-reading_experience');
      expect(panel1).toHaveClass('hidden');
      expect(panel2).toHaveClass('block');

      // Fill notes in Tab 2
      const notesInput = screen.getByPlaceholderText(/Suas impressões, citações favoritas ou anotações pessoais.../i) as HTMLTextAreaElement;
      fireEvent.change(notesInput, { target: { value: 'Tu te tornas eternamente responsável por aquilo que cativas.' } });
      expect(notesInput.value).toBe('Tu te tornas eternamente responsável por aquilo que cativas.');

      // Switch to Tab 3
      const tab3 = screen.getByTestId('tab-collection');
      fireEvent.click(tab3);

      const panel3 = screen.getByTestId('tabpanel-collection');
      expect(panel2).toHaveClass('hidden');
      expect(panel3).toHaveClass('block');

      // Switch back to Tab 1 - data should still be there
      const tab1 = screen.getByTestId('tab-essential');
      fireEvent.click(tab1);

      expect(titleInput.value).toBe('O Pequeno Príncipe');

      // Switch back to Tab 2 - notes should still be there
      fireEvent.click(tab2);
      expect(notesInput.value).toBe('Tu te tornas eternamente responsável por aquilo que cativas.');
    });

    it('prompts confirmation when closing with uncommitted edits and allows discarding', () => {
      render(<AddBookModal {...defaultProps} />);

      // Type into title to make form dirty
      const titleInput = screen.getByPlaceholderText(/Ex: Cem Anos de Solidão/i);
      fireEvent.change(titleInput, { target: { value: 'Ensaio Sobre a Cegueira' } });

      // Click close button
      const closeBtn = screen.getByRole('button', { name: /Fechar modal/i });
      fireEvent.click(closeBtn);

      // Confirmation dialog should be shown and onClose NOT yet called
      expect(screen.getByText('Descartar alterações?')).toBeInTheDocument();
      expect(screen.getByText(/Você possui alterações não salvas/i)).toBeInTheDocument();
      expect(mockOnClose).not.toHaveBeenCalled();

      // Click "Cancelar" in confirmation modal to stay in form (getAllByRole returns modal footer cancel and form cancel)
      const cancelButtons = screen.getAllByRole('button', { name: /^Cancelar$/i });
      // The last one is inside the ConfirmationModal
      const cancelDiscardBtn = cancelButtons[cancelButtons.length - 1];
      fireEvent.click(cancelDiscardBtn);
      expect(mockOnClose).not.toHaveBeenCalled();

      // Click close again and then confirm discard
      fireEvent.click(closeBtn);
      const confirmDiscardBtn = screen.getByRole('button', { name: /Descartar e Sair/i });
      fireEvent.click(confirmDiscardBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});

