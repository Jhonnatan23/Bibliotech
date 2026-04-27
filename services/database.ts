
import type { Book, Profile } from '../types';
import { supabase } from './supabase';
import { BookStatus } from '../types';

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
        console.warn(`[Supabase] Tentativa ${attempt + 1} falhou: ${errorMsg}. Tentando novamente em ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      break;
    }
  }
  throw lastError;
};

const mapBookToDb = (book: any) => {
    const dateAddedValue = book.dateAdded || new Date().toISOString().split('T')[0];
    return {
        id: book.id,
        user_id: book.user_id,
        title: book.title || 'Sem Título',
        author: book.author || 'Autor Desconhecido',
        pages: Math.floor(parseInt(String(book.pages || 0), 10)),
        genre: book.genre || '',
        type: book.type || 'Livro',
        status: book.status || 'Não lido',
        rating: (book.rating !== undefined && book.rating !== null && book.rating !== 0) ? parseFloat(String(book.rating)) : null,
        summary: book.summary || null,
        notes: book.notes || null,
        estimated_price: (book.estimatedPrice !== undefined && book.estimatedPrice !== null) ? parseFloat(String(book.estimatedPrice)) : null,
        price_paid: (book.pricePaid !== undefined && book.pricePaid !== null) ? parseFloat(String(book.pricePaid)) : null,
        buy_link: book.buyLink || null,
        current_page: Math.floor(parseInt(String(book.currentPage || 0), 10)),
        date_added: dateAddedValue,
        date_started: book.dateStarted || null,
        date_finished: book.dateFinished || null,
        days_to_finish: (book.daysToFinish !== undefined && book.daysToFinish !== null) ? Math.floor(parseInt(String(book.daysToFinish), 10)) : null,
        times_read: (book.timesRead !== undefined && book.timesRead !== null) ? Math.floor(parseInt(String(book.timesRead), 10)) : 0,
        was_wishlist: book.wasWishlist === true,
        linked_book_ids: book.linkedBookIds || [],
        tags: book.tags || [],
        history_observation: book.historyObservation || null,
        is_loaned: book.isLoaned === true,
        borrower_name: book.borrowerName || null,
        loan_date: book.loanDate || null,
        is_digital: book.isDigital === true
    };
};

const mapDbToBook = (db: any): Book => ({
    id: db.id,
    user_id: db.user_id,
    title: db.title,
    author: db.author,
    pages: db.pages || 0,
    genre: db.genre || '',
    type: db.type,
    status: db.status as BookStatus,
    rating: db.rating ? parseFloat(String(db.rating)) : undefined,
    summary: db.summary,
    notes: db.notes,
    estimatedPrice: db.estimated_price ? parseFloat(String(db.estimated_price)) : undefined,
    pricePaid: db.price_paid ? parseFloat(String(db.price_paid)) : undefined,
    buyLink: db.buy_link,
    currentPage: db.current_page || 0,
    dateAdded: db.date_added,
    dateStarted: db.date_started,
    dateFinished: db.date_finished,
    daysToFinish: db.days_to_finish,
    timesRead: db.times_read || 0,
    wasWishlist: db.was_wishlist === true,
    linkedBookIds: db.linked_book_ids || [],
    tags: db.tags || [],
    historyObservation: db.history_observation,
    isLoaned: db.is_loaned === true,
    borrowerName: db.borrower_name,
    loanDate: db.loan_date,
    isDigital: db.is_digital === true
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
          is_loaned, borrower_name, loan_date, is_digital
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
      console.error("Erro na nuvem, carregando local:", err.message || err);
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

  private async saveLocalBooks(books: Book[]): Promise<void> {
    const user = await this.getSafeUser();
    if (!user) return;
    try {
      localStorage.setItem(`${BASE_LOCAL_STORAGE_KEY}${user.id}`, JSON.stringify(books));
    } catch (e) {}
  }

  async saveBook(book: Partial<Book>): Promise<void> {
    const user = await this.getSafeUser();
    if (!user) return;

    const bookId = book.id || crypto.randomUUID();
    const updatedBookForDb = { ...book, id: bookId, user_id: user.id };
    const dbPayload = mapBookToDb(updatedBookForDb);

    const books = await this.getLocalBooks();
    const index = books.findIndex(b => b.id === bookId);
    const updatedBookState = mapDbToBook(dbPayload);
    
    if (index >= 0) books[index] = updatedBookState;
    else books.unshift(updatedBookState);
    await this.saveLocalBooks(books);

    withRetry(() => supabase.from(TABLE_NAME).upsert(dbPayload)).catch((err: any) => {
        if (err.code === '42703' || (err.message && (err.message.includes('history_observation') || err.message.includes('is_loaned') || err.message.includes('is_digital')))) {
            this.onSchemaErrorCallback?.('column', 'Estrutura de dados desatualizada (módulos de empréstimo, digital ou histórico).');
        }
    });
  }

  async deleteBook(id: string): Promise<void> {
    const user = await this.getSafeUser();
    if (!user) return;
    
    const books = (await this.getLocalBooks()).filter(b => b.id !== id);
    await this.saveLocalBooks(books);
    
    withRetry(() => supabase.from(TABLE_NAME).delete().eq('id', id)).catch((err) => {
        console.error("Erro ao deletar livro na nuvem:", err);
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
            customTags: data.custom_tags || []
        };
    } catch (err) { return { id: user.id, fullName: 'Leitor', readingGoal: 12, customTags: [] }; }
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
      const counts = (data || []).reduce((acc: any, curr: any) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        if (curr.is_loaned) acc.loaned = (acc.loaned || 0) + 1;
        return acc;
      }, {});
      return {
        readCount: counts['Lido'] || 0,
        tbrCount: counts['Não lido'] || 0,
        wishlistCount: counts['Lista de Desejos'] || 0,
        droppedCount: counts['Abandonado'] || 0,
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
}

export const dbService = new DatabaseService();
