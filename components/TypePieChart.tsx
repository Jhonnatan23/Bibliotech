
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import type { TypeStat } from '../types';

interface TypePieChartProps {
  data: TypeStat[];
}

const COLORS = [
  '#3b82f6', // Azul vibrante
  '#f59e0b', // Âmbar
  '#10b981', // Esmeralda
  '#ec4899', // Rosa
  '#8b5cf6', // Violeta
  '#06b6d4', // Ciano
];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 12px ${fill}66)` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

export const TypePieChart: React.FC<TypePieChartProps> = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(-1);

    const chartData = data.map(item => ({
        name: item.type,
        value: item.count
    })).filter(item => item.value > 0);

    const totalBooks = chartData.reduce((acc, item) => acc + item.value, 0);

    const onPieEnter = (_: any, index: number) => {
      setActiveIndex(index);
    };

    const onPieLeave = () => {
      setActiveIndex(-1);
    };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none">{totalBooks}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-2">Livros</span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={85}
            outerRadius={110}
            paddingAngle={6}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="transition-all duration-500 cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
                if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percent = ((data.value / totalBooks) * 100).toFixed(0);
                    return (
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col items-center min-w-[120px]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{data.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-slate-900 dark:text-white">{data.value}</span>
                                <span className="text-[11px] font-black text-blue-500">({percent}%)</span>
                            </div>
                        </div>
                    );
                }
                return null;
            }}
          />
          <Legend 
              verticalAlign="middle" 
              align="right" 
              layout="vertical"
              iconType="circle"
              iconSize={8}
              formatter={(value, entry: any) => {
                  const item = chartData.find(d => d.name === value);
                  const percent = totalBooks > 0 ? ((item?.value || 0) / totalBooks * 100).toFixed(0) : 0;
                  return (
                      <div className="inline-flex items-center justify-between w-40 ml-3">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{value}</span>
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[11px] font-black text-slate-900 dark:text-slate-100">{item?.value}</span>
                            <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600">{percent}%</span>
                        </div>
                      </div>
                  );
              }}
              wrapperStyle={{ right: 0, paddingLeft: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
