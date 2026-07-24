import { describe, it, expect } from 'vitest';
import { validateBookForm, ValidateBookFormParams } from './useBookForm';
import { Book, BookStatus, BookType } from '../types';

describe('useBookForm Validation Tests', () => {
  const defaultParams = (): ValidateBookFormParams => ({
    title: 'Valid Title',
    authors: ['Valid Author'],
    selectedGenres: ['Ficção'],
    series: '',
    volume: '',
    seriesId: '',
    definedSeries: [],
    existingBooks: [],
    isEditMode: false,
    isbn: ''
  });

  it('should return no errors for perfectly valid params', () => {
    const params = defaultParams();
    const errors = validateBookForm(params);
    expect(errors).toEqual({});
  });

  it('should return an error when title is empty', () => {
    const params = { ...defaultParams(), title: '   ' };
    const errors = validateBookForm(params);
    expect(errors.title).toBe('O título é obrigatório');
  });

  it('should return an error when there are no authors', () => {
    const params = { ...defaultParams(), authors: [] };
    const errors = validateBookForm(params);
    expect(errors.authors).toBe('Adicione ao menos um autor');
  });

  it('should return an error when there are no genres', () => {
    const params = { ...defaultParams(), selectedGenres: [] };
    const errors = validateBookForm(params);
    expect(errors.genre).toBe('Selecione ao menos um gênero');
  });

  describe('ISBN validation rules', () => {
    it('should not return an error when ISBN is empty/not filled', () => {
      const params = { ...defaultParams(), isbn: '' };
      const errors = validateBookForm(params);
      expect(errors.isbn).toBeUndefined();
    });

    it('should not return an error for a valid 10-digit ISBN', () => {
      const params = { ...defaultParams(), isbn: '0471958697' };
      const errors = validateBookForm(params);
      expect(errors.isbn).toBeUndefined();
    });

    it('should not return an error for a valid 13-digit ISBN with hyphens', () => {
      const params = { ...defaultParams(), isbn: '978-3-16-148410-0' };
      const errors = validateBookForm(params);
      expect(errors.isbn).toBeUndefined();
    });

    it('should return an error for an invalid ISBN format (e.g. too short)', () => {
      const params = { ...defaultParams(), isbn: '12345' };
      const errors = validateBookForm(params);
      expect(errors.isbn).toBe('Formato de ISBN inválido (deve ter 10 ou 13 dígitos)');
    });

    it('should return an error for an invalid ISBN format (e.g. letters in 13-digit)', () => {
      const params = { ...defaultParams(), isbn: '978-3-16-14841a-0' };
      const errors = validateBookForm(params);
      expect(errors.isbn).toBe('Formato de ISBN inválido (deve ter 10 ou 13 dígitos)');
    });
  });

  describe('Collection and Edition (Volume) rules', () => {
    it('should return an error when a collection/series is set but volume is empty', () => {
      const params = { ...defaultParams(), series: 'Senhor dos Anéis', volume: '' };
      const errors = validateBookForm(params);
      expect(errors.volume).toBe('O número da edição é obrigatório ao selecionar uma coleção.');
    });

    it('should return an error when volume is less than 1', () => {
      const params = { ...defaultParams(), series: 'Senhor dos Anéis', volume: '0' };
      const errors = validateBookForm(params);
      expect(errors.volume).toBe('O número da edição deve ser maior ou igual a 1.');
    });

    it('should return an error when volume exceeds series total volumes limit', () => {
      const params = {
        ...defaultParams(),
        series: 'Trilogia Espacial',
        volume: '4',
        definedSeries: [{ id: 'series-1', name: 'Trilogia Espacial', total_volumes: 3 }]
      };
      const errors = validateBookForm(params);
      expect(errors.volume).toBe('O número da edição não pode ser maior do que o total de edições da coleção (Máx: 3).');
    });

    it('should return an error when volume is duplicate within the collection', () => {
      const existingBooks: Book[] = [{
        id: 'book-existing-id',
        user_id: 'user-123',
        title: 'Livro Existente',
        author: 'Autor',
        pages: 200,
        genre: 'Sci-Fi',
        type: BookType.Book,
        status: BookStatus.TBR,
        currentPage: 0,
        dateAdded: '2026-07-20',
        timesRead: 0,
        wasWishlist: false,
        linkedBookIds: [],
        tags: [],
        isLoaned: false,
        isDigital: false,
        series: 'Trilogia Espacial',
        volume: 2
      }];

      const params = {
        ...defaultParams(),
        series: 'Trilogia Espacial',
        volume: '2',
        existingBooks
      };
      const errors = validateBookForm(params);
      expect(errors.volume).toBe('Já existe um livro cadastrado com o número de edição 2 na coleção "Trilogia Espacial".');
    });
  });
});
