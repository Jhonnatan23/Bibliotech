
import React from 'react';
import { BookOpenIcon, SunIcon, MoonIcon, LogoutIcon, Cog6ToothIcon, StarIcon } from './Icons';
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

export const Header: React.FC<HeaderProps> = ({ 
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
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={onLogoClick}
        >
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform duration-500">
                <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight">
              Biblio<span className="text-primary">Tech</span>
            </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {isConnected ? 'Sincronizado' : 'Modo Local'}
            </span>
          </div>

          {/* Botão de Chave de API - Destaque se estiver faltando */}
          <button 
            onClick={handleKeyClick}
            className={`p-2.5 rounded-xl border transition-all active:scale-95 flex items-center gap-2 group ${
              !hasApiKey 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 animate-pulse ring-2 ring-red-500/20' 
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100'
            }`}
            title={!hasApiKey ? "CONFIGURAR CHAVE OBRIGATÓRIA" : "Configurar Chave Gemini"}
          >
            <StarIcon className={`h-5 w-5 group-hover:rotate-12 transition-transform ${!hasApiKey ? 'animate-spin-slow' : ''}`} />
            <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">
              {hasApiKey ? 'IA Key' : 'Fix IA Key'}
            </span>
          </button>

          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all active:scale-95"
            title="Mudar Tema"
          >
            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </button>

          <button 
            onClick={onSettingsClick}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all active:scale-95"
            title="Configurações"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>

          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-95 group/logout"
            title="Sair da Conta"
          >
            <LogoutIcon className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-slate-100 dark:border-slate-800">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {profile?.fullName || 'Usuário'}
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Membro BiblioTech</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shadow-inner overflow-hidden">
               {userInitial}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
