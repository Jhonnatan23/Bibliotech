
import { logger } from '../services/monitoring';
import React, { useMemo, useState, useEffect } from 'react';
import type { ReadingStats, Book, DateFilter, Recommendation, NewBook, Profile } from '../types';
import { BookStatus, BookType } from '../types';
import { StatCard } from './StatCard';
import { CurrentlyReading } from './CurrentlyReading';
import { MonthlyChart } from './MonthlyChart';
import { TypePieChart } from './TypePieChart';
import { GenreBarChart } from './GenreBarChart';
import { StatusDistribution } from './StatusDistribution';
import { ReadingGoal } from './ReadingGoal';
import { YearlyGoalChart } from './YearlyGoalChart';
import { Recommendations } from './Recommendations';
import { LatestReadings } from './LatestReadings';
import { AIInsightsPanel } from './AIInsightsPanel';
import { ShelfProgress } from './ShelfProgress';
import { CronogramaLeitura } from './CronogramaLeitura';
import { Achievements } from './Achievements';
import { BookOpenIcon, ChartBarIcon, StarIcon, TagIcon, HeartIcon, SparklesIcon, MagnifyingGlassIcon, XMarkIcon, PlayIcon } from './Icons';
import { getAIRecommendations } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  stats: ReadingStats;
  currentlyReading: Book | null;
  updateBook: (book: Book) => Promise<void>;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  books: Book[];
  customRange?: { start: string; end: string };
  setCustomRange?: (range: { start: string; end: string }) => void;
  readingGoal: number;
  onSetReadingGoal: (val: number) => void;
  addBook: (book: NewBook) => Promise<void>;
  onRandomPick: () => void;
  profile: Profile | null;
  onOpenJournal?: (bookId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({ 
  stats, 
  currentlyReading, 
  updateBook, 
  dateFilter, 
  setDateFilter,
  selectedYear,
  setSelectedYear,
  availableYears,
  books,
  customRange,
  setCustomRange,
  readingGoal,
  onSetReadingGoal,
  addBook,
  onRandomPick,
  profile,
  onOpenJournal
}) => {
  const [aiRecs, setAiRecs] = useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [demandExceeded, setDemandExceeded] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookToStart, setSelectedBookToStart] = useState<Book | null>(null);
  const [isStartingReading, setIsStartingReading] = useState(false);

  const searchedBooks = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return books.filter(b => 
      b.status !== BookStatus.Wishlist &&
      (b.title.toLowerCase().includes(term) || 
       b.author.toLowerCase().includes(term))
    );
  }, [searchTerm, books]);

  const handleStartReadingSearch = async (book: Book) => {
    setIsStartingReading(true);
    try {
      const updated: Book = {
        ...book,
        status: BookStatus.Reading,
        dateStarted: new Date().toISOString().split('T')[0]
      };
      await updateBook(updated);
      setSelectedBookToStart(null);
      setSearchTerm('');
    } catch (err) {
      logger.error("Erro ao iniciar leitura do livro pesquisado:", err);
    } finally {
      setIsStartingReading(false);
    }
  };

  const fetchRecs = async () => {
    setIsLoadingRecs(true);
    setAiError(null);
    setQuotaExceeded(false);
    setDemandExceeded(false);
    const readBooksContext = books
      .filter(b => b.status === BookStatus.Read)
      .map(b => ({ 
        title: b.title, 
        genre: b.genre,
        rating: b.rating 
      }));
    
    try {
      const recs = await getAIRecommendations(readBooksContext);
      setAiRecs(recs);
    } catch (err: any) {
      if (err.message === 'QUOTA_EXCEEDED') {
        setQuotaExceeded(true);
      } else if (err.message === 'HIGH_DEMAND') {
        setDemandExceeded(true);
      } else {
        setAiError(err.message || "Erro inesperado ao carregar recomendações.");
        logger.error("Erro ao carregar recomendações:", err);
      }
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (aiRecs.length === 0 && !isLoadingRecs && !quotaExceeded && !demandExceeded && !aiError) {
        fetchRecs();
    }
  }, []);

  const booksReadThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return books.filter(b => 
      b.status === BookStatus.Read && 
      b.dateFinished && 
      new Date(b.dateFinished).getFullYear() === currentYear
    ).length;
  }, [books]);
  
  const periodTitle = useMemo(() => {
    if (dateFilter === 'thisYear') return 'Ano Atual';
    if (dateFilter === 'allTime') return 'Total';
    if (dateFilter === 'specificYear') return `Ano ${selectedYear}`;
    return '';
  }, [dateFilter, selectedYear]);

  const latestReadBooks = useMemo(() => {
    return books
      .filter(b => b.status === BookStatus.Read && b.dateFinished)
      .sort((a, b) => (b.dateFinished || '').localeCompare(a.dateFinished || ''))
      .slice(0, 5);
  }, [books]);

  const handleAddRecommendation = async (rec: Recommendation) => {
    const newBook: NewBook = {
      title: rec.title,
      author: rec.author,
      genre: rec.genre,
      status: BookStatus.TBR,
      type: BookType.Book,
      pages: 0,
      buyLink: rec.buyLink,
      summary: rec.reason,
      dateAdded: new Date().toISOString().split('T')[0],
      wasWishlist: false
    };
    await addBook(newBook);
  };

  const seriesGaps = useMemo(() => {
    const groups: Record<string, number[]> = {};
    books.forEach(b => {
      if (b.series && b.volume) {
        if (!groups[b.series]) groups[b.series] = [];
        groups[b.series].push(b.volume);
      }
    });

    const gaps: { name: string; volume: number }[] = [];
    Object.entries(groups).forEach(([name, volumes]) => {
      if (volumes.length > 0) {
        const min = Math.min(...volumes);
        const max = Math.max(...volumes);
        for (let i = min; i <= max; i++) {
          if (!volumes.includes(i)) {
            gaps.push({ name, volume: i });
          }
        }
      }
    });
    return gaps.slice(0, 3);
  }, [books]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Barra de Pesquisa */}
        <div className="relative flex-1 max-w-xl w-full z-30">
          <div className="relative">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquise para iniciar uma nova leitura..."
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-primary/40 outline-none rounded-[1.5rem] md:rounded-[2rem] pl-12 pr-10 py-3.5 md:py-4 font-bold text-xs shadow-xl transition-all text-slate-900 dark:text-white"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Resultados de Pesquisa flutuante */}
          <AnimatePresence>
            {searchTerm.trim() !== '' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar p-3 space-y-1"
              >
                {searchedBooks.length > 0 ? (
                  searchedBooks.map(book => {
                    const isReading = book.status === BookStatus.Reading;
                    return (
                      <button
                        key={book.id}
                        onClick={() => {
                          setSelectedBookToStart(book);
                          setSearchTerm('');
                        }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{book.title}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider truncate">de {book.author}</p>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                          isReading 
                            ? 'bg-blue-50 dark:bg-blue-900/15 text-primary border-blue-100 dark:border-blue-800' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700'
                        }`}>
                          {isReading ? 'Lendo' : book.status}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic font-bold">
                    Nenhum livro encontrado na sua estante.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filtro de período */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-2 md:p-2.5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center p-1 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 w-full sm:w-auto overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => setDateFilter('thisYear')}
                    className={`whitespace-nowrap flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all ${dateFilter === 'thisYear' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
                >
                    Ano
                </button>
                <button
                    onClick={() => setDateFilter('specificYear')}
                    className={`whitespace-nowrap flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all ${dateFilter === 'specificYear' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
                >
                    Anos
                </button>
                <button
                    onClick={() => setDateFilter('allTime')}
                    className={`whitespace-nowrap flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all ${dateFilter === 'allTime' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
                >
                    Tudo
                </button>
            </div>

            {dateFilter === 'specificYear' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500 px-2 mt-1 sm:mt-0">
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300 outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10">
        {/* ROW 1: DESTAQUE E META */}
        <div className="lg:col-span-8">
          {currentlyReading ? (
            <CurrentlyReading book={currentlyReading} updateBook={updateBook} profile={profile} onOpenJournal={onOpenJournal} />
          ) : (
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 p-8 md:p-16 rounded-[2.5rem] flex flex-col items-center justify-center text-center h-full group transition-all hover:border-primary/20">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] mb-6 group-hover:scale-110 transition-transform duration-700">
                <BookOpenIcon className="h-12 w-12 text-slate-200 dark:text-slate-700" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 mb-3 font-serif italic">Nenhuma leitura ativa</h2>
              <p className="text-slate-400 dark:text-slate-500 max-w-sm text-sm md:text-base font-medium italic mb-8">Sua estante está cheia de aventuras esperando por você.</p>
              
              <button
                onClick={onRandomPick}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white hover:bg-tertiary transition-all rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95"
              >
                <SparklesIcon className="h-5 w-5" />
                Sortear Próxima Leitura
              </button>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-4">
          <ReadingGoal 
            current={booksReadThisYear} 
            goal={readingGoal} 
            onSetGoal={onSetReadingGoal} 
          />
        </div>

        {seriesGaps.length > 0 && (
            <div className="lg:col-span-12 animate-in slide-in-from-left duration-700">
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-amber-100 dark:bg-amber-900/40 p-4 rounded-2xl text-amber-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 font-serif italic">Volumes Faltantes Identificados!</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Você tem lacunas nas suas coleções de <span className="font-bold text-amber-600">{Array.from(new Set(seriesGaps.map(g => g.name))).join(', ')}</span>.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         {seriesGaps.map((gap, i) => (
                             <div key={i} className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center min-w-[100px]">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{gap.name}</span>
                                 <span className="text-sm font-black text-amber-500 italic">Vol. {gap.volume}</span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        )}

        <div className="lg:col-span-12">
          <ShelfProgress books={books} stats={stats} />
        </div>

        {/* ROW 2: KPI STATS - BREAKING INTO TWO ROWS FOR BETTER VISIBILITY */}
        <div className="lg:col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
              <StatCard 
                  icon={<BookOpenIcon className="h-7 w-7 md:h-8 md:w-8" />} 
                  title="Livros Concluídos"
                  value={stats.yearly.booksRead.toString()} 
                  subtitle={periodTitle}
              />
              <StatCard 
                  icon={<TagIcon className="h-7 w-7 md:h-8 md:w-8" />} 
                  title="Páginas Lidas"
                  value={stats.yearly.pagesRead.toLocaleString('pt-BR')}
                  subtitle={periodTitle}
              />
              <StatCard 
                  icon={<ChartBarIcon className="h-7 w-7 md:h-8 md:w-8" />} 
                  title="Velocidade" 
                  value={stats.avgPagesPerDay.toFixed(1)}
                  subtitle="Páginas/Dia"
                  description="Média de páginas lidas por dia considerando os livros finalizados no período."
              />
              <StatCard 
                  icon={<StarIcon className="h-7 w-7 md:h-8 md:w-8" />} 
                  title="Avaliação Média" 
                  value={stats.yearly.avgRating.toFixed(1)}
                  subtitle="Média"
                  description="Média das notas dadas aos livros concluídos no intervalo selecionado."
              />
              <StatCard 
                  icon={<HeartIcon className="h-7 w-7 md:h-8 md:w-8" />} 
                  title="Total Investido" 
                  value={`R$ ${stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  subtitle="Total"
                  description="Soma dos valores pagos pelos livros adquiridos no período."
              />
              <StatCard 
                  icon={<ChartBarIcon className="h-7 w-7 md:h-8 md:w-8" />} 
                  title="Consistência" 
                  value={`${stats.consistency.toFixed(0)}%`}
                  subtitle="Mensal"
                  description="Porcentagem de meses no ano com pelo menos um livro concluído."
              />
            </div>
        </div>

        {/* METAS & PROGRESSO MENSAL CHART (CURRENT YEAR VS READING GOAL) */}
        <div className="lg:col-span-12">
          <YearlyGoalChart books={books} readingGoal={readingGoal} />
        </div>

        {/* ROW 3: ANALYTICS BENTO BOARD */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Evolução de Leitura</h2>
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-2">✦ Performance Mensal: {periodTitle}</p>
                </div>
                <div className="flex gap-4 md:gap-8 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40"></div>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Livros</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/40"></div>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Páginas</span>
                    </div>
                </div>
            </div>
            <div className="h-[300px] md:h-[400px]">
              <MonthlyChart data={stats.monthly} />
            </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
            {/* AUTORES */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all h-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg md:text-xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Top Autores</h2>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-xl border border-amber-100 dark:border-amber-800/50">
                        <StarIcon className="h-4 w-4 text-amber-500" />
                    </div>
                </div>
                <div className="space-y-4">
                    {stats.byAuthor.length > 0 ? (
                        stats.byAuthor.map((author, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors border border-slate-100 dark:border-slate-800">
                                        {idx + 1}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{author.author}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{author.count}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">obras</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-4">Sem dados</p>
                    )}
                </div>
            </div>

            {/* STATUS MIX */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg md:text-xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Mix de Leitura</h2>
                    <div className="bg-primary/5 dark:bg-primary/10 p-2 rounded-xl border border-primary/20">
                        <ChartBarIcon className="h-4 w-4 text-primary" />
                    </div>
                </div>
                <div className="flex flex-row items-center justify-between gap-6 h-[120px]">
                    <div className="flex-1 h-full">
                        <StatusDistribution data={stats.byStatus} />
                    </div>
                    <div className="w-1/2 space-y-2">
                        {stats.byStatus.slice(0, 3).map((s, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-slate-400 truncate mr-2">{s.status}</span>
                                <span className="text-slate-900 dark:text-slate-200">{s.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* ROW 4: MEDIA & GENRES */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all flex flex-col min-h-[350px]">
          <h2 className="text-xl md:text-2xl font-black font-serif text-slate-900 dark:text-slate-50 mb-6 italic text-center">Tipos de Mídia</h2>
          <div className="flex-1 flex items-center justify-center">
              <TypePieChart data={stats.byType} />
          </div>
          <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center mt-6">Proporção Livros vs HQs</p>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-8">
              <div>
                  <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Gêneros Favoritos</h2>
                  <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1">✦ Seus temas mais explorados</p>
              </div>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
              <GenreBarChart data={stats.byGenre} />
          </div>
        </div>

        {/* SISTEMA DE CONQUISTAS (BADGES) */}
        <div className="lg:col-span-12 animate-in fade-in duration-700">
          <Achievements books={books} />
        </div>

        {/* CRONOGRAMA DE LEITURA */}
        <div className="lg:col-span-12 animate-in fade-in duration-700">
          <CronogramaLeitura books={books} />
        </div>

        {/* ROW 5: AI INSIGHTS */}
        <div className="lg:col-span-12">
          <AIInsightsPanel books={books} />
        </div>

        {/* ROW 6: ACTIVITY */}
        <div className="lg:col-span-12">
          <LatestReadings books={latestReadBooks} />
        </div>
      </div>

      <Recommendations 
        suggestions={aiRecs} 
        isLoading={isLoadingRecs} 
        onRefresh={fetchRecs} 
        onAddWishlist={handleAddRecommendation}
        existingBooks={books}
        quotaExceeded={quotaExceeded}
        demandExceeded={demandExceeded}
        error={aiError}
      />

      {/* Modalzinho para iniciar leitura */}
      <AnimatePresence>
        {selectedBookToStart && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBookToStart(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center text-center z-10"
            >
              <div className="bg-primary/10 dark:bg-primary/20 text-primary p-4 rounded-full mb-4">
                <BookOpenIcon className="h-8 w-8" />
              </div>
              
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-1">
                Iniciar Nova Leitura
              </h3>
              
              <h4 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-1 leading-tight font-serif italic mt-2">
                {selectedBookToStart.title}
              </h4>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-6">
                de {selectedBookToStart.author}
              </p>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium">
                Deseja marcar este livro como <strong className="text-primary font-black">"Lendo atualmente"</strong> e começar a registrar seu progresso a partir de hoje?
              </p>
              
              <div className="flex flex-col w-full gap-2">
                <button
                  onClick={() => handleStartReadingSearch(selectedBookToStart)}
                  disabled={isStartingReading}
                  className="w-full py-3.5 bg-primary text-white hover:bg-tertiary transition-all rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  {isStartingReading ? 'Iniciando...' : 'Começar a Ler Agora'}
                </button>
                <button
                  onClick={() => setSelectedBookToStart(null)}
                  disabled={isStartingReading}
                  className="w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
