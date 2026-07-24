import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapBookToDb, mapDbToBook, parseNullableNumber, mapPartialBookToDb, DatabaseService } from './database';
import { Book, BookStatus, BookType } from '../types';
import { supabase } from './supabase';

describe('Database Service Mapping Tests', () => {
  it('should successfully perform a full round-trip mapping for a complete book', () => {
    const originalBook: Book = {
      id: 'book-full-id',
      user_id: 'user-123',
      title: 'A Noite dos Tempos',
      author: 'René Barjavel',
      pages: 382,
      genre: 'Ficção Científica',
      type: BookType.Book,
      status: BookStatus.Read,
      rating: 5,
      summary: 'Uma incrível jornada de ficção científica sob o gelo da Antártida.',
      notes: 'Um dos melhores livros que já li.',
      estimatedPrice: 59.9,
      pricePaid: 45.0,
      buyLink: 'https://example.com/barjavel',
      currentPage: 382,
      dateAdded: '2026-07-10',
      dateStarted: '2026-07-11',
      dateFinished: '2026-07-15',
      daysToFinish: 4,
      timesRead: 2,
      wasWishlist: true,
      linkedBookIds: ['linked-1', 'linked-2'],
      tags: ['Favoritos', 'Sci-Fi'],
      historyObservation: 'Recomendo muito a leitura.',
      isLoaned: true,
      borrowerName: 'Carlos',
      loanDate: '2026-07-16',
      isDigital: false,
      series: 'Clássicos Cósmicos',
      volume: 1,
      seriesId: 'series-abc',
      condition: 'Novo',
      purchaseDate: '2026-07-15',
      store: 'Amazon',
      physicalLocation: 'Prateleira A1',
      edition: '1ª Edição',
      isbn: '9783161484100',
      signed: true,
      sealed: true,
      limitedEdition: true,
      firstEdition: true,
      variantCover: true
    };

    const dbRecord = mapBookToDb(originalBook);
    const mappedBack = mapDbToBook(dbRecord);

    expect(mappedBack).toEqual(originalBook);
  });

  it('should successfully perform a round-trip mapping for a minimal book with default/null fields', () => {
    const originalBook: Book = {
      id: 'book-min-id',
      user_id: 'user-123',
      title: 'Minimal Book Title',
      author: 'Minimal Author',
      pages: 120,
      genre: 'Drama',
      type: BookType.Book,
      status: BookStatus.TBR,
      currentPage: 0,
      dateAdded: '2026-07-20',
      timesRead: 0,
      wasWishlist: false,
      linkedBookIds: [],
      tags: [],
      isLoaned: false,
      isDigital: false
    };

    const dbRecord = mapBookToDb(originalBook);
    const mappedBack = mapDbToBook(dbRecord);

    // Some fields default to null/empty values when not provided
    expect(mappedBack.id).toBe(originalBook.id);
    expect(mappedBack.user_id).toBe(originalBook.user_id);
    expect(mappedBack.title).toBe(originalBook.title);
    expect(mappedBack.author).toBe(originalBook.author);
    expect(mappedBack.pages).toBe(originalBook.pages);
    expect(mappedBack.genre).toBe(originalBook.genre);
    expect(mappedBack.type).toBe(originalBook.type);
    expect(mappedBack.status).toBe(originalBook.status);
    
    // Check that missing optional fields default correctly
    expect(mappedBack.rating).toBeUndefined();
    expect(mappedBack.summary).toBeNull();
    expect(mappedBack.notes).toBeNull();
    expect(mappedBack.estimatedPrice).toBeUndefined();
    expect(mappedBack.pricePaid).toBeUndefined();
    expect(mappedBack.buyLink).toBeNull();
    expect(mappedBack.dateStarted).toBeNull();
    expect(mappedBack.dateFinished).toBeNull();
    expect(mappedBack.daysToFinish).toBeNull();
    expect(mappedBack.historyObservation).toBeNull();
    expect(mappedBack.borrowerName).toBeNull();
    expect(mappedBack.loanDate).toBeNull();
    expect(mappedBack.series).toBeNull();
    expect(mappedBack.volume).toBeUndefined();
    expect(mappedBack.seriesId).toBeNull();
    expect(mappedBack.condition).toBeNull();
    expect(mappedBack.purchaseDate).toBeNull();
    expect(mappedBack.store).toBeNull();
    expect(mappedBack.physicalLocation).toBeNull();
    expect(mappedBack.edition).toBeNull();
    expect(mappedBack.isbn).toBeNull();
    expect(mappedBack.signed).toBe(false);
    expect(mappedBack.sealed).toBe(false);
    expect(mappedBack.limitedEdition).toBe(false);
    expect(mappedBack.firstEdition).toBe(false);
    expect(mappedBack.variantCover).toBe(false);
  });

  /**
   * IMPORTANT NOTE FOR DEVELOPERS:
   * 
   * If you introduce any new fields/columns to the Book model or database schema:
   * 1. Add the new field to the Book type declaration in types.ts.
   * 2. Update mapBookToDb to include the field mapping (camelCase to snake_case).
   * 3. Update mapDbToBook to map it back (snake_case to camelCase).
   * 4. Add the field to the tests above to verify the complete round-trip conversion.
   * 
   * Failure to update the mapping functions will cause a type mismatch or data loss,
   * which these round-trip tests are designed to catch immediately.
   */
});

