import React from 'react';
import { getLabelClass } from './add-book/utils';

interface AiSummarySectionProps {
  title: string;
  authors: string[];
  summary: string;
  setSummary: (val: string) => void;
  handleGenerateSummary: () => void;
  isGeneratingSummary: boolean;
  isSubmitting: boolean;
}

export const AiSummarySection: React.FC<AiSummarySectionProps> = ({
  title,
  authors,
  summary,
  setSummary,
  handleGenerateSummary,
  isGeneratingSummary,
  isSubmitting
}) => {
  return (
    <>
      <div className="p-7 bg-blue-50/40 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-800/50 flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1 uppercase tracking-wide">✦ Inteligência Artificial</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Gere resumos e sinopses automáticas baseadas no título e autores.</p>
        </div>
        <button 
          type="button" 
          onClick={handleGenerateSummary} 
          disabled={isGeneratingSummary || isSubmitting || !title || authors.length === 0} 
          className="px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-tertiary text-white shadow-md active:scale-95 disabled:opacity-50"
        >
          {isGeneratingSummary ? 'Gerando...' : 'Gerar Resumo'}
        </button>
      </div>

      <div className="space-y-3">
        <label className={getLabelClass(false)}>Resumo & Sinopse</label>
        <textarea 
          value={summary} 
          onChange={(e) => setSummary(e.target.value)} 
          rows={4} 
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-[1.5rem] px-5 py-4 outline-none focus:border-primary text-sm leading-relaxed" 
          placeholder="Descrição da obra..."
        ></textarea>
      </div>
    </>
  );
};
