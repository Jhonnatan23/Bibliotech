
import React from 'react';
import { SunIcon, MoonIcon, LogoutIcon, Cog6ToothIcon, StarIcon } from './Icons';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import type { Profile } from '../types';

interface HeaderProps {
  profile: Profile | null;
  onLogoClick: () => void;
  onSettingsClick: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isConnected?: boolean;
  hasApiKey?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({ 
  profile, 
  onLogoClick, 
  onSettingsClick, 
  theme, 
  toggleTheme, 
  isConnected = true,
  hasApiKey = true
}) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleKeyClick = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
    }
  };

  const userInitial = profile?.fullName?.charAt(0).toUpperCase() || '?';

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="cursor-pointer group flex-shrink-0" 
          onClick={onLogoClick}
        >
            <Logo size="sm" showText={true} className="md:hidden" />
            <Logo size="md" showText={true} className="hidden md:flex" />
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {isConnected ? 'Sincronizado' : 'Modo Local'}
            </span>
          </div>

          <button 
            onClick={handleKeyClick}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 flex items-center gap-2 group ${
              !hasApiKey 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 animate-pulse ring-2 ring-red-500/20 shadow-lg' 
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100'
            }`}
            title={!hasApiKey ? "IA Bloqueada: Selecione uma chave" : "Configurar IA"}
          >
            <StarIcon className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-12 ${!hasApiKey ? 'animate-spin-slow' : ''}`} />
            <span className="hidden lg:inline text-[9px] font-black uppercase tracking-widest">
              {hasApiKey ? 'IA Ativa' : 'Ativar IA'}
            </span>
          </button>

          <button 
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-tertiary dark:hover:text-tertiary transition-all active:scale-95"
          >
            {theme === 'light' ? <MoonIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <SunIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          <button 
            onClick={onSettingsClick}
            className="hidden sm:flex p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-tertiary dark:hover:text-tertiary transition-all active:scale-95"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>

          <button 
            onClick={handleLogout}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-95 group/logout"
          >
            <LogoutIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 border-l border-slate-100 dark:border-slate-800">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 truncate max-w-[80px] lg:max-w-[120px]">
                {profile?.fullName || 'Usuário'}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs sm:text-sm shadow-inner overflow-hidden">
               {userInitial}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});
