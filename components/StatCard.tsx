
import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, description }) => {
  return (
    <div className="relative group bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex items-center space-x-5 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 cursor-default">
      {/* Tooltip customizado */}
      {description && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 bg-slate-900 text-white text-[10px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-48 text-center shadow-xl z-50">
          {description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
        </div>
      )}
      
      <div className="flex-shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900 leading-none mb-1">{value}</p>
        <p className="text-xs font-medium text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
};
