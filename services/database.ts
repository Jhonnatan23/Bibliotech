
import type { Book, Profile } from '../types';
import { supabase } from './supabase';

const TABLE_NAME = 'books';
const BASE_LOCAL_STORAGE_KEY = 'biblio_tech_cache_';

const mapBookToDb = (book: any) => {
    const dateAddedValue = book.dateAdded || new Date().toISOString().split('T')[0];
    return {
        id: book.id,
        user_id: book.user_id,
        title: book.title || 'Sem Título',
        author: book.author || 'Autor Desconhecido',
        pages: parseInt(String(book.pages || 0), 10),
        genre: book.genre || '',
        type: book.type || 'Livro',
        status: book.status || 'Não lido',
        rating: (book.rating !== undefined && book.rating !== null && book.rating !== 0) ? parseFloat(String(book.rating)) : null,
        cover_image_url: book.coverImageUrl || null,
        summary: book.summary || null,
        notes: book.notes || null,
        estimated_price: (book.estimatedPrice !== undefined && book.estimatedPrice !== null) ? parseFloat(String(book.estimatedPrice)) : null,
        buy_link: book.buy_link || book.buyLink || null,
        current_page: parseInt(String(book.currentPage || 0), 10),
        date_added: dateAddedValue,
        date_started: book.dateStarted || null,
        date_finished: book.dateFinished || null,
        days_to_finish: (book.daysToFinish !== undefined && book.daysToFinish !== null) ? parseInt(String(book.daysToFinish), 10) : null,
        times_read: (book.times_read !== undefined && book.times_read !== null) ? parseInt(String(book.times_read), 10) : (book.timesRead || 1)
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
    status: db.status,
    rating: db.rating ? parseFloat(String(db.rating)) : undefined,
    coverImageUrl: db.cover_image_url,
    summary: db.summary,
    notes: db.notes,
    estimatedPrice: db.estimated_price ? parseFloat(String(db.estimated_price)) : undefined,
    buyLink: db.buy_link,
    currentPage: db.current_page || 0,
    dateAdded: db.date_added,
    dateStarted: db.date_started,
    dateFinished: db.date_finished,
    daysToFinish: db.days_to_finish,
    timesRead: db.times_read || 1
});

const mapDbToProfile = (db: any): Profile => ({
    id: db.id,
    fullName: db.full_name,
    avatarUrl: db.avatar_url,
    readingGoal: db.reading_goal || 12,
    geminiApiKey: db.gemini_api_key || ''
});

export class DatabaseService {
  private isSchemaBroken = false;
  private onSchemaErrorCallback?: (type: 'table' | 'column' | 'permission', detail?: string) => void;

  setSchemaErrorCallback(cb: (type: 'table' | 'column' | 'permission', detail?: string) => void) {
    this.onSchemaErrorCallback = cb;
  }

  private async getCacheKey(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? `${BASE_LOCAL_STORAGE_KEY}${user.id}` : null;
  }

  private async getLocalBooks(): Promise<Book[]> {
    const key = await this.getCacheKey();
    if (!key) return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  private async saveLocalBooks(books: Book[]): Promise<void> {
    const key = await this.getCacheKey();
    if (!key) return;

    try {
      const data = JSON.stringify(books);
      localStorage.setItem(key, data);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        const leanBooks = books.map(book => ({
          ...book,
          coverImageUrl: (book.coverImageUrl?.startsWith('data:')) ? null : book.coverImageUrl
        }));
        try {
          localStorage.setItem(key, JSON.stringify(leanBooks));
        } catch (innerError) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  async getAllBooks(): Promise<Book[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('date_added', { ascending: false });

      if (error) {
        this.handleSupabaseError(error);
        return await this.getLocalBooks();
      }
      
      this.isSchemaBroken = false;
      const books = (data || []).map(mapDbToBook);
      await this.saveLocalBooks(books);
      return books;
    } catch (err) {
      return await this.getLocalBooks();
    }
  }

  /**
   * Busca estatísticas rápidas via agregação no banco para otimizar o carregamento inicial.
   */
  async getQuickStatsSummary() {
    if (this.isSchemaBroken) return null;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Executa múltiplas contagens em paralelo no banco
      const [read, tbr, wishlist] = await Promise.all([
        supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true }).eq('status', 'Lido').eq('user_id', user.id),
        supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true }).eq('status', 'Não lido').eq('user_id', user.id),
        supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true }).eq('status', 'Lista de Desejos').eq('user_id', user.id)
      ]);

      return {
        readCount: read.count || 0,
        tbrCount: tbr.count || 0,
        wishlistCount: wishlist.count || 0
      };
    } catch (err) {
      return null;
    }
  }

  async saveBook(book: Partial<Book>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Acesso negado.");

    const dbPayload = mapBookToDb(book);
    dbPayload.user_id = user.id;

    const books = await this.getLocalBooks();
    const index = books.findIndex(b => b.id === book.id);
    const updatedBookState = mapDbToBook(dbPayload);
    
    if (index >= 0) books[index] = updatedBookState;
    else books.unshift(updatedBookState);
    
    await this.saveLocalBooks(books);

    if (this.isSchemaBroken) return;
    try {
      await supabase.from(TABLE_NAME).upsert(dbPayload);
    } catch (err) {}
  }

  async deleteBook(id: string): Promise<void> {
    const books = (await this.getLocalBooks()).filter(b => b.id !== id);
    await this.saveLocalBooks(books);
    if (this.isSchemaBroken) return;
    try {
      await supabase.from(TABLE_NAME).delete().eq('id', id);
    } catch (err) {}
  }

  async updateReadingGoal(goal: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.from('profiles').upsert({ id: user.id, reading_goal: goal, updated_at: new Date().toISOString() });
    } catch (err) {}
  }

  async updateProfile(profile: Partial<Profile>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const dbPayload: any = { id: user.id, updated_at: new Date().toISOString() };
      if (profile.fullName !== undefined) dbPayload.full_name = profile.fullName;
      if (profile.avatarUrl !== undefined) dbPayload.avatar_url = profile.avatarUrl;
      if (profile.geminiApiKey !== undefined) dbPayload.gemini_api_key = profile.geminiApiKey;
      
      await supabase.from('profiles').upsert(dbPayload);
    } catch (err) {}
  }

  async getProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (!data) return { id: user.id, fullName: 'Leitor', readingGoal: 12 };
        return mapDbToProfile(data);
    } catch (err) {
        return { id: user.id, fullName: 'Leitor', readingGoal: 12 };
    }
  }

  private handleSupabaseError(error: any) {
    if (error.code === '42P01') this.isSchemaBroken = true;
  }
}

export const dbService = new DatabaseService();
