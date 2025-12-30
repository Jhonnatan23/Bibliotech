
import React from 'react';
import { Recommendation } from '../types';
import { ExternalLinkIcon } from './Icons';

interface RecommendationsProps {
  suggestions: Recommendation[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ suggestions, isLoading, onRefresh }) => {
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Descobertas para Você 
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest font-black">IA</span>
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-1 italic">Sugestões baseadas nas suas leituras favoritas.</p>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 dark:hover:bg-primary/10 px-4 py-2 rounded-xl transition-all disabled:opacity-30"
        >
          {isLoading ? 'Consultando IA...' : 'Atualizar Lista'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
            [1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 animate-pulse space-y-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-1/2"></div>
                    <div className="space-y-2 pt-2">
                        <div className="h-2 bg-slate-50 dark:bg-slate-800/50 rounded w-full"></div>
                        <div className="h-2 bg-slate-50 dark:bg-slate-800/50 rounded w-full"></div>
                        <div className="h-2 bg-slate-50 dark:bg-slate-800/50 rounded w-2/3"></div>
                    </div>
                </div>
            ))
        ) : (
            suggestions.map((rec, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default relative overflow-hidden flex flex-col h-full">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 dark:bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                    
                    <div className="flex-1">
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest mb-3">
                            {rec.genre}
                        </span>
                        
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 leading-tight mb-1 group-hover:text-primary transition-colors">
                            {rec.title}
                        </h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 font-bold mb-4">{rec.author}</p>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic mb-6">
                            "{rec.reason}"
                        </p>
                    </div>

                    {rec.buyLink && (
                        <a 
                            href={rec.buyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-auto w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95"
                        >
                            Ver na Loja <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};
