import React from 'react';
import type { Book } from '../types';

interface SuggestionDropdownProps {
  suggestions: any[];
  show: boolean;
  onSelect: (val: any) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export const SuggestionDropdown: React.FC<SuggestionDropdownProps> = ({
  suggestions,
  show,
  onSelect,
  activeIndex,
  setActiveIndex
}) => {
  if (!show || suggestions.length === 0) return null;
  return (
    <div className="absolute left-0 right-0 top-full mt-2 z-[60] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {suggestions.map((suggestion, index) => {
        const isBook = typeof suggestion !== 'string';
        return (
          <button
            key={index}
            type="button"
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => onSelect(suggestion)}
            className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors ${
              activeIndex === index 
                ? 'bg-primary text-white' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {isBook ? (
              <div className="flex flex-col">
                <span>{(suggestion as Book).title}</span>
                <span className={`text-[9px] uppercase tracking-widest ${activeIndex === index ? 'text-white/60' : 'text-slate-400'}`}>
                  de {(suggestion as Book).author}
                </span>
              </div>
            ) : (
              suggestion
            )}
          </button>
        );
      })}
    </div>
  );
};
