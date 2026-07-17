import React from 'react';
import { getLabelClass } from './add-book/utils';
import { SuggestionDropdown } from './SuggestionDropdown';
import type { FormErrors } from '../hooks/useBookForm';

interface SeriesVolumeSectionProps {
  series: string;
  setSeries: (val: string) => void;
  seriesId: string;
  setSeriesId: (val: string) => void;
  showSeriesSug: boolean;
  setShowSeriesSug: (val: boolean) => void;
  activeSuggestionIndex: number;
  setActiveSuggestionIndex: (val: number) => void;
  definedSeries: any[];
  volume: string;
  setVolume: (val: string) => void;
  errors: FormErrors;
  seriesRef: React.RefObject<HTMLDivElement | null>;
}

export const SeriesVolumeSection: React.FC<SeriesVolumeSectionProps> = ({
  series,
  setSeries,
  seriesId,
  setSeriesId,
  showSeriesSug,
  setShowSeriesSug,
  activeSuggestionIndex,
  setActiveSuggestionIndex,
  definedSeries,
  volume,
  setVolume,
  errors,
  seriesRef
}) => {
  return (
    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
      <div className="md:col-span-2 relative" ref={seriesRef}>
        <label className={getLabelClass(false)}>Coleção (Opcional)</label>
        <input 
          type="text" 
          value={series} 
          onChange={(e) => {
            setSeries(e.target.value);
            setSeriesId(''); // Reset ID if name changes manually
            setShowSeriesSug(true);
            setActiveSuggestionIndex(0);
          }}
          onFocus={() => series && setShowSeriesSug(true)}
          placeholder="Nome da coleção..."
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300"
        />
        <SuggestionDropdown 
          suggestions={definedSeries.filter(s => s.name.toLowerCase().includes(series.toLowerCase())).slice(0, 5)} 
          show={showSeriesSug && series.length > 0} 
          activeIndex={activeSuggestionIndex}
          setActiveIndex={setActiveSuggestionIndex}
          onSelect={(s) => { 
            setSeries(s.name); 
            setSeriesId(s.id); 
            setShowSeriesSug(false); 
          }} 
        />
      </div>
      <div>
        <label className={getLabelClass(false)}>Volume / Edição</label>
        <input 
          type="number" 
          min="1"
          value={volume} 
          onFocus={(e) => e.target.select()}
          onChange={(e) => setVolume(e.target.value)} 
          placeholder="Nº"
          className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl px-5 py-3.5 outline-none transition-all focus:ring-4 focus:ring-primary/5 ${errors.volume ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-700 focus:border-primary font-bold text-slate-700 dark:text-slate-300 text-center'}`}
        />
        {errors.volume && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-wide ml-1 animate-in fade-in slide-in-from-top-1">{errors.volume}</p>}
      </div>
    </div>
  );
};
