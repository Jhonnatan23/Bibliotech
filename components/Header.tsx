import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  SunIcon, 
  MoonIcon, 
  LogoutIcon, 
  Cog6ToothIcon, 
  StarIcon, 
  BellIcon, 
  ChevronDownIcon, 
  UserIcon,
  CheckCircleIcon,
  CloudCheckIcon
} from './Icons';
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
  setView: (view: 'dashboard' | 'list' | 'wishlist' | 'stats' | 'search' | 'history' | 'loans' | 'series' | 'challenges' | 'community' | 'journal' | 'design-system') => void;
  onNotifClick?: () => void;
  unreadCount?: number;
  isOnline?: boolean;
  pendingCount?: number;
  isSyncing?: boolean;
  onSyncClick?: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({ 
  profile, 
  onLogoClick, 
  onSettingsClick, 
  theme, 
  toggleTheme, 
  isConnected = true,
  hasApiKey = true,
  setView,
  onNotifClick,
  unreadCount = 0,
  isOnline = true,
  pendingCount = 0,
  isSyncing = false,
  onSyncClick
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle keyboard accessibility (Escape to close)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isDropdownOpen) {
      setIsDropdownOpen(false);
      avatarButtonRef.current?.focus();
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isDropdownOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen, handleKeyDown]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await supabase.auth.signOut();
  };

  const handleKeyClick = async () => {
    setIsDropdownOpen(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    onSettingsClick();
  };

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    onSettingsClick();
  };

  const userInitial = profile?.fullName?.charAt(0).toUpperCase() || '?';
  const userName = profile?.fullName || 'Leitor BiblioTech';
  const userEmail = profile?.email || 'Conta de Leitor';

  return (
    <header className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800 sticky top-0 z-30 px-3.5 sm:px-6 py-2.5 sm:py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* ========================================================= */}
        {/* LEFT: BiblioTech Logo (Using Lora font for brand mark)    */}
        {/* ========================================================= */}
        <div 
          role="button"
          tabIndex={0}
          onClick={onLogoClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onLogoClick();
            }
          }}
          className="cursor-pointer group flex-shrink-0 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
          aria-label="BiblioTech - Ir para a página inicial"
          data-testid="header-logo-btn"
        >
          <Logo size="sm" showText={true} className="md:hidden" />
          <Logo size="md" showText={true} className="hidden md:flex" />
        </div>
        
        {/* ========================================================= */}
        {/* RIGHT: Exactly 3 Primary Action Elements                  */}
        {/* 1. Local-First Sync Status Indicator                      */}
        {/* 2. Notification Bell Icon Button                          */}
        {/* 3. User Avatar Button with Floating Dropdown Menu         */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 sm:gap-3" data-testid="header-right-actions">
          
          {/* 1. Local-First Sync Status Indicator (Humanized Reassuring Badge) */}
          <button
            type="button"
            onClick={onSyncClick}
            disabled={isSyncing}
            data-testid="sync-status-indicator"
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wider active:scale-95 min-h-[38px] sm:min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer ${
              isSyncing
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 cursor-wait'
                : pendingCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-sm'
                : !isOnline
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                : isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
            }`}
            title={
              isSyncing
                ? 'Sincronizando suas leituras e anotações com a nuvem...'
                : pendingCount > 0
                ? `${pendingCount} leitura(s) salvas no aparelho. Serão enviadas à nuvem automaticamente. Clique para tentar agora.`
                : !isOnline
                ? 'Modo Offline: Suas leituras estão salvas com segurança no seu aparelho.'
                : 'Sincronizado: Seu acervo e progresso estão salvos com segurança.'
            }
            aria-label={
              isSyncing
                ? 'Sincronizando leituras'
                : pendingCount > 0
                ? `${pendingCount} leituras aguardando nuvem (salvas no aparelho)`
                : !isOnline
                ? 'Modo Offline (leituras salvas no aparelho)'
                : 'Status da sincronização: Sincronizado'
            }
          >
            <div className="relative flex items-center justify-center flex-shrink-0">
              {isSyncing ? (
                <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : pendingCount > 0 ? (
                <div className="flex items-center justify-center text-amber-500">
                  <CloudCheckIcon className="h-4 w-4" />
                </div>
              ) : !isOnline ? (
                <div className="flex items-center justify-center text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                </div>
              ) : isConnected ? (
                <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircleIcon className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircleIcon className="h-4 w-4" />
                </div>
              )}
            </div>

            <span className="hidden xs:inline">
              {isSyncing
                ? 'Sincronizando...'
                : pendingCount > 0
                ? `Aguardando Nuvem (${pendingCount})`
                : !isOnline
                ? 'Modo Offline'
                : 'Sincronizado'}
            </span>

            {pendingCount > 0 && (
              <span className="xs:hidden text-[9px] font-black px-1.5 py-0.5 bg-amber-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          {/* 2. Notification Bell Icon Button */}
          <button 
            type="button"
            onClick={onNotifClick}
            data-testid="notification-btn"
            className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all active:scale-95 relative min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            title="Portal de Notificações"
            aria-label="Abrir Notificações"
          >
            <BellIcon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-105" />
            {unreadCount > 0 && (
              <span 
                data-testid="unread-notif-badge"
                className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse min-w-[18px] text-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* 3. User Avatar Button with Floating Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              ref={avatarButtonRef}
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              data-testid="user-avatar-btn"
              aria-haspopup="menu"
              aria-expanded={isDropdownOpen}
              aria-label="Menu do usuário"
              className={`flex items-center gap-1.5 sm:gap-2 p-1 pl-1 pr-1.5 sm:pr-2.5 rounded-full sm:rounded-2xl border transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 min-h-[38px] sm:min-h-[40px] ${
                isDropdownOpen 
                  ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/20' 
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Avatar Image / Initial */}
              <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-black text-xs sm:text-sm overflow-hidden flex-shrink-0 shadow-inner">
                {profile?.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    className="w-full h-full object-cover" 
                    alt={userName} 
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>

              {/* User Name (Medium & Large screens) */}
              <span className="hidden sm:inline-block text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px] lg:max-w-[130px] text-left">
                {userName.split(' ')[0]}
              </span>

              {/* Caret Arrow Icon */}
              <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {/* Floating Dropdown Menu */}
            {isDropdownOpen && (
              <div 
                role="menu"
                aria-label="Menu de opções do usuário"
                data-testid="user-dropdown-menu"
                className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900 dark:text-slate-100 backdrop-blur-xl"
              >
                {/* Menu Header: User Identity & Profile Link */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-1.5 border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-sm overflow-hidden flex-shrink-0 shadow-inner">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} className="w-full h-full object-cover" alt={userName} />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  {/* Profile Action Link */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleProfileClick}
                    data-testid="menu-profile-btn"
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Ver Meu Perfil & Metas</span>
                  </button>
                </div>

                {/* Dropdown Options Group */}
                <div className="py-1 space-y-0.5">
                  
                  {/* Theme Switcher */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleTheme}
                    data-testid="menu-theme-btn"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-amber-100 dark:group-hover:bg-amber-950/60 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {theme === 'light' ? (
                          <MoonIcon className="w-4 h-4" />
                        ) : (
                          <SunIcon className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="text-left">
                        <span className="block font-medium">Tema Visual</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {theme === 'light' ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {theme === 'light' ? 'Claro' : 'Escuro'}
                    </span>
                  </button>

                  {/* AI Key Configuration */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleKeyClick}
                    data-testid="menu-ai-key-btn"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        !hasApiKey 
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100'
                      }`}>
                        <StarIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block font-medium">Chave de IA</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Gemini & Recursos Inteligentes
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      hasApiKey
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 animate-pulse'
                    }`}>
                      {hasApiKey ? 'Ativa' : 'Configurar'}
                    </span>
                  </button>

                  {/* App Settings */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSettingsClick}
                    data-testid="menu-settings-btn"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">
                        <Cog6ToothIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block font-medium">Configurações</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          Preferências, backup e dados
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Divider */}
                <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                {/* Logout Button */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  data-testid="menu-logout-btn"
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                    <LogoutIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block">Sair da Conta</span>
                    <span className="text-[10px] text-rose-400 dark:text-rose-500 font-normal">
                      Encerrar sessão com segurança
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
