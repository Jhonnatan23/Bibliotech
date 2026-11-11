import React from 'react';
import { motion } from 'motion/react';

export type EmptyStateIllustration =
  | 'bookshelf'
  | 'search'
  | 'wishlist'
  | 'series'
  | 'stats'
  | 'reading'
  | 'filter';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  'data-testid'?: string;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: EmptyStateIllustration;
  customIcon?: React.ReactNode;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

const renderIllustration = (type: EmptyStateIllustration) => {
  switch (type) {
    case 'wishlist':
      return (
        <svg className="w-12 h-12 text-pink-500/80 dark:text-pink-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      );
    case 'series':
      return (
        <svg className="w-12 h-12 text-indigo-500/80 dark:text-indigo-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case 'stats':
      return (
        <svg className="w-12 h-12 text-amber-500/80 dark:text-amber-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      );
    case 'search':
    case 'filter':
      return (
        <svg className="w-12 h-12 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      );
    case 'reading':
      return (
        <svg className="w-12 h-12 text-emerald-500/80 dark:text-emerald-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case 'bookshelf':
    default:
      return (
        <svg className="w-12 h-12 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  illustration = 'bookshelf',
  customIcon,
  primaryAction,
  secondaryAction,
  className = '',
  compact = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      data-testid="empty-state-container"
      className={`relative text-center rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm flex flex-col items-center justify-center overflow-hidden transition-all ${
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-14 md:p-16 my-4'
      } ${className}`}
    >
      {/* Subtle Warm Background Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-amber-500/5 dark:bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Literary Themed Illustration Badge */}
      <div className="relative mb-5">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 shadow-inner flex items-center justify-center transition-transform duration-300 hover:scale-105">
          {customIcon || renderIllustration(illustration)}
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs shadow-xs" aria-hidden="true">
          📖
        </div>
      </div>

      {/* Clean, Friendly Literary Headings */}
      <h3 className="text-xl sm:text-2xl font-black font-serif italic text-slate-900 dark:text-slate-50 leading-snug max-w-md">
        {title}
      </h3>

      {/* Supportive Descriptive Text Encouraging Action */}
      <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-sm sm:max-w-md leading-relaxed">
        {description}
      </p>

      {/* Call-to-Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 sm:mt-8">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              data-testid={primaryAction['data-testid'] || 'empty-state-primary-action'}
              className="px-6 sm:px-7 py-3 rounded-xl bg-primary text-white hover:bg-slate-900 dark:hover:bg-slate-100 dark:hover:text-slate-900 font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              data-testid={secondaryAction['data-testid'] || 'empty-state-secondary-action'}
              className="px-5 sm:px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};
