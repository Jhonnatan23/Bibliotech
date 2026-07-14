import React, { useMemo, useState } from 'react';
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { Book } from '../types';
import { BookStatus } from '../types';
import { 
  CalendarIcon, 
  BookOpenIcon, 
  StarIconFilled, 
  TagIcon 
} from './Icons';

interface CronogramaLeituraProps {
  books: Book[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.isStart) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3 border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-xl animate-in fade-in duration-300">
          <p className="font-black text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-widest">{data.bookTitle}</p>
          <p className="text-[9px] text-slate-500 font-medium mt-1">Início da jornada de leitura</p>
        </div>
      );
    }
    if (data.isEnd) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3 border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-xl animate-in fade-in duration-300">
          <p className="font-black text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-widest">{data.bookTitle}</p>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">
            Status atual: {data.cumulativeCount} livros read.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200 max-w-sm">
        <div className="border-b border-slate-100 dark:border-white/5 pb-2 mb-2">
          <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full">
            Concluído
          </span>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">{data.formattedDate}</p>
        </div>
        
        <p className="font-black text-slate-950 dark:text-white text-xs leading-snug line-clamp-2">{data.bookTitle}</p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 italic">de {data.bookAuthor}</p>
        
        <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px]">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Posição Acumulada</span>
            <span className="font-black text-slate-800 dark:text-slate-200">#{data.cumulativeCount} {data.cumulativeCount === 1 ? 'Livro' : 'Livros'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Páginas Acumuladas</span>
            <span className="font-black text-slate-800 dark:text-slate-200">{data.cumulativePages.toLocaleString('pt-BR')} págs</span>
          </div>
          {data.rating !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Avaliação</span>
              <div className="flex items-center gap-0.5">
                <StarIconFilled className="h-3 w-3 text-amber-400" />
                <span className="font-black text-slate-800 dark:text-slate-200">{data.rating}/10</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const CronogramaLeitura: React.FC<CronogramaLeituraProps> = ({ books }) => {
  const [metric, setMetric] = useState<'books' | 'pages'>('books');
  const currentYear = new Date().getFullYear();

  // Filter books read in the current year
  const completedBooksThisYear = useMemo(() => {
    return books
      .filter(b => {
        if (b.status !== BookStatus.Read || !b.dateFinished) return false;
        try {
          const year = new Date(b.dateFinished + 'T12:00:00').getFullYear();
          return year === currentYear;
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => (a.dateFinished || '').localeCompare(b.dateFinished || ''));
  }, [books, currentYear]);

  // Transform data for line/area chart progression
  const chartData = useMemo(() => {
    if (completedBooksThisYear.length === 0) return [];

    const points = [];
    
    // Starting coordinate (Jan 1st)
    points.push({
      dateStr: `${currentYear}-01-01`,
      formattedDate: '01 Jan',
      cumulativeCount: 0,
      cumulativePages: 0,
      bookTitle: 'Início do Ano',
      isStart: true
    });

    let countSum = 0;
    let pageSum = 0;

    completedBooksThisYear.forEach((book) => {
      countSum += 1;
      pageSum += book.pages || 0;

      let formattedDate = book.dateFinished || '';
      try {
        const d = new Date(book.dateFinished + 'T12:00:00');
        formattedDate = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      } catch (err) {
        // Fallback
      }

      points.push({
        dateStr: book.dateFinished,
        formattedDate,
        cumulativeCount: countSum,
        cumulativePages: pageSum,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookPages: book.pages,
        rating: book.rating,
        id: book.id,
        isStart: false
      });
    });

    // Make it end at today's plateau
    const today = new Date().toISOString().split('T')[0];
    let formattedToday = 'Hoje';
    try {
      formattedToday = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    } catch (_) {}

    points.push({
      dateStr: today,
      formattedDate: formattedToday,
      cumulativeCount: countSum,
      cumulativePages: pageSum,
      bookTitle: 'Status Atual',
      isEnd: true
    });

    return points;
  }, [completedBooksThisYear, currentYear]);

  if (completedBooksThisYear.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-slate-100 dark:border-slate-800 transition-all">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Cronograma de Leitura</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1">✦ Linha do Tempo de Conclusões em {currentYear}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400">
            <CalendarIcon className="h-6 w-6" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] p-12 text-center">
          <BookOpenIcon className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-4 animate-bounce duration-1000" />
          <h3 className="text-lg font-black font-serif text-slate-800 dark:text-slate-200 italic mb-2">Nenhuma aventura concluída</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs font-medium">
            Seu cronograma está vazio. Quando você mudar o status de um livro para <span className="font-bold text-emerald-500">Lido</span> e preencher a data de conclusão, ele aparecerá aqui com elegância!
          </p>
        </div>
      </div>
    );
  }

  const latestBook = completedBooksThisYear[completedBooksThisYear.length - 1];
  const pagesTotal = completedBooksThisYear.reduce((acc, curr) => acc + (curr.pages || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Cronograma de Leitura</h2>
          <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1">✦ Evolução Histórica das Conclusões em {currentYear}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 self-start lg:self-auto">
          <button
            onClick={() => setMetric('books')}
            className={`px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${metric === 'books' ? 'bg-primary text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
          >
            Nº de Livros
          </button>
          <button
            onClick={() => setMetric('pages')}
            className={`px-4 py-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${metric === 'pages' ? 'bg-primary text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
          >
            Total de Páginas
          </button>
        </div>
      </div>

      {/* Bento Layout Grid for Chart + Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left pane: The Recharts Progression Area */}
        <div className="xl:col-span-8 space-y-6">
          <div className="h-[280px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="progressionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#274C68" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#274C68" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="#e2e8f0" 
                  strokeOpacity={0.15} 
                />
                <XAxis 
                  dataKey="formattedDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                  width={35}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: '#05A0E6', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey={metric === 'books' ? 'cumulativeCount' : 'cumulativePages'}
                  stroke="#274C68"
                  strokeWidth={3}
                  fill="url(#progressionGradient)"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.isStart || payload.isEnd) {
                      return <circle key={payload.formattedDate} cx={cx} cy={cy} r={3} fill="#94a3b8" stroke="none" />;
                    }
                    return (
                      <circle 
                        key={payload.id} 
                        cx={cx} 
                        cy={cy} 
                        r={5} 
                        fill="#05A0E6" 
                        stroke="#fff" 
                        strokeWidth={2} 
                        style={{ cursor: 'pointer', filter: 'drop-shadow(0px 2px 4px rgba(5,160,230,0.4))' }}
                      />
                    );
                  }}
                  activeDot={{ r: 7, strokeWidth: 3, stroke: '#fff', fill: '#274C68' }}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sparkline micro KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Livros Concluídos</span>
              <span className="text-xl font-black font-serif italic text-slate-900 dark:text-white">
                {completedBooksThisYear.length} <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-400">Obras</span>
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Páginas Consumidas</span>
              <span className="text-xl font-black font-serif italic text-slate-900 dark:text-white">
                {pagesTotal.toLocaleString('pt-BR')} <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-400">Págs</span>
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Última Finalização</span>
              <span className="text-xl font-black font-serif italic text-slate-900 dark:text-white truncate max-w-full block" title={latestBook.title}>
                {latestBook.title}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Ritmo de Conclusão</span>
              <span className="text-xl font-black font-serif italic text-slate-900 dark:text-white">
                ~{(completedBooksThisYear.length > 0 ? (365 / Math.max(1, completedBooksThisYear.length)).toFixed(0) : '0')} <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-400">Dias/Livro</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right pane: Chronological Vertical Timeline scroll feed */}
        <div className="xl:col-span-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 p-5 rounded-[2rem] flex flex-col max-h-[440px]">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span>Diário de Bordo</span>
            <span className="bg-primary/10 text-primary text-[8px] font-black text-center px-2 py-0.5 rounded-full">{completedBooksThisYear.length} livros</span>
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
            {completedBooksThisYear.slice().reverse().map((b, index) => {
              let displayDate = '';
              try {
                if (b.dateFinished) {
                  const d = new Date(b.dateFinished + 'T12:00:00');
                  displayDate = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
                }
              } catch (_) {}

              return (
                <div key={b.id} className="relative pl-6 pb-2 group last:pb-0">
                  {/* Vertical rule of timeline */}
                  <div className="absolute left-1.5 top-1.5 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-850 group-last:hidden"></div>
                  
                  {/* Marker dot */}
                  <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-white dark:bg-slate-900 border-2 border-primary rounded-full group-hover:bg-primary transition-all shadow-[0_0_8px_rgba(39,76,104,0.3)]"></div>

                  {/* Content Card */}
                  <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{displayDate}</span>
                      <div className="flex items-center gap-0.5">
                        <StarIconFilled className="h-2.5 w-2.5 text-amber-400" />
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{b.rating || '-'}</span>
                      </div>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-50 leading-tight line-clamp-1 group-hover:text-primary transition-colors">{b.title}</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{b.author}</span>
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/50 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <TagIcon className="h-3 w-3" />
                        {b.pages || 0} págs
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-800 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md text-slate-500 dark:text-slate-400">
                        {b.type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
