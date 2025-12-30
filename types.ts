
export enum BookStatus {
  Reading = 'Lendo atualmente',
  TBR = 'Não lido',
  Read = 'Lido',
  Wishlist = 'Lista de Desejos',
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

// Added missing StatusConfig type definition
export interface StatusConfig {
  label: string;
  color: 'blue' | 'green' | 'amber' | 'pink';
}

// Added missing StatusConfigs type definition
export type StatusConfigs = Record<BookStatus, StatusConfig>;

// Added missing STATUS_COLORS constant for status badges styling
export const STATUS_COLORS = {
  blue: { bg: 'bg-blue-50', text: 'text-primary', border: 'border-blue-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
} as const;

// Added missing STATUS_CONFIGS constant to map status to labels and colors
export const STATUS_CONFIGS: StatusConfigs = {
  [BookStatus.Reading]: { label: 'Lendo', color: 'blue' },
  [BookStatus.TBR]: { label: 'Quero Ler', color: 'amber' },
  [BookStatus.Read]: { label: 'Lidos', color: 'green' },
  [BookStatus.Wishlist]: { label: 'Wishlist', color: 'pink' },
};

export interface Book {
  id: string;
  title: string;
  author: string;
  pages: number;
  genre: string;
  type: BookType;
  status: BookStatus;
  rating?: number;
  coverImageUrl?: string;
  summary?: string;
  yearRead?: number;
  monthRead?: string;
  estimatedPrice?: number;
  buyLink?: string;
  currentPage?: number;
  dateAdded: string; // ISO string format (YYYY-MM-DD)
  dateStarted?: string; // ISO string format (YYYY-MM-DD)
  dateFinished?: string; // ISO string format (YYYY-MM-DD)
}

export type NewBook = Omit<Book, 'id' | 'monthRead'>;


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

export interface ReadingStats {
  tbrCount: number;
  wishlistCount: number;
  yearly: YearlyStats;
  monthly: MonthlyStat[];
  byType: TypeStat[];
}

export type DateFilter = 'thisYear' | 'allTime';
