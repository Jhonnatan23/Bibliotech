import React from 'react';
import { getLabelClass } from './add-book/utils';

interface IsbnLookupSectionProps {
  isbn: string;
  setIsbn: (val: string) => void;
  isIsbnLoading: boolean;
  handleIsbnLookup: () => void;
}

export const IsbnLookupSection: React.FC<IsbnLookupSectionProps> = ({
  isbn,
  setIsbn,
  isIsbnLoading,
  handleIsbnLookup
}) => {
  return (
    <div className="md:col-span-2">
      <label className={getLabelClass(false)}>
        Buscar por Código ISBN
        <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black text-[8px] uppercase tracking-widest">
          Em breve
        </span>
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            value={isbn} 
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="Ex: 9788535914849"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleIsbnLookup())}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 transition-all focus:ring-4 focus:ring-primary/5" 
          />
          {isIsbnLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <button 
          type="button"
          onClick={handleIsbnLookup}
          disabled={isIsbnLoading || !isbn.trim()}
          className="px-6 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap shadow-md"
        >
          Carregar Dados
        </button>
      </div>
      <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-tight ml-1 animate-pulse">✦ Preencha automaticamente o título, autor, páginas e resumo via ISBN.</p>
    </div>
  );
};
