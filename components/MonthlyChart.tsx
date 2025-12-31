
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
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Livros</span>
                </div>
                <span className="font-black text-blue-600 dark:text-blue-400 text-sm">{payload[1]?.value || 0}</span>
            </div>
            <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 dark:bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Páginas</span>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{(payload[0]?.value || 0).toLocaleString('pt-BR')}</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const chartData = data.map(d => ({
      name: d.month.substring(0, 3),
      Livros: d.booksRead,
      Páginas: d.pagesRead,
  }));

  return (
    <div className="w-full h-[380px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLivros" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.9}/>
            </linearGradient>
            <linearGradient id="colorPaginas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} />
          
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}
            dy={15}
          />
          
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
          />
          
          <YAxis yAxisId="right" orientation="right" hide={true} />
          
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
                paddingBottom: '30px', 
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
            stroke="#6366f1"
            strokeWidth={3}
            strokeOpacity={0.8}
            dot={{ r: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#6366f1' }}
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
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
