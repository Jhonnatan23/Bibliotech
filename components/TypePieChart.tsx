
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import type { TypeStat } from '../types';

interface TypePieChartProps {
  data: TypeStat[];
}

const COLORS = ['#2563eb', '#6366f1', '#8b5cf6', '#94a3b8'];

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
        className="transition-all duration-300"
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
      {/* Resumo Central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
          <p className="text-3xl font-black text-slate-900 leading-none">{totalBooks}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Livros</p>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={100}
            paddingAngle={8}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
                if (active && payload && payload.length) {
                    return (
                        <div className="bg-white px-3 py-2 rounded-xl shadow-xl border border-slate-100 text-xs font-bold text-slate-700">
                            {payload[0].name}: {payload[0].value} {payload[0].value === 1 ? 'livro' : 'livros'}
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
                  return (
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter ml-2">
                        {value} <span className="text-slate-300 ml-1">({item?.value})</span>
                      </span>
                  );
              }}
              wrapperStyle={{ right: 0, paddingLeft: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
