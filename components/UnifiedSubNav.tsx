import React from 'react';
import type { AppView } from './BottomNav';

interface SubNavProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  onOpenSettings?: () => void;
}

export const LibrarySubNav: React.FC<SubNavProps> = ({ currentView, setView }) => {
  const tabs = [
    { id: 'list' as const, label: 'Livros', icon: '📚' },
    { id: 'wishlist' as const, label: 'Desejos', icon: '💖' },
    { id: 'series' as const, label: 'Séries', icon: '📑' },
    { id: 'history' as const, label: 'Histórico', icon: '📜' },
    { id: 'loans' as const, label: 'Empréstimos', icon: '🤝' },
  ];

  return (
    <div className="mb-6 overflow-x-auto scrollbar-none pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-max sm:w-auto border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
        {tabs.map((tab) => {
          const active = currentView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 select-none cursor-pointer relative min-h-[40px] ${
                active
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const ProfileSubNav: React.FC<SubNavProps> = ({ currentView, setView, onOpenSettings }) => {
  const tabs = [
    { id: 'stats' as const, label: 'Estatísticas', icon: '📊' },
    { id: 'community' as const, label: 'Comunidade', icon: '👥' },
    { id: 'challenges' as const, label: 'Desafios', icon: '🏆' },
    { id: 'journal' as const, label: 'Diário', icon: '📝' },
    { id: 'design-system' as const, label: 'Design System', icon: '🎨' },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 overflow-x-auto scrollbar-none pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-max sm:w-auto border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
        {tabs.map((tab) => {
          const active = currentView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 select-none cursor-pointer relative min-h-[40px] ${
                active
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {onOpenSettings && (
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary transition-all shadow-sm active:scale-95 cursor-pointer ml-auto min-h-[40px]"
        >
          <span aria-hidden="true">⚙️</span>
          <span>Ajustes da Conta</span>
        </button>
      )}
    </div>
  );
};
