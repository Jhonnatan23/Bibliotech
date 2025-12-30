import type { Book } from '../types';
import { supabase } from './supabase';

const TABLE_NAME = 'books';
const LOCAL_STORAGE_KEY = 'biblio_tech_local_db';

export class DatabaseService {
  private useLocalStorage = false;

  private getLocalBooks(): Book[] {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveLocalBooks(books: Book[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(books));
  }

  async getAllBooks(): Promise<Book[]> {
    try {
      // Usamos aspas duplas na ordenação caso a coluna tenha sido criada como case-sensitive
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('dateAdded', { ascending: false });

      if (error) {
        // Erro 42P01: Tabela não existe | 42703: Coluna não existe
        if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('relation "books" does not exist')) {
          this.logSchemaAdvice();
          this.useLocalStorage = true;
          return this.getLocalBooks();
        }
        throw error;
      }
      
      this.useLocalStorage = false;
      return (data as Book[]) || [];
    } catch (err: any) {
      console.warn('Fallback para Armazenamento Local:', err.message);
      this.useLocalStorage = true;
      return this.getLocalBooks();
    }
  }

  async saveBook(book: Book): Promise<void> {
    if (this.useLocalStorage) {
      this.updateLocalEntry(book);
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .upsert(book);

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro de sincronização, salvando localmente:', err.message);
      this.updateLocalEntry(book);
    }
  }

  private updateLocalEntry(book: Book) {
    const books = this.getLocalBooks();
    const index = books.findIndex(b => b.id === book.id);
    if (index >= 0) {
      books[index] = book;
    } else {
      books.unshift(book);
    }
    this.saveLocalBooks(books);
  }

  async deleteBook(id: string): Promise<void> {
    if (this.useLocalStorage) {
      const books = this.getLocalBooks().filter(b => b.id !== id);
      this.saveLocalBooks(books);
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao deletar:', err.message);
    }
  }

  private logSchemaAdvice() {
    console.log(`
%c 💡 CONFIGURAÇÃO NECESSÁRIA %c
O Supabase não encontrou a tabela 'books'. 
Abra o SQL Editor no Supabase e execute o conteúdo do arquivo 'schema.sql'.

%c Importante: %c As colunas em camelCase DEVEM estar entre aspas duplas no SQL.
`, 
'color: #ffffff; background: #2563eb; padding: 2px 5px; border-radius: 3px; font-weight: bold;', 
'color: #475569;',
'color: #e11d48; font-weight: bold;',
'color: #475569;');
  }
}

export const dbService = new DatabaseService();