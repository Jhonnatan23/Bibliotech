
import React from 'react';
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
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, currentlyReading, updateBook, dateFilter, setDateFilter }) => {
  const periodTitle = dateFilter === 'thisYear' ? 'Ano Atual' : 'Histórico Completo';

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16">
      {/* --- Filtros --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">Visão Geral</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Acompanhe seus hábitos e progresso literário.</p>
        </div>
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
                onClick={() => setDateFilter('thisYear')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${dateFilter === 'thisYear' ? 'bg-primary text-white' : 'text-slate-500 hover:text-primary'}`}
            >
                Ano Atual
            </button>
            <button
                onClick={() => setDateFilter('allTime')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${dateFilter === 'allTime' ? 'bg-primary text-white' : 'text-slate-500 hover:text-primary'}`}
            >
                Todo o Período
            </button>
        </div>
      </div>

      {/* --- Seção Principal --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {currentlyReading ? (
            <CurrentlyReading book={currentlyReading} updateBook={updateBook} />
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-2xl flex flex-col items-center justify-center text-center h-full">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <BookOpenIcon className="h-10 w-10 text-slate-300" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhuma leitura ativa</h2>
              <p className="text-slate-400 max-w-xs">Sua estante está cheia de aventuras esperando por você. Comece uma nova hoje!</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-4 grid grid-cols-1 gap-6">
          <StatCard 
            icon={<BookOpenIcon className="h-6 w-6" />} 
            title="Livros Finalizados"
            value={stats.yearly.booksRead.toString()} 
            subtitle={periodTitle}
            description="Total de obras concluídas que você registrou no sistema durante este período."
          />
          <StatCard 
            icon={<TagIcon className="h-6 w-6" />} 
            title="Páginas Lidas"
            value={stats.yearly.pagesRead.toLocaleString('pt-BR')}
            subtitle={periodTitle}
            description="Soma total de páginas de todos os livros terminados por você."
          />
          <StatCard 
            icon={<StarIcon className="h-6 w-6" />} 
            title="Avaliação Média" 
            value={stats.yearly.avgRating.toFixed(1)}
            subtitle="estrelas"
            description="A média das notas que você atribuiu aos seus livros lidos (0 a 10)."
          />
        </div>
      </div>

      {/* --- Gráfico Destaque --- */}
      <div className="bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Evolução de Leitura</h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">Frequência mensal de livros concluídos e volume de páginas.</p>
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
        <div className="lg:col-span-8 bg-white p-8 rounded-2xl shadow-soft border border-slate-100">
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
            description="Livros que você já possui fisicamente ou digitalmente, mas ainda não começou a ler."
          />
          <StatCard 
            icon={<HeartIcon className="h-6 w-6" />} 
            title="Lista de Desejos" 
            value={stats.wishlistCount.toString()}
            subtitle="interesse futuro"
            description="Títulos que você deseja comprar ou ler algum dia, mas ainda não adquiriu."
          />
        </div>
      </div>
    </div>
  );
};
