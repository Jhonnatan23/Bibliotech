
import React, { useState, useRef, useEffect } from 'react';
import { BookOpenIcon, ChartBarIcon, HeartIcon, MagnifyingGlassIcon, Bars3Icon } from './Icons';

interface BottomNavProps {
  view: 'dashboard' | 'list' | 'wishlist' | 'stats' | 'search' | 'history' | 'loans' | 'series' | 'creative';
  setView: (view: 'dashboard' | 'list' | 'wishlist' | 'stats' | 'search' | 'history' | 'loans' | 'series' | 'creative') => void;
}

export const BottomNav: React.FC<BottomNavProps> = React.memo(({ view, setView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: <ChartBarIcon className="h-6 w-6" /> },
    { id: 'list', label: 'Estante', icon: <BookOpenIcon className="h-6 w-6" /> },
    { id: 'series', label: 'Séri.', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg> },
    { id: 'history', label: 'Hist.', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> },
    { id: 'search', label: 'Explor.', icon: <MagnifyingGlassIcon className="h-6 w-6" /> },
    { id: 'wishlist', label: 'Desej.', icon: <HeartIcon className="h-6 w-6" /> },
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

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16 relative ${
              isMenuOpen ? 'text-primary' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
            }`}
          >
            <div className={`transition-transform duration-300 ${isMenuOpen ? 'scale-110 -translate-y-1' : ''}`}>
              <Bars3Icon className="h-6 w-6" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-70'}`}>
              Mais
            </span>
          </button>

          {isMenuOpen && (
            <div className="absolute bottom-full right-0 mb-4 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 origin-bottom-right">
              <button
                onClick={() => {
                  setView('stats');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left ${
                  view === 'stats' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>
                Dados
              </button>
              <button
                onClick={() => {
                  setView('creative');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left ${
                  view === 'creative' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                Escritor
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
});
