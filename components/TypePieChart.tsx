
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import type { TypeStat } from '../types';

interface TypePieChartProps {
  data: TypeStat[];
}

const COLORS = [
  '#2563eb', // Azul BiblioTech
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
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 8px ${fill}44)` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
        opacity={0.2}
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
    <div className="w-full h-full relative flex flex-col items-center">
      {/* Central Label Overlay - Adjusted for better centering */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10 flex flex-col items-center justify-center">
          <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none font-serif italic">{totalBooks}</span>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mt-1">Acervo</span>
      </div>

      <div className="w-full h-[320px] md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={75}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                stroke="none"
            >
                {chartData.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="transition-all duration-500 cursor-pointer outline-none"
                />
                ))}
            </Pie>
            <Tooltip 
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percent = ((data.value / totalBooks) * 100).toFixed(0);
                        return (
                            <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col items-center min-w-[110px] animate-in fade-in zoom-in duration-200">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{data.name}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{data.value}</span>
                                    <span className="text-[10px] font-black text-primary">({percent}%)</span>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
            />
            <Legend 
                verticalAlign="bottom" 
                align="center" 
                layout="horizontal"
                iconType="circle"
                iconSize={8}
                formatter={(value, entry: any) => {
                    const item = chartData.find(d => d.name === value);
                    return (
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2">
                            {value} <span className="text-slate-900 dark:text-slate-100 ml-1">{item?.value}</span>
                        </span>
                    );
                }}
                wrapperStyle={{ paddingTop: '20px' }}
            />
            </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
