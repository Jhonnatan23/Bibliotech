
export enum BookStatus {
  Reading = 'Lendo atualmente',
  TBR = 'Não lido',
  Read = 'Lido',
  Wishlist = 'Lista de Desejos',
  Dropped = 'Abandonado',
}

export enum BookType {
  Book = 'Livro',
  HQ = 'HQ',
}

export const GENRES = [
  'Contos', 'Terror', 'Suspense', 'Marvel', 'DC', 'Aventura', 'Investigação', 
  'Romance', 'Biografia', 'Fantasia', 'Policial', 'História', 'Entretenimento', 
  'Espacial', 'Ficção', 'Científico', 'Esporte', 'Autoajuda', 'Negócio', 
  'Quadrinho', 'Clássico', 'Thriller Psicológico', 'Épica', 'Infantil', 
  'Religiosos', 'Economia', 'Mistério', 'Mitologia', 'Misticismo'
].sort();

export interface StatusConfig {
  label: string;
  color: 'blue' | 'green' | 'amber' | 'pink' | 'slate';
}

export type StatusConfigs = Record<BookStatus, StatusConfig>;

export const STATUS_COLORS = {
  blue: { bg: 'bg-blue-50', text: 'text-secondary', border: 'border-blue-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
} as const;

export const STATUS_CONFIGS: StatusConfigs = {
  [BookStatus.Reading]: { label: 'Lendo', color: 'blue' },
  [BookStatus.TBR]: { label: 'Quero Ler', color: 'amber' },
  [BookStatus.Read]: { label: 'Lidos', color: 'green' },
  [BookStatus.Wishlist]: { label: 'Wishlist', color: 'pink' },
  [BookStatus.Dropped]: { label: 'Abandonado', color: 'slate' },
};

export interface Profile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  readingGoal?: number;
  customTags?: string[];
  email?: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  pages: number;
  genre: string;
  type: BookType;
  status: BookStatus;
  rating?: number;
  summary?: string;
  notes?: string;
  estimatedPrice?: number;
  pricePaid?: number;
  buyLink?: string;
  currentPage?: number;
  dateAdded: string;
  dateStarted?: string;
  dateFinished?: string;
  daysToFinish?: number;
  timesRead?: number;
  wasWishlist?: boolean;
  linkedBookIds?: string[];
  tags?: string[];
  historyObservation?: string;
  isLoaned?: boolean;
  borrowerName?: string;
  loanDate?: string;
  isDigital?: boolean;
  series?: string;
  volume?: number;
  seriesId?: string;
}

export interface Series {
  id: string;
  user_id: string;
  name: string;
  total_volumes?: number;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  title: string;
  content: string;
  influences: {
    books: string[];
    authors: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  title: string;
  author: string;
  reason: string;
  genre: string;
  buyLink?: string;
}

export type NewBook = Omit<Book, 'id' | 'user_id'>;

export interface MonthlyStat {
  month: string;
  booksRead: number;
  pagesRead: number;
  avgRating: number;
}

export interface YearlyStats {
  booksRead: number;
  pagesRead: number;
  avgRating: number;
}

export interface TypeStat {
  type: BookType;
  count: number;
  pages: number;
  avgRating: number;
}

export interface GenreStat {
  genre: string;
  count: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface ReadingStats {
  tbrCount: number;
  wishlistCount: number;
  loanedCount: number;
  totalSpent: number;
  avgPagesPerDay: number;
  consistency: number;
  global: YearlyStats; // Métricas de todo o tempo
  yearly: YearlyStats; // Métricas do período filtrado
  monthly: MonthlyStat[];
  byType: TypeStat[];
  byGenre: GenreStat[];
  byAuthor: AuthorStat[];
  byStatus: StatusStat[];
}

export interface AuthorStat {
  author: string;
  count: number;
}

export type DateFilter = 'thisYear' | 'allTime' | 'custom' | 'specificYear';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
