
import type { 
  Book, 
  Profile, 
  Loan, 
  DbBookRow, 
  DbBookInsert, 
  DbBookUpdate, 
  DbProfileRow, 
  DbSeriesRow 
} from '../types';
import { supabase } from './supabase';
import { BookStatus, BookType } from '../types';
import { logger } from './monitoring';

const TABLE_NAME = 'books';
const BASE_LOCAL_STORAGE_KEY = 'biblio_tech_cache_';
const FETCH_TIMEOUT_MS = 12000;

/**
 * Função utilitária para lidar com Timeouts e Retentativas
 */
const withRetry = async <T>(
  promiseFn: () => PromiseLike<any>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        promiseFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("TIMEOUT")), FETCH_TIMEOUT_MS)
        )
      ]);
      
      if (result && (result as any).error) throw (result as any).error;
      const data = (result && (result as any).data !== undefined) ? (result as any).data : result;
      return data as T;
    } catch (err: any) {
      lastError = err;
      const errorMsg = err.message?.toLowerCase() || '';
      
      const isRetryable = 
        errorMsg.includes('fetch') || 
        errorMsg.includes('network') || 
        errorMsg.includes('timeout') ||
        errorMsg.includes('abort') ||
        err instanceof TypeError;

      if (isRetryable && attempt < maxRetries) {
        const backoff = delay * (attempt + 1);
        logger.warn(`[Supabase] Tentativa ${attempt + 1} falhou. Tentando novamente em ${backoff}ms...`, { error: errorMsg });
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      break;
    }
  }
  throw lastError;
};

export function parseNullableNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return undefined;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    return parsed;
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return undefined;
    }
    return value;
  }
  return undefined;
}

/**
 * Converte com segurança qualquer valor para número inteiro não-negativo (>= 0).
 * Previne falhas de NaN, números negativos ou strings inválidas para 'pages' e 'current_page'.
 */
