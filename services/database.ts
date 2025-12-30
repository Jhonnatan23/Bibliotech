
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
        rating: (book.rating !== undefined && book.rating !== null && book.rating !== 0) ? parseInt(String(book.rating), 10) : null,
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
        times_read: (book.timesRead !== undefined && book.timesRead !== null) ? parseInt(String(book.timesRead), 10) : 1
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
    rating: db.rating,
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
    readingGoal: db.reading_goal || 12
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
      // Se a cota do LocalStorage for atingida (QuotaExceededError)
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn("BiblioTech: Limite de armazenamento local atingido. Otimizando cache...");
        
        // Removemos apenas as imagens base64 (pesadas) do cache local
        // Elas continuarão salvas no Supabase, apenas o cache local fica "leve"
        const leanBooks = books.map(book => ({
          ...book,
          coverImageUrl: (book.coverImageUrl?.startsWith('data:')) ? null : book.coverImageUrl
        }));
        
        try {
          localStorage.setItem(key, JSON.stringify(leanBooks));
        } catch (innerError) {
          // Se nem os textos couberem, limpamos o cache desse usuário
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

  async saveBook(book: Partial<Book>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Acesso negado: Usuário não autenticado.");

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
      const { error } = await supabase.from(TABLE_NAME).upsert(dbPayload);
      if (error) {
        this.handleSupabaseError(error);
        throw error;
      }
    } catch (err: any) {
      console.error("Erro ao salvar no banco:", err.message);
      throw err;
    }
  }

  async deleteBook(id: string): Promise<void> {
    const books = (await this.getLocalBooks()).filter(b => b.id !== id);
    await this.saveLocalBooks(books);

    if (this.isSchemaBroken) return;
    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) this.handleSupabaseError(error);
    } catch (err) {}
  }

  async updateReadingGoal(goal: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.from('profiles').upsert({ 
        id: user.id, 
        reading_goal: parseInt(String(goal), 10), 
        updated_at: new Date().toISOString() 
      });
    } catch (err) {}
  }

  async updateProfile(profile: Partial<Profile>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { fullName, avatarUrl } = profile;
      const dbPayload: any = { id: user.id, updated_at: new Date().toISOString() };
      if (fullName !== undefined) dbPayload.full_name = fullName;
      if (avatarUrl !== undefined) dbPayload.avatar_url = avatarUrl;
      
      await supabase.from('profiles').upsert(dbPayload);
    } catch (err) {}
  }

  async getProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error || !data) return { id: user.id, fullName: 'Leitor', readingGoal: 12 };
        return mapDbToProfile(data);
    } catch (err) {
        return { id: user.id, fullName: 'Leitor', readingGoal: 12 };
    }
  }

  private handleSupabaseError(error: any) {
    if (error.code === '42P01') {
      this.isSchemaBroken = true;
      this.onSchemaErrorCallback?.('table');
    } else if (error.code === '42501') {
      this.onSchemaErrorCallback?.('permission');
    } else if (error.code === '42703') {
       const columnName = error.message.match(/"(.*?)"/)?.[1] || 'desconhecida';
       this.onSchemaErrorCallback?.('column', columnName);
    }
  }
}

export const dbService = new DatabaseService();
