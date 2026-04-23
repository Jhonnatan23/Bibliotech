
import React from 'react';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  Line
} from 'recharts';
import type { MonthlyStat } from '../types';

interface MonthlyChartProps {
  data: MonthlyStat[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl p-4 border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-300">
        <p className="font-black text-slate-900 dark:text-slate-100 mb-3 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 pb-2">{label}</p>
        <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(39,76,104,0.6)]"></div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Livros</span>
                </div>
                <span className="font-black text-primary dark:text-primary/80 text-sm">{payload.find((p: any) => p.dataKey === 'Livros')?.value || 0}</span>
            </div>
            <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(5,160,230,0.4)]"></div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Páginas</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{(payload.find((p: any) => p.dataKey === 'Páginas')?.value || 0).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]"></div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Avaliação</span>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{(payload.find((p: any) => p.dataKey === 'Avaliação')?.value || 0).toFixed(1)}</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const chartData = data.map(d => ({
      name: d.month.substring(0, 3).toUpperCase(),
      Livros: d.booksRead,
      Páginas: d.pagesRead,
      Avaliação: d.avgRating
  }));

  const hasData = chartData.some(d => d.Livros > 0 || d.Páginas > 0);

  if (!hasData) {
      return (
          <div className="w-full h-[380px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-400 font-bold italic text-sm uppercase tracking-widest">Sem atividades registradas neste período</p>
          </div>
      );
  }

  return (
    <div className="w-full h-[300px] sm:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLivros" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#274C68" stopOpacity={1}/>
              <stop offset="100%" stopColor="#274C68" stopOpacity={0.8}/>
            </linearGradient>
            <linearGradient id="colorPaginas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#05A0E6" stopOpacity={0.3}/>
              <stop offset="100%" stopColor="#05A0E6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} />
          
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }}
            dy={10}
            interval={0}
          />
          
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
            width={30}
          />
          
          <YAxis yAxisId="right" orientation="right" hide={true} />
          <YAxis yAxisId="rating" orientation="right" domain={[0, 10]} hide={true} />
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: '#f1f5f9', opacity: 0.5, radius: 10 }} 
          />
          
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ 
                paddingBottom: '10px', 
                fontSize: '9px', 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                letterSpacing: '0.15em',
                color: '#94a3b8'
            }}
          />

          <Area
            yAxisId="right"
            type="monotone"
            dataKey="Páginas"
            fill="url(#colorPaginas)"
            stroke="#05A0E6"
            strokeWidth={3}
            strokeOpacity={0.8}
            dot={{ r: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#05A0E6' }}
            animationDuration={2000}
          />

          <Bar 
            yAxisId="left" 
            dataKey="Livros" 
            fill="url(#colorLivros)" 
            radius={[6, 6, 0, 0]} 
            barSize={28}
            animationDuration={1500}
          />

          <Line
            yAxisId="rating"
            type="monotone"
            dataKey="Avaliação"
            stroke="#fbbf24"
            strokeWidth={3}
            dot={{ r: 3, fill: '#fbbf24', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#fbbf24' }}
            animationDuration={2500}
          />
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
