
import React from 'react';
import { BookOpenIcon } from './Icons';

interface HeaderProps {
  onLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={onLogoClick}
        >
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform duration-500">
                <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-black font-serif text-slate-900 tracking-tight">
              Biblio<span className="text-primary">Tech</span>
            </h1>
        </div>
        
        {/* Espaço reservado para ações rápidas futuras ou perfil */}
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </header>
  );
};
