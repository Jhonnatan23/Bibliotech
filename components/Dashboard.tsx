
import React, { useMemo, useState, useEffect } from 'react';
import type { ReadingStats, Book, DateFilter, Recommendation } from '../types';
import { BookStatus } from '../types';
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
  updateBook: (book: Book) => void;
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
  onSetReadingGoal
}) => {
  const [aiRecs, setAiRecs] = useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const fetchRecs = async () => {
    setIsLoadingRecs(true);
    const readBooks = books
      .filter(b => b.status === BookStatus.Read)
      .map(b => ({ title: b.title, genre: b.genre }));
    
    if (readBooks.length > 0) {
      const recs = await getAIRecommendations(readBooks);
      setAiRecs(recs);
    }
    setIsLoadingRecs(false);
  };

  useEffect(() => {
    if (aiRecs.length === 0) {
        fetchRecs();
    }
  }, []);
  
  const formatDateForTitle = (dateStr?: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y.substring(2)}`;
  };

  const periodTitle = useMemo(() => {
    if (dateFilter === 'thisYear') return 'Ano Atual';
    if (dateFilter === 'allTime') return 'Todo o Período';
    if (dateFilter === 'specificYear') return `Ano de ${selectedYear}`;
    if (dateFilter === 'custom' && customRange) {
        return `De ${formatDateForTitle(customRange.start)} a ${formatDateForTitle(customRange.end)}`;
    }
    return '';
  }, [dateFilter, customRange, selectedYear]);

  const latestReadBooks = useMemo(() => {
    return books
      .filter(b => b.status === BookStatus.Read && b.dateFinished)
      .sort((a, b) => (b.dateFinished || '').localeCompare(a.dateFinished || ''))
      .slice(0, 5);
  }, [books]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-16">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
            <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-50 tracking-tight">Visão Geral</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Sua jornada intelectual em números e descobertas.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto">
            <div className="flex items-center p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <button
                    onClick={() => setDateFilter('thisYear')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${dateFilter === 'thisYear' ? 'bg-primary text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary'}`}
                >
                    Ano
                </button>
                <button
                    onClick={() => setDateFilter('specificYear')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${dateFilter === 'specificYear' ? 'bg-primary text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary'}`}
                >
                    Anos
                </button>
                <button
                    onClick={() => setDateFilter('allTime')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${dateFilter === 'allTime' ? 'bg-primary text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary'}`}
                >
                    Tudo
                </button>
                <button
                    onClick={() => setDateFilter('custom')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${dateFilter === 'custom' ? 'bg-primary text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary'}`}
                >
                    Agenda
                </button>
            </div>

            {dateFilter === 'specificYear' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {currentlyReading ? (
            <CurrentlyReading book={currentlyReading} updateBook={updateBook} />
          ) : (
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center h-full">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
                <BookOpenIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Nenhuma leitura ativa</h2>
              <p className="text-slate-400 dark:text-slate-500 max-w-xs">Sua estante está cheia de aventuras esperando por você.</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <ReadingGoal 
            current={stats.yearly.booksRead} 
            goal={readingGoal} 
            onSetGoal={onSetReadingGoal} 
          />
          <StatCard 
            icon={<StarIcon className="h-6 w-6" />} 
            title="Avaliação Média" 
            value={stats.yearly.avgRating.toFixed(1)}
            subtitle="estrelas"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            icon={<BookOpenIcon className="h-6 w-6" />} 
            title="Total Lidos"
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
            title="Na Fila (TBR)" 
            value={stats.tbrCount.toString()}
            subtitle="livros p/ ler"
        />
        <StatCard 
            icon={<HeartIcon className="h-6 w-6" />} 
            title="Lista de Desejos" 
            value={stats.wishlistCount.toString()}
            subtitle="interesse futuro"
        />
      </div>

      <LatestReadings books={latestReadBooks} />

      <Recommendations 
        suggestions={aiRecs} 
        isLoading={isLoadingRecs} 
        onRefresh={fetchRecs} 
      />

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-50">Evolução de Leitura</h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 font-medium italic">Dados baseados no período: {periodTitle}</p>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Livros</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:bg-slate-600"></div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Páginas</span>
            </div>
          </div>
        </div>
        <MonthlyChart data={stats.monthly} />
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-50 mb-6">Distribuição por Categoria</h2>
          <div className="h-[300px]">
              <TypePieChart data={stats.byType} />
          </div>
      </div>
    </div>
  );
};
