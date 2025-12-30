
import React from 'react';
import { BookOpenIcon } from './Icons';

interface HeaderProps {
  view: 'dashboard' | 'list' | 'wishlist';
  setView: (view: 'dashboard' | 'list' | 'wishlist') => void;
}

export const Header: React.FC<HeaderProps> = ({ view, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'list', label: 'Estante' },
    { id: 'wishlist', label: 'Wishlist' },
  ] as const;

  const activeIndex = navItems.findIndex(item => item.id === view);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo Section */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setView('dashboard')}
        >
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform duration-500">
                <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-black font-serif text-slate-900 tracking-tight">
              Biblio<span className="text-primary">Tech</span>
            </h1>
        </div>

        {/* Navigation with Refined Aesthetic */}
        <nav className="relative flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner overflow-hidden min-w-[300px]">
            {/* Elevated Background Indicator */}
            <div 
              className="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-gradient-to-br from-primary to-blue-700 shadow-lg shadow-primary/30 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-0"
              style={{ 
                width: `calc((100% - 12px) / 3)`,
                transform: `translateX(calc(${activeIndex} * 100%))` 
              }}
            />

            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => setView(item.id)}
                className={`relative z-10 flex-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap active:scale-95 ${
                  view === item.id 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                {item.label}
              </button>
            ))}
        </nav>
      </div>
    </header>
  );
};
