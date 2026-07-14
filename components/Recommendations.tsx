
import React, { useState } from 'react';
import { Recommendation, Book } from '../types';
import { ExternalLinkIcon, HeartIcon, BookOpenIcon, PlusIcon } from './Icons';

interface RecommendationsProps {
  suggestions: Recommendation[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddWishlist: (rec: Recommendation) => Promise<void>;
  existingBooks: Book[];
  quotaExceeded?: boolean;
  demandExceeded?: boolean;
  error?: string | null;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ 
  suggestions, 
  isLoading, 
  onRefresh, 
  onAddWishlist, 
  existingBooks, 
  quotaExceeded,
  demandExceeded,
  error
}) => {
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
    <div className="space-y-10 mt-16 pt-16 border-t border-slate-100 dark:border-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <h2 className="text-4xl md:text-6xl font-black font-serif text-slate-900 dark:text-slate-50 italic tracking-tighter">
              Curadoria I.A.
            </h2>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-800/50 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Live Intelligence
            </div>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-sm md:text-base font-medium italic max-w-2xl">
            Baseado no seu perfil de leitura, selecionamos obras que podem ressoar com seus interesses atuais.
          </p>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="group flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary/20 transition-all disabled:opacity-30 shadow-soft"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Sincronizando...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Renovar Sugestões
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
            [1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 space-y-6 relative overflow-hidden h-[400px]">
                    <div className="h-6 bg-slate-50 dark:bg-slate-800 rounded-full w-24"></div>
                    <div className="space-y-4">
                        <div className="h-8 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full"></div>
                        <div className="h-8 bg-slate-50 dark:bg-slate-800 rounded-2xl w-2/3"></div>
                    </div>
                    <div className="space-y-3 mt-auto">
                        <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full w-full"></div>
                        <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full w-full"></div>
                        <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full w-4/5"></div>
                    </div>
                    <div className="pt-8 flex gap-4">
                      <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex-1"></div>
                      <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex-1"></div>
                    </div>
                </div>
            ))
        ) : quotaExceeded ? (
            <div className="md:col-span-3 py-24 bg-red-50/30 dark:bg-red-900/10 rounded-[3rem] border-2 border-dashed border-red-200 dark:border-red-800/30 flex flex-col items-center justify-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-16 w-16 text-red-300 dark:text-red-900/50 mb-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                <h3 className="text-xl font-black text-red-600 dark:text-red-400 mb-2 uppercase tracking-widest">Limite de IA Atingido</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic max-w-sm">A nossa bibliotecária digital precisa descansar um pouco (atingimos o limite de uso gratuito). Tente novamente em alguns minutos!</p>
            </div>
        ) : demandExceeded ? (
            <div className="md:col-span-3 py-24 bg-amber-50/30 dark:bg-amber-900/10 rounded-[3rem] border-2 border-dashed border-amber-200 dark:border-amber-800/30 flex flex-col items-center justify-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-16 w-16 text-amber-300 dark:text-amber-900/50 mb-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-widest">Alta Demanda na IA</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic max-w-sm">Muitos leitores pedindo dicas ao mesmo tempo! O modelo está um pouco sobrecarregado. Por favor, tente clicar em "Renovar" daqui a pouco.</p>
            </div>
        ) : error ? (
            <div className="md:col-span-3 py-24 bg-red-50/10 dark:bg-red-900/10 rounded-[3rem] border-2 border-dashed border-red-100 dark:border-red-900/20 flex flex-col items-center justify-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-16 w-16 text-red-200 dark:text-red-900/30 mb-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                <h3 className="text-xl font-black text-red-600 dark:text-red-400 mb-2 uppercase tracking-widest">Ops! Algo deu errado</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic max-w-lg px-8">{error}</p>
                <button 
                  onClick={onRefresh}
                  className="mt-6 px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-colors"
                >
                  Tentar Novamente
                </button>
            </div>
        ) : hasNoSuggestions ? (
            <div className="md:col-span-3 py-24 bg-slate-50/30 dark:bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <BookOpenIcon className="h-16 w-16 text-slate-200 dark:text-slate-800 mb-6" />
                <p className="text-slate-400 font-bold italic max-w-sm">Estamos conectando com a biblioteca universal para trazer novidades. Tente novamente em instantes.</p>
            </div>
        ) : (
            suggestions.map((rec, idx) => {
                const alreadyAdded = isAlreadyInLibrary(rec.title);
                return (
                    <div key={idx} className="group bento-card bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-soft relative overflow-hidden flex flex-col h-[450px]">
                        {/* Interactive Background */}
                        <div className="absolute -right-20 -top-20 w-56 h-56 bg-primary/5 dark:bg-primary/10 rounded-full blur-[60px] group-hover:scale-150 group-hover:bg-primary/10 transition-all duration-1000"></div>
                        <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[60px] group-hover:scale-150 transition-all duration-1000"></div>
                        
                        <div className="relative z-10 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-8">
                                <span className="px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                    {rec.genre}
                                </span>
                            </div>
                            
                            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 leading-tight mb-3 group-hover:text-primary transition-colors font-serif italic line-clamp-2">
                                {rec.title}
                            </h3>
                            <p className="text-lg text-slate-400 dark:text-slate-500 font-bold mb-8 italic">de {rec.author}</p>
                            
                            <div className="relative mt-auto border-l-4 border-primary/20 pl-6 py-2">
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic line-clamp-4">
                                    "{rec.reason}"
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 mt-10 grid grid-cols-2 gap-4">
                            {rec.buyLink ? (
                                <a 
                                    href={rec.buyLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2 hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all shadow-xl active:scale-95"
                                >
                                    Comprar <ExternalLinkIcon className="h-3.5 w-3.5" />
                                </a>
                            ) : (
                              <div className="px-4 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center italic">
                                Indisponível
                              </div>
                            )}

                            {alreadyAdded ? (
                                <div className="px-4 py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shadow-inner">
                                    Já na Estante
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleAdd(rec)}
                                    className="px-4 py-4 bg-white dark:bg-slate-800 text-primary border border-primary/20 dark:border-slate-700 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/5 transition-all shadow-xl shadow-primary/5 active:scale-95"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Adicionar
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
