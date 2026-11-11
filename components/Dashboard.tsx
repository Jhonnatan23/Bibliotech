
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
import { EmptyState } from './EmptyState';

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

  const [dashboardTab, setDashboardTab] = useState<'daily' | 'analytics'>('daily');

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-10 px-4 sm:px-6 lg:px-8">
      {/* Top Bar: Search and View Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Barra de Pesquisa Rápida */}
        <div className="relative flex-1 max-w-xl w-full z-30">
          <div className="relative">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquise para iniciar uma nova leitura..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-primary/50 outline-none rounded-2xl pl-12 pr-10 py-3 font-medium text-xs shadow-sm transition-all text-slate-900 dark:text-white"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1 cursor-pointer"
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
                className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1"
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
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{book.title}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider truncate">de {book.author}</p>
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
                  <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs italic font-medium">
                    Nenhum livro encontrado na sua estante.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dashboard Focus Switcher (Foco Diário vs Insights & Acervo) */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start md:self-auto shadow-xs">
          <button
            onClick={() => setDashboardTab('daily')}
            data-testid="tab-daily-focus"
            className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              dashboardTab === 'daily'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📖</span>
            <span>Foco Diário</span>
            {currentlyReading && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Leitura ativa" />
            )}
          </button>
          <button
            onClick={() => setDashboardTab('analytics')}
            data-testid="tab-analytics"
            className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              dashboardTab === 'analytics'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📊</span>
            <span>Insights & Acervo</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: FOCO DIÁRIO (Zero Clutter, Action-Oriented Reading Experience)
         ========================================================================= */}
      {dashboardTab === 'daily' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
            {/* Leitura Ativa */}
            <div className="lg:col-span-8">
              {currentlyReading ? (
                <CurrentlyReading book={currentlyReading} updateBook={updateBook} profile={profile} onOpenJournal={onOpenJournal} />
              ) : (
                <EmptyState
                  illustration="reading"
                  title="Nenhuma leitura ativa"
                  description="Sua estante possui obras esperando para serem lidas. Escolha um livro do acervo ou sorteie seu próximo título."
                  primaryAction={{
                    label: 'Sortear Próxima Leitura',
                    onClick: onRandomPick,
                    icon: <SparklesIcon className="h-4 w-4" />,
                    'data-testid': 'dashboard-empty-random-btn',
                  }}
                  secondaryAction={{
                    label: 'Buscar no Catálogo',
                    onClick: () => {
                      const input = document.querySelector('input[placeholder*="Pesquise para iniciar"]') as HTMLInputElement | null;
                      input?.focus();
                    },
                    icon: <MagnifyingGlassIcon className="h-4 w-4" />,
                  }}
                  className="h-full border-dashed"
                />
              )}
            </div>
            
            {/* Meta de Leitura Ativa e Acesso Rápido ao Diário */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <ReadingGoal 
                current={booksReadThisYear} 
                goal={readingGoal} 
                onSetGoal={onSetReadingGoal} 
              />

              {/* Card de Atalho para o Diário de Leitura */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rotina do Leitor</span>
                    <span className="text-xs">✍️</span>
                  </div>
                  <h4 className="text-base font-bold font-serif italic text-slate-900 dark:text-slate-100">
                    Diário & Reflexões
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Registre pensamentos, citações marcantes ou resenhas do dia para manter sua leitura reflexiva.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {books.filter(b => b.notes && b.notes.trim() !== '').length} livros com anotações
                  </span>
                  <button
                    onClick={() => onOpenJournal?.(currentlyReading?.id || '')}
                    className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Abrir Diário →
                  </button>
                </div>
              </div>
            </div>

            {/* Aviso de Volumes Faltantes (Quando aplicável) */}
            {seriesGaps.length > 0 && (
              <div className="lg:col-span-12">
                <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 p-5 md:p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-xl text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif italic">Lacunas na Coleção</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Faltam volumes para completar a série <strong className="text-amber-600 font-bold">{Array.from(new Set(seriesGaps.map(g => g.name))).join(', ')}</strong>.</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 flex-wrap">
                    {seriesGaps.map((gap, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-200/50 dark:border-amber-800/40 shadow-xs flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{gap.name}</span>
                        <span className="text-xs font-black text-amber-500">Vol. {gap.volume}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Progresso Geral da Estante */}
            <div className="lg:col-span-12">
              <ShelfProgress books={books} stats={stats} />
            </div>

            {/* Banner de Transição para Análise Completa */}
            <div className="lg:col-span-12 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <ChartBarIcon className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">Quer ver gráficos detalhados e histórico?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Analise seu ritmo de leitura, gêneros prediletos, badges e distribuição mensal.</p>
                </div>
              </div>
              <button
                onClick={() => setDashboardTab('analytics')}
                className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
              >
                Ver Insights & Acervo →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: INSIGHTS & ACERVO (Deep Analytics, Period Filter & Reports)
         ========================================================================= */}
      {dashboardTab === 'analytics' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
          {/* Header do Analytics com Seletor de Período */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-lg md:text-xl font-bold font-serif italic text-slate-900 dark:text-slate-100">
                Relatórios & Métricas Analíticas
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                ✦ Período Selecionado: {periodTitle}
              </p>
            </div>

            {/* Filtro de período */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
              <div className="flex items-center p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700">
                <button
                  onClick={() => setDateFilter('thisYear')}
                  className={`px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${dateFilter === 'thisYear' ? 'bg-primary text-white shadow-xs' : 'text-slate-400 hover:text-primary'}`}
                >
                  Ano
                </button>
                <button
                  onClick={() => setDateFilter('specificYear')}
                  className={`px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${dateFilter === 'specificYear' ? 'bg-primary text-white shadow-xs' : 'text-slate-400 hover:text-primary'}`}
                >
                  Anos
                </button>
                <button
                  onClick={() => setDateFilter('allTime')}
                  className={`px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${dateFilter === 'allTime' ? 'bg-primary text-white shadow-xs' : 'text-slate-400 hover:text-primary'}`}
                >
                  Tudo
                </button>
              </div>

              {dateFilter === 'specificYear' && (
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8">
            {/* KPI STATS ROW */}
            <div className="lg:col-span-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard 
                  icon={<BookOpenIcon className="h-6 w-6" />} 
                  title="Livros Concluídos"
                  value={stats.yearly.booksRead.toString()} 
                  subtitle={periodTitle}
                />
                <StatCard 
                  icon={<TagIcon className="h-6 w-6" />} 
                  title="Páginas Lidas"
                  value={stats.yearly.pagesRead.toLocaleString('pt-BR')}
                  subtitle={periodTitle}
                />
                <StatCard 
                  icon={<ChartBarIcon className="h-6 w-6" />} 
                  title="Velocidade" 
                  value={stats.avgPagesPerDay.toFixed(1)}
                  subtitle="Páginas/Dia"
                  description="Média de páginas lidas por dia considerando os livros finalizados no período."
                />
                <StatCard 
                  icon={<StarIcon className="h-6 w-6" />} 
                  title="Avaliação Média" 
                  value={stats.yearly.avgRating.toFixed(1)}
                  subtitle="Média"
                  description="Média das notas dadas aos livros concluídos no intervalo selecionado."
                />
                <StatCard 
                  icon={<HeartIcon className="h-6 w-6" />} 
                  title="Total Investido" 
                  value={`R$ ${stats.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  subtitle="Total"
                  description="Soma dos valores pagos pelos livros adquiridos no período."
                />
                <StatCard 
                  icon={<ChartBarIcon className="h-6 w-6" />} 
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

            {/* EVOLUÇÃO DE LEITURA (MONTHLY CHART) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Evolução de Leitura</h2>
                  <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">✦ Performance Mensal: {periodTitle}</p>
                </div>
                <div className="flex gap-4 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Livros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Páginas</span>
                  </div>
                </div>
              </div>
              <div className="h-[280px] md:h-[360px]">
                <MonthlyChart data={stats.monthly} />
              </div>
            </div>

            {/* TOP AUTORES & MIX DE STATUS */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* TOP AUTORES */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold font-serif text-slate-900 dark:text-slate-50 italic">Top Autores</h2>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-lg border border-amber-100 dark:border-amber-800/50">
                    <StarIcon className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.byAuthor.length > 0 ? (
                    stats.byAuthor.slice(0, 5).map((author, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-black text-slate-500 border border-slate-200/50 dark:border-slate-700">
                            {idx + 1}
                          </div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{author.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{author.count}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">obras</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center py-4">Sem dados</p>
                  )}
                </div>
              </div>

              {/* MIX DE STATUS */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold font-serif text-slate-900 dark:text-slate-50 italic">Mix de Leitura</h2>
                  <div className="bg-primary/5 dark:bg-primary/10 p-1.5 rounded-lg border border-primary/20">
                    <ChartBarIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                <div className="flex flex-row items-center justify-between gap-4 h-[110px]">
                  <div className="flex-1 h-full">
                    <StatusDistribution data={stats.byStatus} />
                  </div>
                  <div className="w-1/2 space-y-1.5">
                    {stats.byStatus.slice(0, 3).map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-slate-400 truncate mr-1">{s.status}</span>
                        <span className="text-slate-900 dark:text-slate-200">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TIPOS DE MÍDIA & GÊNEROS */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col min-h-[320px]">
              <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-50 mb-4 italic text-center">Tipos de Mídia</h2>
              <div className="flex-1 flex items-center justify-center">
                <TypePieChart data={stats.byType} />
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider text-center mt-4">Proporção Livros vs HQs</p>
            </div>

            <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Gêneros Favoritos</h2>
                  <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">✦ Seus temas mais explorados</p>
                </div>
              </div>
              <div className="h-[280px] md:h-[340px] w-full">
                <GenreBarChart data={stats.byGenre} />
              </div>
            </div>

            {/* SISTEMA DE CONQUISTAS (BADGES) */}
            <div className="lg:col-span-12">
              <Achievements books={books} />
            </div>

            {/* CRONOGRAMA DE LEITURA */}
            <div className="lg:col-span-12">
              <CronogramaLeitura books={books} />
            </div>

            {/* AI INSIGHTS */}
            <div className="lg:col-span-12">
              <AIInsightsPanel books={books} />
            </div>

            {/* LATEST ACTIVITY */}
            <div className="lg:col-span-12">
              <LatestReadings books={latestReadBooks} />
            </div>
          </div>
        </div>
      )}

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
