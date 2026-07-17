
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpenIcon, ChartBarIcon, HeartIcon, MagnifyingGlassIcon, Bars3Icon } from './Icons';

interface BottomNavProps {
  view: 'dashboard' | 'list' | 'wishlist' | 'stats' | 'search' | 'history' | 'loans' | 'series' | 'challenges' | 'community' | 'journal';
  setView: (view: 'dashboard' | 'list' | 'wishlist' | 'stats' | 'search' | 'history' | 'loans' | 'series' | 'challenges' | 'community' | 'journal') => void;
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
              className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16 relative cursor-pointer ${
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
                <motion.div 
                  layoutId="activeTabDot"
                  className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full shadow-sm shadow-primary/40"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-16 relative cursor-pointer ${
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

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="absolute bottom-full right-0 mb-4 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden origin-bottom-right"
              >
                <button
                  onClick={() => {
                    setView('journal');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left cursor-pointer ${
                    view === 'journal' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>📝</span> Diário de Leitura
                </button>

                <button
                  onClick={() => {
                    setView('community');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left border-t border-slate-100 dark:border-slate-800/60 cursor-pointer ${
                    view === 'community' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>👥</span> Comunidade
                </button>

                <button
                  onClick={() => {
                    setView('challenges');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left border-t border-slate-100 dark:border-slate-800/60 cursor-pointer ${
                    view === 'challenges' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-slate-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-5.25a1.125 1.125 0 0 0-1.125 1.125v3.375m9 0h-9M12 2.25v2.25m0 3h.008v.008H12V7.5Zm0 2.25h.008v.008H12V9.75Zm0 2.25h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm-6.75-3.375a3 3 0 0 0-3 3H3h2.25a3 3 0 0 0 3-3Zm11.25 3h2.25a3 3 0 0 0-3-3H16.5a3 3 0 0 0 3 3Z" />
                  </svg>
                  🏆 Desafios
                </button>

                <button
                  onClick={() => {
                    setView('stats');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors text-left border-t border-slate-100 dark:border-slate-800/60 cursor-pointer ${
                    view === 'stats' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2005/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>
                  Dados
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
});