export function parseNonNegativeInteger(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

/**
 * Normaliza e tipa fortemente qualquer valor de entrada para o enum BookStatus.
 * Mapeia aliases conhecidos ou strings históricas para garantir integridade com o schema.
 */
export function parseBookStatus(rawStatus: unknown): BookStatus {
  if (!rawStatus || typeof rawStatus !== 'string') {
    return BookStatus.TBR;
  }
  const trimmed = rawStatus.trim();
  if (Object.values(BookStatus).includes(trimmed as BookStatus)) {
    return trimmed as BookStatus;
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'lendo' || lower === 'reading' || lower === 'lendo atualmente') {
    return BookStatus.Reading;
  }
  if (lower === 'lido' || lower === 'read' || lower === 'concluído' || lower === 'concluido') {
    return BookStatus.Read;
  }
  if (lower === 'não lido' || lower === 'nao lido' || lower === 'tbr' || lower === 'quero ler') {
    return BookStatus.TBR;
  }
  if (lower === 'lista de desejos' || lower === 'wishlist' || lower === 'desejo') {
    return BookStatus.Wishlist;
  }
  if (lower === 'abandonado' || lower === 'dropped' || lower === 'desistido') {
    return BookStatus.Dropped;
  }
  return BookStatus.TBR;
}

/**
 * Normaliza e tipa fortemente o campo BookType conforme a constraint chk_books_type do Supabase.
 */
export function parseBookType(rawType: unknown): BookType {
  if (!rawType || typeof rawType !== 'string') {
    return BookType.Book;
  }
  const trimmed = rawType.trim();
  if (trimmed === BookType.HQ || trimmed.toLowerCase() === 'hq') return BookType.HQ;
  if (trimmed === BookType.Manga || trimmed.toLowerCase() === 'mangá' || trimmed.toLowerCase() === 'manga') return BookType.Manga;
  return BookType.Book;
}

/**
 * Valida e formata avaliações garantindo escala numérica de 0.0 a 5.0 (DECIMAL(3,1)).
 */
export function parseRating(value: unknown): number | undefined {
  const num = parseNullableNumber(value);
  if (num === undefined) return undefined;
  const clamped = Math.max(0, Math.min(5, num));
  return Math.round(clamped * 10) / 10;
}

export const mapPartialBookToDb = (changes: Partial<Book>): DbBookUpdate => {
  const dbPayload: DbBookUpdate = {};
  
  if (changes.title !== undefined) dbPayload.title = changes.title || 'Sem Título';
  if (changes.author !== undefined) dbPayload.author = changes.author || 'Autor Desconhecido';
  if (changes.pages !== undefined) dbPayload.pages = parseNonNegativeInteger(changes.pages, 0);
  if (changes.genre !== undefined) dbPayload.genre = changes.genre || '';
  if (changes.type !== undefined) dbPayload.type = parseBookType(changes.type);
  if (changes.status !== undefined) dbPayload.status = parseBookStatus(changes.status);
  
  if (changes.rating !== undefined) {
    dbPayload.rating = parseRating(changes.rating) ?? null;
  }
  if (changes.summary !== undefined) dbPayload.summary = changes.summary || null;
  if (changes.notes !== undefined) dbPayload.notes = changes.notes || null;
  
  if (changes.estimatedPrice !== undefined) {
    dbPayload.estimated_price = parseNullableNumber(changes.estimatedPrice) ?? null;
  }
  if (changes.pricePaid !== undefined) {
    dbPayload.price_paid = parseNullableNumber(changes.pricePaid) ?? null;
  }
  if (changes.buyLink !== undefined) dbPayload.buy_link = changes.buyLink || null;
  
  if (changes.currentPage !== undefined) {
    dbPayload.current_page = parseNonNegativeInteger(changes.currentPage, 0);
  }
  if (changes.dateAdded !== undefined) dbPayload.date_added = changes.dateAdded;
  if (changes.dateStarted !== undefined) dbPayload.date_started = changes.dateStarted || null;
  if (changes.dateFinished !== undefined) dbPayload.date_finished = changes.dateFinished || null;
  
  if (changes.daysToFinish !== undefined) {
    dbPayload.days_to_finish = parseNullableNumber(changes.daysToFinish) ?? null;
  }
  if (changes.timesRead !== undefined) {
    dbPayload.times_read = parseNonNegativeInteger(changes.timesRead, 0);
  }
  if (changes.wasWishlist !== undefined) dbPayload.was_wishlist = changes.wasWishlist === true;
  if (changes.linkedBookIds !== undefined) dbPayload.linked_book_ids = changes.linkedBookIds || [];
  if (changes.tags !== undefined) dbPayload.tags = changes.tags || [];
  if (changes.historyObservation !== undefined) dbPayload.history_observation = changes.historyObservation || null;
  
  if (changes.isLoaned !== undefined) dbPayload.is_loaned = changes.isLoaned === true;
  if (changes.borrowerName !== undefined) dbPayload.borrower_name = changes.borrowerName || null;
  if (changes.loanDate !== undefined) dbPayload.loan_date = changes.loanDate || null;
  if (changes.isDigital !== undefined) dbPayload.is_digital = changes.isDigital === true;
  if (changes.series !== undefined) dbPayload.series = changes.series || null;
  
  if (changes.volume !== undefined) {
    dbPayload.volume = parseNullableNumber(changes.volume) ?? null;
  }
  if (changes.seriesId !== undefined) dbPayload.series_id = changes.seriesId || null;
  if (changes.condition !== undefined) dbPayload.condition = changes.condition || null;
  if (changes.purchaseDate !== undefined) dbPayload.purchase_date = changes.purchaseDate || null;
  if (changes.store !== undefined) dbPayload.store = changes.store || null;
  if (changes.physicalLocation !== undefined) dbPayload.physical_location = changes.physicalLocation || null;
  if (changes.edition !== undefined) dbPayload.edition = changes.edition || null;
  if (changes.isbn !== undefined) dbPayload.isbn = changes.isbn || null;
  
  if (changes.signed !== undefined) dbPayload.signed = changes.signed === true;
  if (changes.sealed !== undefined) dbPayload.sealed = changes.sealed === true;
  if (changes.limitedEdition !== undefined) dbPayload.limited_edition = changes.limitedEdition === true;
  if (changes.firstEdition !== undefined) dbPayload.first_edition = changes.firstEdition === true;
  if (changes.variantCover !== undefined) dbPayload.variant_cover = changes.variantCover === true;
  
  return dbPayload;
};

export const mapBookToDb = (book: any): DbBookRow => {
    const dateAddedValue = book.dateAdded || new Date().toISOString().split('T')[0];
    return {
        id: book.id || crypto.randomUUID(),
        user_id: book.user_id || '',
        title: book.title || 'Sem Título',
        author: book.author || 'Autor Desconhecido',
        pages: parseNonNegativeInteger(book.pages, 0),
        genre: book.genre || '',
        type: parseBookType(book.type),
        status: parseBookStatus(book.status),
        rating: parseRating(book.rating) ?? null,
        summary: book.summary || null,
        notes: book.notes || null,
        estimated_price: parseNullableNumber(book.estimatedPrice) ?? null,
        price_paid: parseNullableNumber(book.pricePaid) ?? null,
        buy_link: book.buyLink || null,
        current_page: parseNonNegativeInteger(book.currentPage, 0),
        date_added: dateAddedValue,
        date_started: book.dateStarted || null,
        date_finished: book.dateFinished || null,
        days_to_finish: parseNullableNumber(book.daysToFinish) ?? null,
        times_read: parseNonNegativeInteger(book.timesRead, 0),
        was_wishlist: book.wasWishlist === true,
        linked_book_ids: book.linkedBookIds || [],
        tags: book.tags || [],
        history_observation: book.historyObservation || null,
        is_loaned: book.isLoaned === true,
        borrower_name: book.borrowerName || null,
        loan_date: book.loanDate || null,
        is_digital: book.isDigital === true,
        series: book.series || null,
        volume: parseNullableNumber(book.volume) ?? null,
        series_id: book.seriesId || null,
        condition: book.condition || null,
        purchase_date: book.purchaseDate || null,
        store: book.store || null,
        physical_location: book.physicalLocation || null,
        edition: book.edition || null,
        isbn: book.isbn || null,
        signed: book.signed === true,
        sealed: book.sealed === true,
        limited_edition: book.limitedEdition === true,
        first_edition: book.firstEdition === true,
        variant_cover: book.variantCover === true
    };
};

const mapSeriesToDb = (series: any): DbSeriesRow => ({
    id: series.id,
    user_id: series.user_id,
    name: series.name,
    total_volumes: series.total_volumes !== undefined ? Math.floor(parseInt(String(series.total_volumes), 10)) : null
});

const mapDbToSeries = (db: any): any => ({
    id: db.id,
    user_id: db.user_id,
    name: db.name,
    total_volumes: db.total_volumes,
    created_at: db.created_at
});

export const mapDbToBook = (db: DbBookRow | Record<string, any>): Book => ({
    id: db.id,
    user_id: db.user_id,
    title: db.title,
    author: db.author,
    pages: parseNonNegativeInteger(db.pages, 0),
    genre: db.genre || '',
    type: parseBookType(db.type),
    status: parseBookStatus(db.status),
    rating: parseRating(db.rating),
    summary: db.summary,
    notes: db.notes,
    estimatedPrice: parseNullableNumber(db.estimated_price),
    pricePaid: parseNullableNumber(db.price_paid),
    buyLink: db.buy_link,
    currentPage: parseNonNegativeInteger(db.current_page, 0),
    dateAdded: db.date_added,
    dateStarted: db.date_started,
    dateFinished: db.date_finished,
    daysToFinish: (db.days_to_finish !== null && db.days_to_finish !== undefined ? parseNullableNumber(db.days_to_finish) : null) as any,
    timesRead: parseNonNegativeInteger(db.times_read, 0),
    wasWishlist: db.was_wishlist === true,
    linkedBookIds: db.linked_book_ids || [],
    tags: db.tags || [],
    historyObservation: db.history_observation,
    isLoaned: db.is_loaned === true,
    borrowerName: db.borrower_name,
    loanDate: db.loan_date,
    isDigital: db.is_digital === true,
    series: db.series,
    volume: parseNullableNumber(db.volume),
    seriesId: db.series_id,
    condition: db.condition,
    purchaseDate: db.purchase_date,
    store: db.store,
    physicalLocation: db.physical_location,
    edition: db.edition,
    isbn: db.isbn,
    signed: db.signed === true,
    sealed: db.sealed === true,
    limitedEdition: db.limited_edition === true,
    firstEdition: db.first_edition === true,
    variantCover: db.variant_cover === true
});

export class DatabaseService {
  private cachedUser: any = null;
  private onSchemaErrorCallback?: (type: 'table' | 'column' | 'permission', detail?: string) => void;

  setSchemaErrorCallback(cb: (type: 'table' | 'column' | 'permission', detail?: string) => void) {
    this.onSchemaErrorCallback = cb;
  }

  private async getSafeUser() {
    if (this.cachedUser) return this.cachedUser;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            this.cachedUser = session.user;
            return session.user;
        }
        return null;
    } catch (e) {
        return null;
    }
  }

  async getAllBooks(): Promise<Book[]> {
    try {
      const user = await this.getSafeUser();
      if (!user) return await this.getLocalBooks();

      const data = await withRetry<any[]>(() => supabase
        .from(TABLE_NAME)
        .select(`
          id, title, author, pages, genre, type, status, rating, 
          current_page, date_added, date_started, 
          date_finished, days_to_finish, times_read, was_wishlist,
          summary, notes, estimated_price, price_paid, buy_link, user_id,
          linked_book_ids, tags, history_observation,
          is_loaned, borrower_name, loan_date, is_digital,
          series, volume, series_id,
          condition, purchase_date, store, physical_location,
          edition, isbn, signed, sealed, limited_edition,
          first_edition, variant_cover
        `)
        .eq('user_id', user.id)
        .order('date_added', { ascending: false })
      );
      
      const books = (data || []).map(mapDbToBook);
      await this.saveLocalBooks(books);
      return books;
    } catch (err: any) {
      if (err.code === '42703' || (err.message && (err.message.includes('linked_book_ids') || err.message.includes('history_observation') || err.message.includes('is_loaned') || err.message.includes('is_digital')))) {
        this.onSchemaErrorCallback?.('column', 'Estrutura de dados desatualizada (módulos de empréstimo, digital ou histórico).');
      }
      logger.error("Erro na nuvem, carregando local", { error: err.message || err });
      return await this.getLocalBooks();
    }
  }

  async getLocalBooks(): Promise<Book[]> {
    const user = await this.getSafeUser();
    if (!user) return [];
    try {
      const data = localStorage.getItem(`${BASE_LOCAL_STORAGE_KEY}${user.id}`);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  }

  private async getPendingQueue(): Promise<Array<{ type: 'save' | 'update' | 'delete', id: string, payload?: any }>> {
    const user = await this.getSafeUser();
    const storageKey = user ? `biblio_tech_pending_queue_${user.id}` : `biblio_tech_pending_queue_guest`;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  private async savePendingQueue(queue: any[]): Promise<void> {
    const user = await this.getSafeUser();
    const storageKey = user ? `biblio_tech_pending_queue_${user.id}` : `biblio_tech_pending_queue_guest`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(queue));
    } catch (e) {}
  }

  async addPendingSync(item: { type: 'save' | 'update' | 'delete', id: string, payload?: any }): Promise<void> {
    const queue = await this.getPendingQueue();
    const idx = queue.findIndex(q => q.id === item.id);
    if (idx >= 0) {
      queue[idx] = item;
    } else {
      queue.push(item);
    }
    await this.savePendingQueue(queue);
  }

  async removePendingSync(id: string): Promise<void> {
    const queue = await this.getPendingQueue();
    const updated = queue.filter(q => q.id !== id);
    await this.savePendingQueue(updated);
  }

  async getPendingCount(): Promise<number> {
    const queue = await this.getPendingQueue();
    return queue.length;
  }

  async syncPendingQueue(): Promise<number> {
    const user = await this.getSafeUser();
    if (!user || !navigator.onLine) return await this.getPendingCount();

    const queue = await this.getPendingQueue();
    if (queue.length === 0) return 0;

    const remainingQueue: any[] = [];
    for (const item of queue) {
      try {
        if (item.type === 'save' || item.type === 'update') {
          const { error } = await supabase.from(TABLE_NAME).upsert(item.payload, { onConflict: 'id' });
          if (error) throw error;
        } else if (item.type === 'delete') {
          const { error } = await supabase.from(TABLE_NAME).delete().eq('id', item.id);
          if (error) throw error;
        }
      } catch (e) {
        remainingQueue.push(item);
      }
    }

    await this.savePendingQueue(remainingQueue);
    return remainingQueue.length;
  }

  private async saveLocalBooks(books: Book[]): Promise<void> {
    const user = await this.getSafeUser();
    if (!user) return;
    try {
      localStorage.setItem(`${BASE_LOCAL_STORAGE_KEY}${user.id}`, JSON.stringify(books));
    } catch (e) {}
  }

  async saveBook(book: Partial<Book>): Promise<void> {
    const user = await this.getSafeUser();
    const bookId = book.id || crypto.randomUUID();
    const books = await this.getLocalBooks();
    const index = books.findIndex(b => b.id === bookId);
    const existingBook = index >= 0 ? books[index] : {};

    const userId = user?.id || 'local_user';
    const updatedBookForDb = { ...existingBook, ...book, id: bookId, user_id: userId };
    const dbPayload = mapBookToDb(updatedBookForDb);

    logger.info(`[Database] Preparando para salvar livro: "${dbPayload.title}"`, { bookId, seriesId: dbPayload.series_id });

    const updatedBookState = mapDbToBook(dbPayload);

    if (!user) {
      if (index >= 0) books[index] = updatedBookState;
      else books.unshift(updatedBookState);
      await this.saveLocalBooks(books);
      await this.addPendingSync({ type: 'save', id: bookId, payload: dbPayload });
      return;
    }

    try {
      const { data, error, status } = await supabase
        .from(TABLE_NAME)
        .upsert(dbPayload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        logger.error(`[Supabase] Erro no upsert de livro`, { status, error: error.message || error });
        await this.addPendingSync({ type: 'save', id: bookId, payload: dbPayload });
        throw error;
      }

      if (index >= 0) books[index] = updatedBookState;
      else books.unshift(updatedBookState);
      await this.saveLocalBooks(books);
      await this.removePendingSync(bookId);
      logger.info("[Database] Livro saved no Supabase", { title: data?.title });
    } catch (err: any) {
      logger.error("[Database] Exceção ao salvar livro", { error: err.message || err });
      await this.addPendingSync({ type: 'save', id: bookId, payload: dbPayload });
      if (err.code === '42703' || (err.message && (err.message.includes('history_observation') || err.message.includes('is_loaned') || err.message.includes('is_digital')))) {
        this.onSchemaErrorCallback?.('column', 'Estrutura de dados desatualizada (módulos de empréstimo, digital ou histórico).');
      }
      throw err;
    }
  }

  async updateBook(id: string, changes: Partial<Book>): Promise<Book> {
    const user = await this.getSafeUser();
    const dbPayload = mapPartialBookToDb(changes);

    if (!user) {
      const books = await this.getLocalBooks();
      const index = books.findIndex(b => b.id === id);
      if (index === -1) {
        throw new Error("Livro não encontrado localmente.");
      }
      const updatedBookState = { ...books[index], ...changes, id } as Book;
      books[index] = updatedBookState;
      await this.saveLocalBooks(books);
      await this.addPendingSync({ type: 'update', id, payload: dbPayload });
      return updatedBookState;
    }

    logger.info(`[Database] Preparando atualização parcial para o livro: ${id}`, { fields: Object.keys(dbPayload) });

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(dbPayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        logger.error(`[Supabase] Erro na atualização parcial do livro ${id}`, { error: error.message || error });
        await this.addPendingSync({ type: 'update', id, payload: dbPayload });
        throw error;
      }

      if (!data) {
        throw new Error("Livro não encontrado ou você não tem permissão para editá-lo.");
      }

      const updatedBookState = mapDbToBook(data);

      const books = await this.getLocalBooks();
      const index = books.findIndex(b => b.id === id);
      if (index >= 0) {
        books[index] = updatedBookState;
      } else {
        books.unshift(updatedBookState);
      }
      await this.saveLocalBooks(books);
      await this.removePendingSync(id);

      logger.info("[Database] Livro atualizado com sucesso via atualização parcial", { id });
      return updatedBookState;
    } catch (err: any) {
      logger.error("[Database] Exceção na atualização parcial do livro", { error: err.message || err });
      await this.addPendingSync({ type: 'update', id, payload: dbPayload });
      if (err.code === '42703' || (err.message && (err.message.includes('history_observation') || err.message.includes('is_loaned') || err.message.includes('is_digital')))) {
        this.onSchemaErrorCallback?.('column', 'Estrutura de dados desatualizada.');
      }
      throw err;
    }
  }

  async importBooks(importedBooks: Book[]): Promise<Book[]> {
    const user = await this.getSafeUser();
    if (!user) throw new Error("Usuário não autenticado.");

    // Filter out invalid records
    const validBooks = importedBooks.filter(b => b && typeof b === 'object' && b.title);

    // Get current local books to prevent duplicates or merge properly
    const localBooks = await this.getLocalBooks();
    const mergedBooks: Book[] = [...localBooks];
    const dbPayloads: any[] = [];

    for (const b of validBooks) {
      const bookId = b.id || crypto.randomUUID();
      const updatedBook = { 
        ...b, 
        id: bookId, 
        user_id: user.id,
        dateAdded: b.dateAdded || new Date().toISOString().split('T')[0]
      };
      
      const dbPayload = mapBookToDb(updatedBook);
      dbPayloads.push(dbPayload);

      // Update in merged list
      const index = mergedBooks.findIndex(item => item.id === bookId);
      const mappedBook = mapDbToBook(dbPayload);
      if (index >= 0) {
        mergedBooks[index] = mappedBook;
      } else {
        mergedBooks.unshift(mappedBook);
      }
    }

    // Save to local storage
    await this.saveLocalBooks(mergedBooks);

    // Save to Supabase in batch upsert
    if (dbPayloads.length > 0) {
      try {
        const { error } = await supabase
          .from(TABLE_NAME)
          .upsert(dbPayloads, { onConflict: 'id' });
          
        if (error) {
          logger.error("[Database] Erro ao importar no Supabase", { error: error.message || error });
          throw error;
        }
      } catch (err: any) {
        logger.error("[Database] Exceção na importação do Supabase", { error: err.message || err });
      }
    }

    return mergedBooks;
  }

  async deleteBook(id: string): Promise<void> {
    const user = await this.getSafeUser();
    if (!user) return;
    
    const books = (await this.getLocalBooks()).filter(b => b.id !== id);
    await this.saveLocalBooks(books);
    
    withRetry(() => supabase.from(TABLE_NAME).delete().eq('id', id)).catch((err) => {
        logger.error("Erro ao deletar livro na nuvem", { error: err.message || err });
    });
  }

  async getProfile(): Promise<Profile | null> {
    const user = await this.getSafeUser();
    if (!user) return null;
    try {
        const data = await withRetry<any>(() => 
          supabase.from('profiles').select('id, full_name, avatar_url, reading_goal, custom_tags').eq('id', user.id).single()
        );
        return {
            id: data.id,
            fullName: data.full_name,
            avatarUrl: data.avatar_url,
            readingGoal: data.reading_goal,
            customTags: data.custom_tags || [],
            email: user.email
        };
    } catch (err) { return { id: user.id, fullName: 'Leitor', readingGoal: 12, customTags: [], email: user.email }; }
  }

  async updateReadingGoal(goal: number): Promise<void> {
    const user = await this.getSafeUser();
    if (!user) return;
    withRetry(() => supabase.from('profiles').upsert({ id: user.id, reading_goal: Math.round(goal), updated_at: new Date().toISOString() })).catch(() => {});
  }

  async updateProfile(profile: Partial<Profile>): Promise<void> {
    const user = await this.getSafeUser();
    if (!user) return;
    const dbPayload: any = { id: user.id, updated_at: new Date().toISOString() };
    if (profile.fullName !== undefined) dbPayload.full_name = profile.fullName;
    if (profile.avatarUrl !== undefined) dbPayload.avatar_url = profile.avatarUrl;
    if (profile.customTags !== undefined) dbPayload.custom_tags = profile.customTags;
    
    withRetry(() => supabase.from('profiles').upsert(dbPayload)).catch(() => {});
  }

  async getQuickStatsSummary() {
    const user = await this.getSafeUser();
    if (!user) return null;
    try {
      const data = await withRetry<any[]>(() => 
        supabase.from(TABLE_NAME).select('status, is_loaned').eq('user_id', user.id)
      );
      const counts = (data || []).reduce((acc: Record<string, number>, curr: any) => {
        const normalized = parseBookStatus(curr.status);
        acc[normalized] = (acc[normalized] || 0) + 1;
        if (curr.is_loaned) acc.loaned = (acc.loaned || 0) + 1;
        return acc;
      }, {});
      return {
        readCount: counts[BookStatus.Read] || 0,
        tbrCount: counts[BookStatus.TBR] || 0,
        wishlistCount: counts[BookStatus.Wishlist] || 0,
        droppedCount: counts[BookStatus.Dropped] || 0,
        loanedCount: counts.loaned || 0
      };
    } catch (e) { return null; }
  }

  async getLocalStats() {
    const user = await this.getSafeUser();
    if (!user) return null;
    try {
      const data = localStorage.getItem(`${BASE_LOCAL_STORAGE_KEY}${user.id}_stats`);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  }

  // --- Séries / Sagas ---
  async getAllSeries(): Promise<any[]> {
    const user = await this.getSafeUser();
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return (data || []).map(mapDbToSeries);
    } catch (err: any) {
      logger.error("Erro ao buscar séries", { error: err.message || err });
      return [];
    }
  }

  async saveSeries(series: any): Promise<void> {
    const user = await this.getSafeUser();
    if (!user) throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
    
    const seriesId = series.id || crypto.randomUUID();

    const dbPayload: any = {
      id: seriesId,
      user_id: user.id,
      name: series.name.trim(),
      total_volumes: (series.total_volumes !== undefined && series.total_volumes !== null && series.total_volumes !== '') 
        ? parseInt(String(series.total_volumes), 10) 
        : null
    };

    if (isNaN(dbPayload.total_volumes)) {
      dbPayload.total_volumes = null;
    }

    try {
      logger.info(`[Database] Salvando série. User: ${user.id}`, { seriesId: dbPayload.id });
      
      // Usando upsert para simplificar e garantir que RLS com ID manual funcione melhor
      const { error, data, status } = await supabase
        .from('series')
        .upsert(dbPayload)
        .select()
        .single();
          
      if (error) {
        logger.error(`[Supabase Error] Upsert em 'series' falhou`, { status, error: error.message || error });
        throw error;
      }
      
      logger.info("[Database] Série salva com sucesso", { seriesId: data?.id });
    } catch (error: any) {
      logger.error("Supabase error in saveSeries", { error: error.message || error });
      if (error.code === '42501' || error.message?.includes('row-level security policy')) {
        throw new Error("Erro de permissão: Certifique-se de que as políticas (RLS) foram aplicadas na tabela 'series'.");
      }
      throw new Error(error.message || "Erro desconhecido ao salvar série");
    }
  }

  async deleteSeries(id: string): Promise<void> {
    const { error } = await supabase.from('series').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Histórias (Estúdio Criativo) ---
  async getAllStories(): Promise<any[]> {
    const user = await this.getSafeUser();
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      logger.error("Erro ao buscar histórias", { error: err.message || err });
      return [];
    }
  }

  async saveStory(story: Partial<any>): Promise<any> {
    const user = await this.getSafeUser();
    if (!user) throw new Error("Usuário não autenticado.");
    
    const storyId = story.id || crypto.randomUUID();
    const dbPayload: any = {
      id: storyId,
      user_id: user.id,
      title: story.title || 'História sem título',
      content: story.content || '',
      influences: story.influences || { books: [], authors: [] },
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('stories')
        .upsert(dbPayload)
        .select()
        .single();
          
      if (error) throw error;
      return data;
    } catch (error: any) {
      logger.error("Supabase error in saveStory", { error: error.message || error });
      throw new Error(error.message || "Erro ao salvar história");
    }
  }

  async deleteStory(id: string): Promise<void> {
    const { error } = await supabase.from('stories').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Empréstimos (Controle de Empréstimos) ---
  async getAllLoans(): Promise<Loan[]> {
    const user = await this.getSafeUser();
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('loan_date', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Loan[];
    } catch (err: any) {
      logger.error("Erro ao buscar empréstimos do Supabase", { error: err.message || err });
      return [];
    }
  }

  async createLoan(bookId: string, borrowerName: string, borrowerEmail: string | undefined, dueDate: string): Promise<any> {
    const user = await this.getSafeUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch("/api/loans", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        bookId,
        borrowerName,
        borrowerEmail,
        dueDate,
        userId: user.id
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Falha ao registrar empréstimo no servidor.");
    }

    return await response.json();
  }

  async returnLoan(loanId: string): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`/api/loans/${loanId}/return`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Falha ao finalizar empréstimo no servidor.");
    }

    return await response.json();
  }
}

export const dbService = new DatabaseService();