describe('Numeric Parsing and Zero Preservation Tests', () => {
  it('should parse and preserve 0 for pricePaid, estimatedPrice, rating, volume', () => {
    expect(parseNullableNumber(0)).toBe(0);
    expect(parseNullableNumber(0.0)).toBe(0);
    expect(parseNullableNumber('0')).toBe(0);
    expect(parseNullableNumber(' 0 ')).toBe(0);
  });

  it('should return undefined for null, undefined, invalid, and empty strings', () => {
    expect(parseNullableNumber(null)).toBeUndefined();
    expect(parseNullableNumber(undefined)).toBeUndefined();
    expect(parseNullableNumber('')).toBeUndefined();
    expect(parseNullableNumber('   ')).toBeUndefined();
    expect(parseNullableNumber('abc')).toBeUndefined();
    expect(parseNullableNumber(NaN)).toBeUndefined();
  });

  it('should convert valid numeric strings', () => {
    expect(parseNullableNumber('12.34')).toBe(12.34);
    expect(parseNullableNumber('-5')).toBe(-5);
  });

  it('should preserve zero ratings and prices when mapping to and from DB', () => {
    const bookWithZeros: Partial<Book> = {
      rating: 0,
      estimatedPrice: 0,
      pricePaid: 0,
      volume: 0,
    };

    const dbRecord = mapBookToDb(bookWithZeros);
    expect(dbRecord.rating).toBe(0);
    expect(dbRecord.estimated_price).toBe(0);
    expect(dbRecord.price_paid).toBe(0);
    expect(dbRecord.volume).toBe(0);

    const mappedBack = mapDbToBook(dbRecord);
    expect(mappedBack.rating).toBe(0);
    expect(mappedBack.estimatedPrice).toBe(0);
    expect(mappedBack.pricePaid).toBe(0);
    expect(mappedBack.volume).toBe(0);
  });
});

describe('Partial Update Mapping and Preservation Tests', () => {
  it('should only include changed fields in partial mapping', () => {
    const changes: Partial<Book> = {
      physicalLocation: 'Prateleira Especial',
    };

    const mapped = mapPartialBookToDb(changes);
    expect(mapped).toEqual({
      physical_location: 'Prateleira Especial',
    });
  });

  it('should preserve collector fields in partial mapping', () => {
    const changes: Partial<Book> = {
      signed: true,
      sealed: false,
      limitedEdition: true,
      firstEdition: false,
      variantCover: true,
      edition: 'Special Deluxe',
      isbn: '1234567890',
    };

    const mapped = mapPartialBookToDb(changes);
    expect(mapped).toEqual({
      signed: true,
      sealed: false,
      limited_edition: true,
      first_edition: false,
      variant_cover: true,
      edition: 'Special Deluxe',
      isbn: '1234567890',
    });
  });
});

