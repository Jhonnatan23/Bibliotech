import React from 'react';
import { getLabelClass } from './add-book/utils';
import { SuggestionDropdown } from './SuggestionDropdown';
import { MagnifyingGlassIcon, XMarkIcon } from './Icons';
import type { Book } from '../types';

interface LinkedBooksSectionProps {
  linkSearch: string;
  setLinkSearch: (val: string) => void;
  showLinkSuggestions: boolean;
  setShowLinkSuggestions: (val: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent, type: 'title' | 'author' | 'link') => void;
  linkableBooks: Book[];
  activeSuggestionIndex: number;
  setActiveSuggestionIndex: (val: number) => void;
  toggleLinkedBook: (id: string) => void;
  linkedBookIds: string[];
  existingBooks: Book[];
  linkRef: React.RefObject<HTMLDivElement | null>;
}

export const LinkedBooksSection: React.FC<LinkedBooksSectionProps> = ({
  linkSearch,
  setLinkSearch,
  showLinkSuggestions,
  setShowLinkSuggestions,
  handleKeyDown,
  linkableBooks,
  activeSuggestionIndex,
  setActiveSuggestionIndex,
  toggleLinkedBook,
  linkedBookIds,
  existingBooks,
  linkRef
}) => {
  return (
    <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 relative" ref={linkRef}>
      <label className={getLabelClass(false)}>Vincular a Outras Obras</label>
      <div className="relative mb-3">
        <input 
          type="text" 
          placeholder="Pesquisar na sua estante..."
          value={linkSearch}
          onFocus={() => setShowLinkSuggestions(true)}
          onChange={(e) => { setLinkSearch(e.target.value); setShowLinkSuggestions(true); }}
          onKeyDown={(e) => handleKeyDown(e, 'link')}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 transition-all"
        />
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        
        <SuggestionDropdown 
          suggestions={linkableBooks} 
          show={showLinkSuggestions} 
          activeIndex={activeSuggestionIndex}
          setActiveIndex={setActiveSuggestionIndex}
          onSelect={(book) => toggleLinkedBook((book as Book).id)} 
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {linkedBookIds.map(id => {
          const linkedBook = existingBooks.find(b => b.id === id);
          if (!linkedBook) return null;
          return (
            <span key={id} className="bg-primary/5 dark:bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
              {linkedBook.title}
              <button type="button" onClick={() => toggleLinkedBook(id)} className="hover:text-red-500 transition-colors">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
};
