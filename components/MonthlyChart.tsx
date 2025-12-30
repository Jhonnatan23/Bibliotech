
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
  Area
} from 'recharts';
import type { MonthlyStat } from '../types';

interface MonthlyChartProps {
  data: MonthlyStat[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 rounded-2xl shadow-2xl ring-1 ring-black/5">
        <p className="font-bold text-slate-900 mb-3 text-sm border-b border-slate-100 pb-2">{label}</p>
        <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary shadow-sm"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Livros Lidos</span>
                </div>
                <span className="font-black text-primary text-sm">{payload[1]?.value || 0}</span>
            </div>
            <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total de Páginas</span>
                </div>
                <span className="font-bold text-slate-700 text-sm">{(payload[0]?.value || 0).toLocaleString('pt-BR')}</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  // Não filtramos mais os meses com 0 livros para mostrar a evolução real ao longo do ano
  const chartData = data.map(d => ({
      name: d.month.substring(0, 3),
      Livros: d.booksRead,
      Páginas: d.pagesRead,
  }));

  return (
    <div className="w-full h-[350px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLivros" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
            </linearGradient>
            <linearGradient id="colorPaginas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e2e8f0" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f8fafc" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
            dy={10}
          />
          
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
          />
          
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            axisLine={false} 
            tickLine={false}
            hide={true}
          />
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: '#f1f5f9', opacity: 0.4 }} 
          />
          
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />

          {/* Área de Páginas (Fundo) */}
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="Páginas"
            fill="url(#colorPaginas)"
            stroke="#cbd5e1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={2000}
          />

          {/* Barras de Livros (Destaque) */}
          <Bar 
            yAxisId="left" 
            dataKey="Livros" 
            fill="url(#colorLivros)" 
            radius={[4, 4, 0, 0]} 
            barSize={24}
            animationDuration={1500}
          />
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
