
import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import type { StatusStat } from '../types';

interface StatusDistributionProps {
  data: StatusStat[];
}

const COLORS = {
  'Lido': '#10b981',
  'Lendo atualmente': '#05A0E6',
  'Não lido': '#274C68',
  'Abandonado': '#64748b',
  'Lista de Desejos': '#ec4899',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 flex flex-col items-center animate-in fade-in zoom-in duration-200">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{payload[0].name}</span>
          <span className="text-base font-black text-slate-900 dark:text-white">{payload[0].value} <span className="text-[10px] font-medium opacity-60">Livros</span></span>
      </div>
    );
  }
  return null;
};

export const StatusDistribution: React.FC<StatusDistributionProps> = ({ data }) => {
  const chartData = data.filter(d => d.count > 0);

  if (chartData.length === 0) return null;

  return (
    <div className="w-full h-full min-h-[100px] sm:min-h-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={45}
            paddingAngle={5}
            dataKey="count"
            nameKey="status"
            stroke="none"
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.status] || '#cbd5e1'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
