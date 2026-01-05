
import React, { useState } from 'react';
import { Recommendation, Book } from '../types';
import { ExternalLinkIcon, HeartIcon } from './Icons';

interface RecommendationsProps {
  suggestions: Recommendation[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddWishlist: (rec: Recommendation) => Promise<void>;
  existingBooks: Book[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ suggestions, isLoading, onRefresh, onAddWishlist, existingBooks }) => {
  const [localAddedTitles, setLocalAddedTitles] = useState<Set<string>>(new Set());
  const hasNoSuggestions = !isLoading && suggestions.length === 0;

  const isAlreadyInLibrary = (title: string) => {
    return existingBooks.some(b => b.title.toLowerCase() === title.toLowerCase()) || localAddedTitles.has(title.toLowerCase());
  };

  const handleAdd = async (rec: Recommendation) => {
    await onAddWishlist(rec);
    setLocalAddedTitles(prev => new Set(prev).add(rec.title.toLowerCase()));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-black font-serif text-slate-900 dark:text-slate-50 italic tracking-tight">
              Curadoria Digital
            </h2>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest ring-1 ring-primary/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              IA Intelligence
            </span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium italic">
            Sugestões personalizadas para expandir seus horizontes literários.
          </p>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-all disabled:opacity-30"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Consultando...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Atualizar Recomendações
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {isLoading ? (
            [1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-50 dark:bg-slate-800">
                        <div className="h-full bg-primary/20 w-1/3 animate-[shimmer_2s_infinite]"></div>
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-24"></div>
                    <div className="space-y-3">
                        <div className="h-6 bg-slate-50 dark:bg-slate-800 rounded-full w-full"></div>
                        <div className="h-6 bg-slate-50 dark:bg-slate-800 rounded-full w-2/3"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-2.5 bg-slate-50 dark:bg-slate-800 rounded-full w-full"></div>
                        <div className="h-2.5 bg-slate-50 dark:bg-slate-800 rounded-full w-full"></div>
                        <div className="h-2.5 bg-slate-50 dark:bg-slate-800 rounded-full w-3/4"></div>
                    </div>
                </div>
            ))
        ) : hasNoSuggestions ? (
            <div className="md:col-span-3 py-16 bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <p className="text-slate-400 font-bold italic">Não foi possível gerar recomendações agora. Tente novamente mais tarde.</p>
            </div>
        ) : (
            suggestions.map((rec, idx) => {
                const alreadyAdded = isAlreadyInLibrary(rec.title);
                return (
                    <div key={idx} className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-default relative overflow-hidden flex flex-col h-full">
                        {/* Background Detail */}
                        <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        
                        <div className="relative z-10 flex-1">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                    {rec.genre}
                                </span>
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 leading-tight mb-2 group-hover:text-primary transition-colors font-serif italic">
                                {rec.title}
                            </h3>
                            <p className="text-sm text-slate-400 dark:text-slate-500 font-bold mb-6 tracking-tight">de {rec.author}</p>
                            
                            <div className="relative">
                                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full"></div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic pl-2">
                                    "{rec.reason}"
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
                            {rec.buyLink && (
                                <a 
                                    href={rec.buyLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all shadow-xl active:scale-95"
                                >
                                    Adquirir Obra <ExternalLinkIcon className="h-4 w-4" />
                                </a>
                            )}
                            {alreadyAdded ? (
                                <div className="w-full py-3.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                                    Já na Lista
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleAdd(rec)}
                                    className="w-full py-3.5 bg-white dark:bg-slate-800 text-primary border border-primary/20 dark:border-slate-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-primary/5 transition-all active:scale-95"
                                >
                                    <HeartIcon className="h-4 w-4" />
                                    Salvar nos Desejos
                                </button>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
