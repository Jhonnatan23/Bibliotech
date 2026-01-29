
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { GenreStat } from '../types';

interface GenreBarChartProps {
  data: GenreStat[];
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 flex flex-col items-center animate-in fade-in zoom-in duration-200">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{payload[0].payload.genre}</span>
          <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-white">{payload[0].value}</span>
              <span className="text-[10px] font-black text-primary uppercase">obras</span>
          </div>
      </div>
    );
  }
  return null;
};

export const GenreBarChart: React.FC<GenreBarChartProps> = ({ data }) => {
  if (data.length === 0) {
      return (
          <div className="h-full w-full flex items-center justify-center opacity-40">
              <p className="text-[10px] font-black uppercase tracking-widest">Sem dados de gênero</p>
          </div>
      );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="genre" 
            type="category" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Bar 
            dataKey="count" 
            radius={[0, 4, 4, 0]} 
            barSize={12}
            animationDuration={2000}
          >
            {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
