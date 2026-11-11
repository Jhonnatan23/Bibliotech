import React from 'react';
import { motion } from 'motion/react';
import { BookOpenIcon, ChartBarIcon, MagnifyingGlassIcon, UserIcon } from './Icons';

export type AppView = 
  | 'dashboard' 
  | 'list' 
  | 'wishlist' 
  | 'stats' 
  | 'search' 
  | 'history' 
  | 'loans' 
  | 'series' 
  | 'challenges' 
  | 'community' 
  | 'journal' 
  | 'design-system';

interface BottomNavProps {
  view: AppView;
  setView: (view: AppView) => void;
  onOpenSettings?: () => void;
}

interface NavDestination {
  id: 'dashboard' | 'list' | 'search' | 'profile';
  label: string;
  targetView: AppView;
  ariaLabel: string;
  isActive: (currentView: AppView) => boolean;
  renderIcon: (active: boolean) => React.ReactNode;
}

export const BottomNav: React.FC<BottomNavProps> = React.memo(({ view, setView }) => {
  // Consolidate down to exactly 4 primary destinations (Material Design 3 / iOS HIG standard)
  const destinations: NavDestination[] = [
    {
      id: 'dashboard',
      label: 'Início',
      targetView: 'dashboard',
      ariaLabel: 'Ir para Início (leituras em andamento, log diário e meta)',
      isActive: (currentView) => currentView === 'dashboard',
      renderIcon: (active) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.75}
          className="h-6 w-6 transition-transform duration-200"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      ),
    },
    {
      id: 'list',
      label: 'Estante',
      targetView: 'list',
      ariaLabel: 'Ir para Estante (biblioteca unificada, séries, desejos e histórico)',
      isActive: (currentView) => ['list', 'wishlist', 'series', 'history', 'loans'].includes(currentView),
      renderIcon: (active) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.75}
          className="h-6 w-6 transition-transform duration-200"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
    },
    {
      id: 'search',
      label: 'Explorar',
      targetView: 'search',
      ariaLabel: 'Ir para Explorar (busca global, scanner e recomendações)',
      isActive: (currentView) => currentView === 'search',
      renderIcon: (active) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={active ? 2.5 : 1.75}
          className="h-6 w-6 transition-transform duration-200"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Você',
      targetView: 'stats',
      ariaLabel: 'Ir para Você (comunidade, estatísticas, desafios e diário)',
      isActive: (currentView) => ['stats', 'community', 'challenges', 'journal', 'design-system'].includes(currentView),
      renderIcon: (active) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.75}
          className="h-6 w-6 transition-transform duration-200"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Navegação Principal"
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 z-40 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-md sm:max-w-lg mx-auto flex items-stretch justify-around px-2 h-18 sm:h-20">
        {destinations.map((item) => {
          const active = item.isActive(view);

          return (
            <button
              key={item.id}
              type="button"
              data-testid={`bottom-nav-${item.id}`}
              onClick={() => setView(item.targetView)}
              aria-label={item.ariaLabel}
              aria-selected={active}
              role="tab"
              className={`flex-1 flex flex-col items-center justify-center min-w-[48px] min-h-[48px] h-full py-1.5 px-1 relative select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl transition-all duration-200 group active:scale-95 ${
                active
                  ? 'text-primary dark:text-primary'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* MD3 Active Indicator Pill container with minimum touch target size */}
              <div className="relative flex items-center justify-center w-14 sm:w-16 h-8 sm:h-8.5 rounded-full">
                {active && (
                  <motion.div
                    layoutId="md3ActivePill"
                    className="absolute inset-0 bg-primary/12 dark:bg-primary/25 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div
                  className={`relative z-10 transition-transform duration-200 ${
                    active ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                >
                  {item.renderIcon(active)}
                </div>
              </div>

              {/* High-legibility full text label (Inter, no truncation) */}
              <span
                className={`text-[11px] sm:text-xs tracking-tight transition-all duration-200 mt-0.5 ${
                  active
                    ? 'font-black text-primary dark:text-primary scale-100'
                    : 'font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

export default BottomNav;