describe('DatabaseService.updateBook Isolation and Cache Behavior', () => {
  let service: DatabaseService;
  let mockSupabaseFrom: any;
  let mockLocalBooks: Book[] = [];
  let localStorageStore: Record<string, string> = {};

  beforeEach(() => {
    service = new DatabaseService();
    mockLocalBooks = [
      {
        id: 'book-123',
        user_id: 'user-abc',
        title: 'Livro Original',
        author: 'Autor Teste',
        pages: 200,
        genre: 'Aventura',
        type: BookType.Book,
        status: BookStatus.TBR,
        currentPage: 0,
        dateAdded: '2026-07-21',
        physicalLocation: 'Prateleira A',
        signed: true,
        sealed: false,
      },
    ];

    // Mock localStorage using a block-scoped dictionary
    localStorageStore = {
      'biblio_tech_cache_user-abc': JSON.stringify(mockLocalBooks),
    };
    globalThis.localStorage = {
      getItem: vi.fn((key: string) => localStorageStore[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        localStorageStore[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageStore[key];
      }),
      clear: vi.fn(() => {
        localStorageStore = {};
      }),
      length: 0,
      key: vi.fn((index: number) => null),
    } as any;

    // Mock auth session
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-abc', email: 'user@example.com' },
        },
      } as any,
      error: null,
    });

    // Setup Supabase query builder mock chain
    mockSupabaseFrom = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    vi.spyOn(supabase, 'from').mockReturnValue(mockSupabaseFrom as any);
  });

  it('should send only changed physical_location to Supabase and update local cache', async () => {
    const updatedDbData = {
      id: 'book-123',
      user_id: 'user-abc',
      title: 'Livro Original',
      author: 'Autor Teste',
      pages: 200,
      genre: 'Aventura',
      type: 'Livro',
      status: 'Não lido',
      physical_location: 'Prateleira B',
      signed: true,
      sealed: false,
    };

    mockSupabaseFrom.single.mockResolvedValue({
      data: updatedDbData,
      error: null,
    });

    const result = await service.updateBook('book-123', { physicalLocation: 'Prateleira B' });

    // Validate Supabase update payload and constraints
    expect(mockSupabaseFrom.update).toHaveBeenCalledWith({
      physical_location: 'Prateleira B',
    });
    expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('id', 'book-123');
    expect(mockSupabaseFrom.eq).toHaveBeenCalledWith('user_id', 'user-abc');

    // Check returned book state
    expect(result.physicalLocation).toBe('Prateleira B');
    expect(result.signed).toBe(true); // preserved collector field!

    // Verify cache has been updated
    const localBooks = await service.getLocalBooks();
    const cachedBook = localBooks.find((b: Book) => b.id === 'book-123');
    expect(cachedBook?.physicalLocation).toBe('Prateleira B');
  });

  it('should update local cache successfully even when cache is empty', async () => {
    // Clear localStorage to simulate empty cache
    localStorageStore = {};

    const updatedDbData = {
      id: 'book-123',
      user_id: 'user-abc',
      title: 'Livro Original',
      author: 'Autor Teste',
      pages: 200,
      genre: 'Aventura',
      type: 'Livro',
      status: 'Não lido',
      physical_location: 'Prateleira C',
    };

    mockSupabaseFrom.single.mockResolvedValue({
      data: updatedDbData,
      error: null,
    });

    const result = await service.updateBook('book-123', { physicalLocation: 'Prateleira C' });
    expect(result.physicalLocation).toBe('Prateleira C');

    // Cache should now contain the book
    const localBooks = await service.getLocalBooks();
    expect(localBooks.length).toBe(1);
    expect(localBooks[0].id).toBe('book-123');
    expect(localBooks[0].physicalLocation).toBe('Prateleira C');
  });

  it('should override cache correctly even if cache has outdated data', async () => {
    // Cache has outdated title and author
    const outdatedCache = [
      {
        id: 'book-123',
        user_id: 'user-abc',
        title: 'Título Velho',
        author: 'Autor Velho',
        pages: 200,
        genre: 'Aventura',
        type: BookType.Book,
        status: BookStatus.TBR,
        currentPage: 0,
        dateAdded: '2026-07-21',
      },
    ];
    localStorageStore['biblio_tech_cache_user-abc'] = JSON.stringify(outdatedCache);

    const updatedDbData = {
      id: 'book-123',
      user_id: 'user-abc',
      title: 'Novo Título Verdadeiro',
      author: 'Novo Autor Verdadeiro',
      pages: 200,
      genre: 'Aventura',
      type: 'Livro',
      status: 'Não lido',
    };

    mockSupabaseFrom.single.mockResolvedValue({
      data: updatedDbData,
      error: null,
    });

    const result = await service.updateBook('book-123', { title: 'Novo Título Verdadeiro', author: 'Novo Autor Verdadeiro' });
    expect(result.title).toBe('Novo Título Verdadeiro');
    expect(result.author).toBe('Novo Autor Verdadeiro');

    const localBooks = await service.getLocalBooks();
    expect(localBooks[0].title).toBe('Novo Título Verdadeiro');
  });

  it('should not update local cache if Supabase update fails', async () => {
    mockSupabaseFrom.single.mockResolvedValue({
      data: null,
      error: { message: 'Database failure', code: 'P0001' },
    });

    await expect(service.updateBook('book-123', { physicalLocation: 'Prateleira B' })).rejects.toThrow('Database failure');

    // Local cache must remain unchanged (still 'Prateleira A')
    const localBooks = await service.getLocalBooks();
    const cachedBook = localBooks.find((b: Book) => b.id === 'book-123');
    expect(cachedBook?.physicalLocation).toBe('Prateleira A');
  });
});
