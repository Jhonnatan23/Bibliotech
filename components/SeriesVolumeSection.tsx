import React, { useState, useMemo } from 'react';
import { getLabelClass } from './add-book/utils';
import { SuggestionDropdown } from './SuggestionDropdown';
import type { FormErrors } from '../hooks/useBookForm';
import type { Book } from '../types';
import { BookOpen, Plus, Check, ChevronDown, X, Sparkles } from 'lucide-react';

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
  existingBooks?: Book[];
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
  existingBooks,
  volume,
  setVolume,
  errors,
  seriesRef
}) => {
  // Unified list of collections from definedSeries and existingBooks
  const availableCollections = useMemo(() => {
    const map = new Map<string, { id?: string; name: string; totalVolumes?: number; existingVolumeCount: number; maxExistingVolume: number }>();

    // Add defined series
    (definedSeries || []).forEach((s) => {
      if (s && s.name && s.name.trim()) {
        const trimmed = s.name.trim();
        const key = trimmed.toLowerCase();
        map.set(key, {
          id: s.id,
          name: trimmed,
          totalVolumes: s.total_volumes ? Number(s.total_volumes) : undefined,
          existingVolumeCount: 0,
          maxExistingVolume: 0
        });
      }
    });

    // Add series from existing books
    (existingBooks || []).forEach((b) => {
      if (b && b.series && b.series.trim()) {
        const trimmed = b.series.trim();
        const key = trimmed.toLowerCase();
        const existing = map.get(key) || {
          id: b.seriesId || undefined,
          name: trimmed,
          existingVolumeCount: 0,
          maxExistingVolume: 0
        };
        existing.existingVolumeCount += 1;
        if (b.volume && Number(b.volume) > existing.maxExistingVolume) {
          existing.maxExistingVolume = Number(b.volume);
        }
        map.set(key, existing);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [definedSeries, existingBooks]);

  // Mode: select an existing collection or create a new one
  const [collectionMode, setCollectionMode] = useState<'select' | 'create'>(() => {
    const trimmed = (series || '').trim();
    if (trimmed) {
      const isKnown = availableCollections.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
      return isKnown ? 'select' : 'create';
    }
    return availableCollections.length > 0 ? 'select' : 'create';
  });

  // Current matched collection if selected
  const matchedCollection = useMemo(() => {
    const trimmed = (series || '').trim();
    if (!trimmed) return null;
    return availableCollections.find(
      (c) => (seriesId && c.id === seriesId) || c.name.toLowerCase() === trimmed.toLowerCase()
    ) || null;
  }, [series, seriesId, availableCollections]);

  // Suggested next volume if an existing collection is selected
  const suggestedNextVolume = useMemo(() => {
    if (matchedCollection && matchedCollection.maxExistingVolume > 0) {
      return matchedCollection.maxExistingVolume + 1;
    }
    return null;
  }, [matchedCollection]);

  // Check if a typed new name already matches an existing collection
  const isDuplicateName = useMemo(() => {
    const trimmed = (series || '').trim();
    if (collectionMode !== 'create' || !trimmed) return false;
    return availableCollections.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
  }, [collectionMode, series, availableCollections]);

  // Autocomplete suggestions when creating a new collection
  const matchingSuggestions = useMemo(() => {
    const trimmed = (series || '').trim();
    if (!trimmed) return [];
    const searchLower = (series || '').toLowerCase();
    return availableCollections
      .filter(c => c.name.toLowerCase().includes(searchLower) && c.name.toLowerCase() !== searchLower)
      .slice(0, 5)
      .map(c => c.name);
  }, [series, availableCollections]);

  const handleSelectCollection = (value: string) => {
    if (!value) {
      setSeries('');
      setSeriesId('');
      return;
    }
    const selected = availableCollections.find(c => (c.id && c.id === value) || c.name === value);
    if (selected) {
      setSeries(selected.name);
      setSeriesId(selected.id || '');
      // Auto-suggest next volume if volume field is empty
      if (!volume && selected.maxExistingVolume > 0) {
        setVolume(String(selected.maxExistingVolume + 1));
      }
    } else {
      setSeries(value);
      setSeriesId('');
    }
  };

  const handleCreateInput = (val: string) => {
    setSeries(val);
    setSeriesId(''); // Reset ID since it's a new custom collection
    setShowSeriesSug(true);
    setActiveSuggestionIndex(0);
  };

  const handleSelectSuggestion = (suggestedName: string) => {
    const found = availableCollections.find(c => c.name.toLowerCase() === suggestedName.toLowerCase());
    if (found) {
      setSeries(found.name);
      setSeriesId(found.id || '');
      setCollectionMode('select');
      setShowSeriesSug(false);
      if (!volume && found.maxExistingVolume > 0) {
        setVolume(String(found.maxExistingVolume + 1));
      }
    } else {
      setSeries(suggestedName);
      setShowSeriesSug(false);
    }
  };

  return (
    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
      <div className="md:col-span-2 relative" ref={seriesRef}>
        {/* Header with Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label className={`${getLabelClass(false)} !mb-0 flex items-center gap-1.5`}>
            <span>Coleção / Série</span>
            <span className="text-slate-400 font-normal text-[10px] uppercase tracking-wider">(Opcional)</span>
          </label>

          {/* Segmented Mode Switcher */}
          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <button
              type="button"
              onClick={() => setCollectionMode('select')}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                collectionMode === 'select'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Selecionar Existente {availableCollections.length > 0 ? `(${availableCollections.length})` : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCollectionMode('create');
                setSeriesId('');
              }}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                collectionMode === 'create'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>Criar Nova</span>
            </button>
          </div>
        </div>

        {/* Mode: Selecionar Existente */}
        {collectionMode === 'select' ? (
          availableCollections.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Nenhuma coleção cadastrada na sua estante ainda.
              </p>
              <button
                type="button"
                onClick={() => setCollectionMode('create')}
                className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Minha Primeira Coleção</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <select
                  value={matchedCollection ? (matchedCollection.id || matchedCollection.name) : ''}
                  onChange={(e) => handleSelectCollection(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 transition-all focus:ring-4 focus:ring-primary/5 cursor-pointer appearance-none pr-10"
                >
                  <option value="">-- Nenhuma coleção (Sem coleção) --</option>
                  {availableCollections.map((col) => (
                    <option key={col.id || col.name} value={col.id || col.name}>
                      {col.name} {col.existingVolumeCount ? `(${col.existingVolumeCount} livro${col.existingVolumeCount > 1 ? 's' : ''} no acervo)` : (col.totalVolumes ? `(${col.totalVolumes} volumes previstos)` : '')}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {(series || '').trim() ? (
                <div className="mt-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary text-xs font-bold truncate">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      Coleção selecionada: <strong className="font-black text-primary">{series}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSeries('');
                      setSeriesId('');
                    }}
                    className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-rose-500 transition-colors ml-2 flex-shrink-0"
                  >
                    Desvincular
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-medium mt-2 ml-1">
                  ✦ Selecione uma das coleções acima ou clique em <strong>+ Criar Nova</strong> para registrar outra.
                </p>
              )}
            </div>
          )
        ) : (
          /* Mode: Criar Nova Coleção */
          <div className="space-y-2">
            <div className="relative">
              <input 
                type="text" 
                value={series || ''} 
                onChange={(e) => handleCreateInput(e.target.value)}
                placeholder="Nome da nova coleção (ex: Duna, Harry Potter, Sandman)..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 transition-all focus:ring-4 focus:ring-primary/5 pr-10"
              />
              {(series || '').trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSeries('');
                    setSeriesId('');
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Limpar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Suggestions if typed text partially matches existing */}
              <SuggestionDropdown 
                suggestions={matchingSuggestions} 
                show={showSeriesSug && matchingSuggestions.length > 0} 
                activeIndex={activeSuggestionIndex}
                setActiveIndex={setActiveSuggestionIndex}
                onSelect={(val) => handleSelectSuggestion(val)} 
              />
            </div>

            {isDuplicateName ? (
              <div className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                <span>⚠️ Esta coleção já existe no seu acervo.</span>
                <button
                  type="button"
                  onClick={() => {
                    setCollectionMode('select');
                    const matched = availableCollections.find(c => c.name.toLowerCase() === series.trim().toLowerCase());
                    if (matched) {
                      setSeries(matched.name);
                      setSeriesId(matched.id || '');
                    }
                  }}
                  className="underline hover:brightness-110 ml-2 font-black"
                >
                  Usar coleção existente
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium ml-1">
                ✦ Esta nova coleção será criada e associada a este livro, ficando disponível para os próximos volumes.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Volume / Edition input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`${getLabelClass(false)} !mb-0`}>Volume / Edição</label>
          {suggestedNextVolume && !volume && (
            <button
              type="button"
              onClick={() => setVolume(String(suggestedNextVolume))}
              className="text-[9px] font-black uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
              title="Preencher com próximo volume sequencial da coleção"
            >
              <Sparkles className="w-3 h-3" />
              <span>Sugerir Vol. {suggestedNextVolume}</span>
            </button>
          )}
        </div>
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
