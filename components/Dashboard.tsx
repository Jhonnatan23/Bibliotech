
import React, { useMemo, useState, useEffect } from 'react';
import type { ReadingStats, Book, DateFilter, Recommendation, NewBook } from '../types';
import { BookStatus, BookType } from '../types';
import { StatCard } from './StatCard';
import { CurrentlyReading } from './CurrentlyReading';
import { MonthlyChart } from './MonthlyChart';
import { TypePieChart } from './TypePieChart';
import { ReadingGoal } from './ReadingGoal';
import { Recommendations } from './Recommendations';
import { LatestReadings } from './LatestReadings';
import { BookOpenIcon, ChartBarIcon, StarIcon, TagIcon, HeartIcon } from './Icons';
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
}

export const Dashboard: React.FC<DashboardProps> = ({ 
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
  addBook
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
    if (dateFilter === 'custom' && customRange) {
        return `Personalizado`;
    }
    return '';
  }, [dateFilter, customRange, selectedYear]);

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

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-16 pb-20 px-2 sm:px-0">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
            <h2 className="text-3xl md:text-4xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight italic">Painel de Controle</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] mt-1 md:mt-2 ml-1">✦ Sincronizado com sua biblioteca digital</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-1.5 md:p-2 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center p-1 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 w-full sm:w-auto">
                <button
                    onClick={() => setDateFilter('thisYear')}
                    className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all ${dateFilter === 'thisYear' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
                >
                    Ano
                </button>
                <button
                    onClick={() => setDateFilter('specificYear')}
                    className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all ${dateFilter === 'specificYear' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
                >
                    Anos
                </button>
                <button
                    onClick={() => setDateFilter('allTime')}
                    className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-xl transition-all ${dateFilter === 'allTime' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
                >
                    Tudo
                </button>
            </div>

            {dateFilter === 'specificYear' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500 px-2 mt-1 sm:mt-0">
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300 outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-8">
          {currentlyReading ? (
            <CurrentlyReading book={currentlyReading} updateBook={updateBook} />
          ) : (
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] flex flex-col items-center justify-center text-center h-full group">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-500">
                <BookOpenIcon className="h-10 w-10 md:h-12 md:w-12 text-slate-300 dark:text-slate-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-50 mb-2 md:mb-3 font-serif italic">Nenhuma leitura ativa</h2>
              <p className="text-slate-400 dark:text-slate-500 max-w-xs text-xs md:text-sm font-medium">Sua estante está cheia de aventuras esperando por você.</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
          <ReadingGoal 
            current={booksReadThisYear} 
            goal={readingGoal} 
            onSetGoal={onSetReadingGoal} 
          />
          <StatCard 
            icon={<StarIcon className="h-6 w-6 md:h-7 md:w-7" />} 
            title="Avaliação Média" 
            value={stats.global.avgRating.toFixed(1)}
            subtitle="Estrelas"
            description="Média vitalícia baseada em todas as suas avaliações registradas."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        <StatCard 
            icon={<BookOpenIcon className="h-6 w-6 md:h-7 md:w-7" />} 
            title="Total Lidos"
            value={stats.yearly.booksRead.toString()} 
            subtitle={periodTitle}
        />
        <StatCard 
            icon={<TagIcon className="h-6 w-6 md:h-7 md:w-7" />} 
            title="Páginas Lidas"
            value={stats.yearly.pagesRead.toLocaleString('pt-BR')}
            subtitle={periodTitle}
        />
        <StatCard 
            icon={<ChartBarIcon className="h-6 w-6 md:h-7 md:w-7" />} 
            title="Na Fila (TBR)" 
            value={stats.tbrCount.toString()}
            subtitle="Livros"
        />
        <StatCard 
            icon={<HeartIcon className="h-6 w-6 md:h-7 md:w-7" />} 
            title="Wishlist" 
            value={stats.wishlistCount.toString()}
            subtitle="Desejos"
        />
      </div>

      <LatestReadings books={latestReadBooks} />

      <Recommendations 
        suggestions={aiRecs} 
        isLoading={isLoadingRecs} 
        onRefresh={fetchRecs} 
        onAddWishlist={handleAddRecommendation}
        existingBooks={books}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-10">
        <div className="xl:col-span-8 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4 md:gap-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Evolução de Leitura</h2>
                <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1 md:mt-2">✦ Estatísticas Mensais: {periodTitle}</p>
            </div>
            <div className="flex gap-4 md:gap-8 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40"></div>
                    <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Livros</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/40"></div>
                    <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Páginas</span>
                </div>
            </div>
            </div>
            <MonthlyChart data={stats.monthly} />
        </div>
        
        <div className="xl:col-span-4 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-800 flex flex-col min-h-[400px] md:min-h-[500px] overflow-hidden">
            <h2 className="text-xl md:text-2xl font-black font-serif text-slate-900 dark:text-slate-50 mb-4 md:mb-8 italic text-center xl:text-left">Distribuição</h2>
            <div className="flex-1 flex items-center justify-center -mt-2 md:-mt-4">
                <TypePieChart data={stats.byType} />
            </div>
            <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center mt-4">✦ Análise baseada em toda sua estante</p>
        </div>
      </div>
    </div>
  );
};
