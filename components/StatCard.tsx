
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
    <div className="relative group bg-white dark:bg-slate-900 p-5 md:p-7 rounded-[1.5rem] md:rounded-[2.5rem] shadow-soft border border-slate-100 dark:border-slate-800 flex items-center space-x-4 md:space-x-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 hover:border-primary/10 dark:hover:border-primary/30 cursor-default overflow-hidden">
      <div className="absolute -right-8 -bottom-8 w-24 md:w-32 h-24 md:h-32 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      {description && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-3 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 lg:group-hover:opacity-100 transition-all pointer-events-none whitespace-normal w-48 text-center shadow-2xl z-50 transform translate-y-2 group-hover:translate-y-0 hidden lg:block">
          {description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
        </div>
      )}
      
      <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 text-primary transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-inner">
        {icon}
      </div>
      <div className="relative z-10 flex-1 min-w-0">
        <p className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] md:tracking-[0.2em] mb-0.5 md:mb-1 truncate">{title}</p>
        <div className="flex items-baseline gap-1.5 md:gap-2">
            <p className="text-2xl md:text-4xl font-black text-slate-900 dark:text-slate-50 leading-none tracking-tighter">{value}</p>
            <p className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest truncate">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
