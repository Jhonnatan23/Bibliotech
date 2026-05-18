
import React, { useMemo, useState, useEffect } from 'react';
import type { ReadingStats, Book, DateFilter, Recommendation, NewBook } from '../types';
import { BookStatus, BookType } from '../types';
import { StatCard } from './StatCard';
import { CurrentlyReading } from './CurrentlyReading';
import { MonthlyChart } from './MonthlyChart';
import { TypePieChart } from './TypePieChart';
import { GenreBarChart } from './GenreBarChart';
import { StatusDistribution } from './StatusDistribution';
import { ReadingGoal } from './ReadingGoal';
import { Recommendations } from './Recommendations';
import { LatestReadings } from './LatestReadings';
import { ShelfProgress } from './ShelfProgress';
import { BookOpenIcon, ChartBarIcon, StarIcon, TagIcon, HeartIcon, SparklesIcon } from './Icons';
import { getAIRecommendations } from '../services/geminiService';

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
  onRandomPick
}) => {
  const [aiRecs, setAiRecs] = useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const fetchRecs = async () => {
    setIsLoadingRecs(true);
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
    } catch (err) {
      console.error("Erro ao carregar recomendações:", err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (aiRecs.length === 0) {
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
      status: BookStatus.Wishlist,
      type: BookType.Book,
      pages: 0,
      buyLink: rec.buyLink,
      summary: rec.reason,
      dateAdded: new Date().toISOString().split('T')[0],
      wasWishlist: true
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
            <h2 className="text-3xl md:text-5xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight italic">Painel de Controle</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] mt-1 md:mt-2 ml-1">✦ Sincronizado com sua biblioteca digital</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-2 md:p-2.5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl w-full sm:w-auto">
            <button
                onClick={onRandomPick}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20"
                title="Sortear próximo livro"
            >
                <SparklesIcon className="h-4 w-4" />
                Sortear Leitura
            </button>
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
            <CurrentlyReading book={currentlyReading} updateBook={updateBook} />
          ) : (
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 p-8 md:p-16 rounded-[2.5rem] flex flex-col items-center justify-center text-center h-full group transition-all hover:border-primary/20">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] mb-6 group-hover:scale-110 transition-transform duration-700">
                <BookOpenIcon className="h-12 w-12 text-slate-200 dark:text-slate-700" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 mb-3 font-serif italic">Nenhuma leitura ativa</h2>
              <p className="text-slate-400 dark:text-slate-500 max-w-sm text-sm md:text-base font-medium italic">Sua estante está cheia de aventuras esperando por você.</p>
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

        {/* ROW 3: ANALYTICS BENTO BOARD */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl">
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
            <div className="h-[300px] md:h-[350px]">
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
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all flex flex-col min-h-[350px]">
          <h2 className="text-xl md:text-2xl font-black font-serif text-slate-900 dark:text-slate-50 mb-8 italic text-center">Tipos de Mídia</h2>
          <div className="flex-1 flex items-center justify-center">
              <TypePieChart data={stats.byType} />
          </div>
          <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center mt-6">Proporção Livros vs HQs</p>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-8">
              <div>
                  <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Gêneros Favoritos</h2>
                  <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1">✦ Seus temas mais explorados</p>
              </div>
          </div>
          <div className="h-[250px] md:h-[300px]">
              <GenreBarChart data={stats.byGenre} />
          </div>
        </div>

        {/* ROW 5: ACTIVITY */}
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
      />
    </div>
  );
});
