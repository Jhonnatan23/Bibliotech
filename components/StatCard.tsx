
import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({ icon, title, value, subtitle, description }) => {
  return (
    <div className="relative group bg-white dark:bg-slate-900 p-6 sm:p-7 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] shadow-soft border border-slate-100 dark:border-slate-800 flex flex-row items-center gap-4 sm:gap-6 md:gap-7 lg:gap-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 hover:border-primary/10 dark:hover:border-primary/30 cursor-default overflow-hidden">
      <div className="absolute -right-8 -bottom-8 w-24 md:w-32 h-24 md:h-32 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      {description && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-3 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 lg:group-hover:opacity-100 transition-all pointer-events-none whitespace-normal w-48 text-center shadow-2xl z-50 transform translate-y-2 group-hover:translate-y-0 hidden lg:block">
          {description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
        </div>
      )}
      
      <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 md:p-6 lg:p-7 rounded-2xl md:rounded-[2rem] border border-slate-100 dark:border-slate-700 text-primary transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-inner">
        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      
      <div className="relative z-10 flex-1 min-w-0">
        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.25em] mb-1 sm:mb-2 truncate">
          {title}
        </p>
        <div className="flex flex-col items-start leading-none gap-0.5 md:gap-1">
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter truncate max-w-full font-serif italic">
            {value}
          </p>
          <p className="text-[7px] sm:text-[8px] md:text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest truncate">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
});
