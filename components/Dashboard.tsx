
import React, { useMemo } from 'react';
import type { ReadingStats, Book, DateFilter } from '../types';
import { StatCard } from './StatCard';
import { CurrentlyReading } from './CurrentlyReading';
import { MonthlyChart } from './MonthlyChart';
import { TypePieChart } from './TypePieChart';
import { BookOpenIcon, ChartBarIcon, StarIcon, TagIcon, HeartIcon } from './Icons';

interface DashboardProps {
  stats: ReadingStats;
  currentlyReading: Book | null;
  updateBook: (book: Book) => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  customRange?: { start: string; end: string };
  setCustomRange?: (range: { start: string; end: string }) => void;
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
  customRange,
  setCustomRange 
}) => {
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y.substring(2)}`;
  };

  const periodTitle = useMemo(() => {
    if (dateFilter === 'thisYear') return 'Ano Atual';
    if (dateFilter === 'allTime') return 'Todo o Período';
    if (dateFilter === 'specificYear') return `Ano de ${selectedYear}`;
    if (dateFilter === 'custom' && customRange) {
        return `De ${formatDate(customRange.start)} a ${formatDate(customRange.end)}`;
    }
    return '';
  }, [dateFilter, customRange, selectedYear]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16">
      {/* --- Cabeçalho e Filtros --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
            <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">Visão Geral</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Acompanhe seus hábitos e progresso literário.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <div className="flex items-center p-1 bg-slate-50 rounded-xl border border-slate-100">
                <button
                    onClick={() => setDateFilter('thisYear')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${dateFilter === 'thisYear' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                >
                    Ano
                </button>
                <button
                    onClick={() => setDateFilter('specificYear')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${dateFilter === 'specificYear' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                >
                    Anos
                </button>
                <button
                    onClick={() => setDateFilter('allTime')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${dateFilter === 'allTime' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                >
                    Tudo
                </button>
                <button
                    onClick={() => setDateFilter('custom')}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${dateFilter === 'custom' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                >
                    Agenda
                </button>
            </div>

            {dateFilter === 'specificYear' && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            )}

            {dateFilter === 'custom' && customRange && setCustomRange && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-0.5">Início</span>
                        <input 
                            type="date" 
                            value={customRange.start}
                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="w-2 h-px bg-slate-200 mt-4"></div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-0.5">Fim</span>
                        <input 
                            type="date" 
                            value={customRange.end}
                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* --- Seção Principal --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {currentlyReading ? (
            <CurrentlyReading book={currentlyReading} updateBook={updateBook} />
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center h-full">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <BookOpenIcon className="h-10 w-10 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhuma leitura ativa</h2>
              <p className="text-slate-400 max-w-xs">Sua estante está cheia de aventuras esperando por você.</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-4 grid grid-cols-1 gap-6">
          <StatCard 
            icon={<BookOpenIcon className="h-6 w-6" />} 
            title="Livros Finalizados"
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
            icon={<StarIcon className="h-6 w-6" />} 
            title="Avaliação Média" 
            value={stats.yearly.avgRating.toFixed(1)}
            subtitle="estrelas"
          />
        </div>
      </div>

      {/* --- Gráfico de Evolução --- */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-slate-100 transition-all hover:shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Evolução de Leitura</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium italic">Dados baseados no período: {periodTitle}</p>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Livros</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Páginas</span>
            </div>
          </div>
        </div>
        <MonthlyChart data={stats.monthly} />
      </div>
      
      {/* --- Estatísticas Secundárias --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-soft border border-slate-100">
            <h2 className="text-xl font-bold font-serif text-slate-900 mb-6">Distribuição por Categoria</h2>
            <div className="h-[300px]">
                <TypePieChart data={stats.byType} />
            </div>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-6">
          <StatCard 
            icon={<ChartBarIcon className="h-6 w-6" />} 
            title="Para Ler (TBR)" 
            value={stats.tbrCount.toString()}
            subtitle="livros na estante"
          />
          <StatCard 
            icon={<HeartIcon className="h-6 w-6" />} 
            title="Lista de Desejos" 
            value={stats.wishlistCount.toString()}
            subtitle="interesse futuro"
          />
        </div>
      </div>
    </div>
  );
};
