import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
} from 'recharts';
import { Book, BookStatus } from '../types';
import { StarIcon, SparklesIcon } from './Icons';

interface YearlyGoalChartProps {
  books: Book[];
  readingGoal: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const concluídos = payload.find((p: any) => p.dataKey === 'Concluídos')?.value || 0;
    const meta = payload.find((p: any) => p.dataKey === 'Meta Mensal')?.value || 0;
    const diff = concluídos - meta;
    
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 border border-slate-200/50 dark:border-slate-800 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-200">
        <p className="font-black text-slate-900 dark:text-slate-100 mb-2.5 text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1.5">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Concluídos</span>
            </div>
            <span className="font-black text-slate-900 dark:text-white text-xs">{concluídos} {concluídos === 1 ? 'livro' : 'livros'}</span>
          </div>
          <div className="flex items-center justify-between gap-6 border-t border-slate-50 dark:border-slate-800/50 pt-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meta Proporcional</span>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{meta.toFixed(1)} {meta === 1 ? 'livro' : 'livros'}</span>
          </div>
          
          <div className="text-[9px] font-black uppercase tracking-wider mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
            {diff >= 0 ? (
              <span className="text-emerald-500">🏆 Meta Batida no Mês! (+{diff.toFixed(1)})</span>
            ) : (
              <span className="text-amber-500">⏳ Falta {Math.abs(diff).toFixed(1)} p/ ritmo</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const YearlyGoalChart: React.FC<YearlyGoalChartProps> = ({ books, readingGoal }) => {
  const currentYear = new Date().getFullYear();
  const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const chartData = useMemo(() => {
    const monthlyCounts = Array(12).fill(0);
    
    // Contabiliza apenas livros lidos finalizados no ano atual
    books.forEach(book => {
      if (book.status === BookStatus.Read && book.dateFinished) {
        const date = new Date(book.dateFinished);
        if (date.getFullYear() === currentYear) {
          const monthIndex = date.getMonth();
          if (monthIndex >= 0 && monthIndex < 12) {
            monthlyCounts[monthIndex]++;
          }
        }
      }
    });

    const monthlyTarget = readingGoal > 0 ? readingGoal / 12 : 0;

    return MONTHS_SHORT.map((month, idx) => ({
      name: month,
      'Concluídos': monthlyCounts[idx],
      'Meta Mensal': monthlyTarget
    }));
  }, [books, readingGoal, currentYear]);

  const totalFinishedThisYear = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr['Concluídos'], 0);
  }, [chartData]);

  const goalPercentage = readingGoal > 0 ? Math.min(Math.round((totalFinishedThisYear / readingGoal) * 100), 100) : 0;
  const isGoalMet = totalFinishedThisYear >= readingGoal && readingGoal > 0;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-900 dark:text-slate-50 italic flex items-center gap-2">
            Metas & Progresso Mensal
            {isGoalMet && <SparklesIcon className="h-6 w-6 text-amber-500 animate-pulse" />}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            ✦ Acompanhamento dos livros concluídos em {currentYear} vs meta anual
          </p>
        </div>

        {/* Resumo rápido */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 w-full lg:w-auto">
          <div className="flex-1 min-w-[80px] text-center lg:text-left">
            <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Lido no Ano</span>
            <span className="text-lg font-black text-slate-950 dark:text-slate-100">{totalFinishedThisYear}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div className="flex-1 min-w-[80px] text-center lg:text-left">
            <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Meta Anual</span>
            <span className="text-lg font-black text-primary">{readingGoal}</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div className="flex-1 min-w-[80px] text-center lg:text-left">
            <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Progresso</span>
            <span className={`text-lg font-black ${isGoalMet ? 'text-emerald-500' : 'text-amber-500'}`}>{goalPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[300px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorConcluidos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#274C68" stopOpacity={1}/>
                <stop offset="100%" stopColor="#274C68" stopOpacity={0.7}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.25} />

            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
              dy={10}
            />

            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              allowDecimals={false}
              width={35}
            />

            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: '#f1f5f9', opacity: 0.4, radius: 12 }} 
            />

            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ 
                paddingBottom: '20px', 
                fontSize: '10px', 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                letterSpacing: '0.15em',
              }}
            />

            <Bar 
              dataKey="Concluídos" 
              fill="url(#colorConcluidos)" 
              radius={[8, 8, 0, 0]} 
              barSize={24}
              animationDuration={1500}
            />

            {readingGoal > 0 && (
              <Line
                type="monotone"
                dataKey="Meta Mensal"
                stroke="#fbbf24"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
                animationDuration={2000}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
