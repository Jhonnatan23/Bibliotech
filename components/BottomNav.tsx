
import React from 'react';
import { BookOpenIcon, ChartBarIcon, HeartIcon, MagnifyingGlassIcon } from './Icons';

interface BottomNavProps {
  view: 'dashboard' | 'list' | 'wishlist' | 'stats' | 'search' | 'history' | 'loans';
  setView: (view: 'dashboard' | 'list' | 'wishlist' | 'stats' | 'search' | 'history' | 'loans') => void;
}

export const BottomNav: React.FC<BottomNavProps> = React.memo(({ view, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Início', icon: <ChartBarIcon className="h-6 w-6" /> },
    { id: 'list', label: 'Estante', icon: <BookOpenIcon className="h-6 w-6" /> },
    { id: 'loans', label: 'Emprést.', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg> },
    { id: 'history', label: 'Histórico', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> },
    { id: 'search', label: 'Explorar', icon: <MagnifyingGlassIcon className="h-6 w-6" /> },
    { id: 'stats', label: 'Dados', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg> },
    { id: 'wishlist', label: 'Desejos', icon: <HeartIcon className="h-6 w-6" /> },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800 z-40 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      <div className="max-w-xl mx-auto flex justify-around items-center px-2 h-20">
        {navItems.map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16 relative ${
                isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
              }`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full shadow-sm shadow-primary/40" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});
