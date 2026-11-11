import React, { useState } from 'react';
import type { NewBook, Book, StatusConfigs, Profile } from '../types';
import { BookStatus, BookType, GENRES, STATUS_CONFIGS } from '../types';
import { XMarkIcon, StarIconFilled, PlusIcon, TagIcon, CameraIcon, BookOpenIcon } from './Icons';
import { RatingStars } from './RatingStars';
import { useBookForm } from '../hooks/useBookForm';
import { IsbnLookupSection } from './IsbnLookupSection';
import { CoverScanCapture, type RecognizedData } from './CoverScanCapture';
import { SeriesVolumeSection } from './SeriesVolumeSection';
import { LinkedBooksSection } from './LinkedBooksSection';
import { TagsSection } from './TagsSection';
import { AiSummarySection } from './AiSummarySection';
import { SuggestionDropdown } from './SuggestionDropdown';
import { getLabelClass } from './add-book/utils';

import { ConfirmationModal } from './ConfirmationModal';

export type AddBookTab = 'essential' | 'reading_experience' | 'collection';

interface AddBookModalProps {
  onClose: () => void;
  onAddBook: (book: NewBook) => Promise<void>;
  onUpdateBook: (book: Book) => Promise<void>;
  bookToEdit?: Book | null;
  isDuplicating?: boolean;
  defaultStatus?: BookStatus;
  existingBooks: Book[];
  statusConfigs?: StatusConfigs;
  profile: Profile | null;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({ 
  onClose, 
  onAddBook, 
  onUpdateBook, 
  bookToEdit, 
  isDuplicating = false,
  defaultStatus, 
  existingBooks, 
  statusConfigs = STATUS_CONFIGS,
  profile
}) => {
  const {
    isEditMode,
    isDirty,
    title, setTitle,
    isbn, setIsbn,
    isIsbnLoading,
    authors,
    authorInput, setAuthorInput,
    pages, setPages,
    currentPage, setCurrentPage,
    selectedGenres,
    type, setType,
    status, setStatus,
    rating, setRating,
    summary, setSummary,
    notes, setNotes,
    estimatedPrice, setEstimatedPrice,
    pricePaid, setPricePaid,
    buyLink, setBuyLink,
    linkedBookIds,
    selectedTags,
    isLoaned, setIsLoaned,
    borrowerName, setBorrowerName,
    loanDate, setLoanDate,
    isDigital, setIsDigital,
    series, setSeries,
    volume, setVolume,
    seriesId, setSeriesId,
    condition, setCondition,
    purchaseDate, setPurchaseDate,
    store, setStore,
    physicalLocation, setPhysicalLocation,
    edition, setEdition,
    signed, setSigned,
    sealed, setSealed,
    limitedEdition, setLimitedEdition,
    firstEdition, setFirstEdition,
    variantCover, setVariantCover,
    isGeneratingSummary,
    isSubmitting,
    dateAdded, setDateAdded,
    dateFinished, setDateFinished,
    daysToFinish, setDaysToFinish,
    timesRead, setTimesRead,
    historyObservation, setHistoryObservation,
    errors,
    isShaking,
    titleSuggestions,
    authorSuggestions,
    linkSearch, setLinkSearch,
    showLinkSuggestions, setShowLinkSuggestions,
    activeSuggestionIndex, setActiveSuggestionIndex,
    showTitleSug, setShowTitleSug,
    showAuthorSug, setShowAuthorSug,
    showSeriesSug, setShowSeriesSug,
    definedSeries,
    linkableBooks,
    titleRef,
    authorRef,
    linkRef,
    seriesRef,
    addAuthor,
    removeAuthor,
    toggleLinkedBook,
    toggleTag,
    handleTitleChange,
    handleAuthorInputChange,
    handleKeyDown,
    toggleGenre,
    handleSubmit,
    handleGenerateSummary,
    handleIsbnLookup
  } = useBookForm({
    onClose,
    onAddBook,
    onUpdateBook,
    bookToEdit,
    isDuplicating,
    defaultStatus,
    existingBooks,
    profile
  });

  const [activeTab, setActiveTab] = useState<AddBookTab>('essential');
  const [entryMode, setEntryMode] = useState<'isbn' | 'scan'>('isbn');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleSafeClose = () => {
    if (isDirty && !isSubmitting) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleApplyRecognizedCover = (data: RecognizedData) => {
    if (data.title) setTitle(data.title);
    if (data.author) {
      const parts = data.author.split(/,| e | & /i).map(a => a.trim()).filter(Boolean);
      parts.forEach(p => addAuthor(p));
    }
    if (data.pages && data.pages > 0) {
      setPages(data.pages);
    }
    if (data.volumeOrIssue) {
      const volMatch = data.volumeOrIssue.match(/\d+/);
      if (volMatch) setVolume(volMatch[0]);
    }
    if (data.isComicOrManga) {
      setType(BookType.HQ);
    }
    if (data.description) {
      setSummary(data.description);
    }
    setEntryMode('isbn');
  };

  const modalTitle = isEditMode ? 'Editar Registro' : (isDuplicating ? 'Duplicar Registro' : 'Novo Registro');

  const tabsConfig = [
    {
      id: 'essential' as const,
      label: '1. Essencial',
      badge: 'Principal',
      icon: '📖',
      description: 'Título, autores e leitura'
    },
    {
      id: 'reading_experience' as const,
      label: '2. Experiência',
      badge: 'Opcional',
      icon: '⭐',
      description: 'Nota, datas e resenha'
    },
    {
      id: 'collection' as const,
      label: '3. Acervo & Coleção',
      badge: 'Opcional',
      icon: '🏷️',
      description: 'Preços, séries e estante'
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className={`bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-white/20 dark:border-slate-800 transition-transform duration-500 ${isShaking ? 'animate-shake' : ''}`}
        style={{ animation: isShaking ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'none' }}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 md:px-7 md:py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h2 className="text-xl md:text-2xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight">{modalTitle}</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Preencha os campos essenciais para salvar ou explore os detalhes.
            </p>
          </div>
          <button 
            type="button"
            onClick={handleSafeClose} 
            disabled={isSubmitting} 
            aria-label="Fechar modal"
            className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-all hover:rotate-90 disabled:opacity-30 cursor-pointer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Progressive Disclosure Segmented Tabs Header */}
        <div className="px-5 pt-3 pb-2 md:px-7 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div role="tablist" aria-label="Seções do cadastro" className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {tabsConfig.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  data-testid={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs transition-all duration-200 select-none cursor-pointer relative min-h-[44px] ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm font-black'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold hover:bg-white/40 dark:hover:bg-slate-700/40'
                  }`}
                >
                  <span className="text-sm" aria-hidden="true">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-5 md:p-7 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* TAB 1: ESSENCIAL (Visible by default) */}
          <div 
            id="tabpanel-essential"
            role="tabpanel"
            aria-labelledby="tab-essential"
            data-testid="tabpanel-essential"
            className={`space-y-5 ${activeTab === 'essential' ? 'block' : 'hidden'}`}
          >
            {!isEditMode && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex-wrap gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-2">
                    Preenchimento Automático Rápido:
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEntryMode('isbn')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${entryMode === 'isbn' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                      Código ISBN
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode('scan')}
                      className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${entryMode === 'scan' ? 'bg-primary text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                      <CameraIcon className="w-3.5 h-3.5" />
                      Foto da Capa (IA)
                    </button>
                  </div>
                </div>

                {entryMode === 'isbn' ? (
                  <IsbnLookupSection
                    isbn={isbn}
                    setIsbn={setIsbn}
                    isIsbnLoading={isIsbnLoading}
                    handleIsbnLookup={handleIsbnLookup}
                  />
                ) : (
                  <CoverScanCapture
                    onApplyRecognized={handleApplyRecognizedCover}
                    onCancel={() => setEntryMode('isbn')}
                  />
                )}
              </div>
            )}

            {/* Title */}
            <div className="relative" ref={titleRef}>
              <label className={getLabelClass(true)}>
                Título <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={title} 
                autoFocus
                onChange={handleTitleChange}
                onKeyDown={(e) => handleKeyDown(e, 'title')}
                onFocus={(e) => e.target.select()}
                placeholder="Ex: Cem Anos de Solidão"
                className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl px-5 py-3.5 outline-none transition-all focus:ring-4 focus:ring-primary/5 ${errors.title ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-700 focus:border-primary font-bold text-slate-700 dark:text-slate-300'}`} 
              />
              <SuggestionDropdown 
                suggestions={titleSuggestions} 
                show={showTitleSug} 
                activeIndex={activeSuggestionIndex}
                setActiveIndex={setActiveSuggestionIndex}
                onSelect={(val) => { setTitle(val); setShowTitleSug(false); }} 
              />
              {errors.title && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-wide ml-1 animate-in fade-in slide-in-from-top-1">{errors.title}</p>}
            </div>

            {/* Authors */}
            <div>
              <label className={getLabelClass(true)}>
                Autor(es) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-3 relative" ref={authorRef}>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={authorInput} 
                    onChange={handleAuthorInputChange}
                    onKeyDown={(e) => {
                      handleKeyDown(e, 'author');
                      if (e.key === 'Enter' && !showAuthorSug) {
                        e.preventDefault();
                        addAuthor();
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    placeholder="Adicione um autor..."
                    className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl px-5 py-3.5 outline-none transition-all focus:ring-4 focus:ring-primary/5 ${errors.authors ? 'border-red-400' : 'border-slate-200 dark:border-slate-700 focus:border-primary font-bold text-slate-700 dark:text-slate-300'}`} 
                  />
                  <SuggestionDropdown 
                    suggestions={authorSuggestions} 
                    show={showAuthorSug} 
                    activeIndex={activeSuggestionIndex}
                    setActiveIndex={setActiveSuggestionIndex}
                    onSelect={(val) => addAuthor(val)} 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => addAuthor()}
                  className="px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 flex-shrink-0 cursor-pointer"
                  aria-label="Adicionar autor"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {authors.map(a => (
                  <span key={a} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                    {a}
                    <button type="button" onClick={() => removeAuthor(a)} className="hover:text-red-500 transition-colors p-0.5 cursor-pointer">
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              {errors.authors && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-wide ml-1 animate-in fade-in slide-in-from-top-1">{errors.authors}</p>}
            </div>

            {/* Status & Pages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={getLabelClass(false)}>Status de Leitura</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as BookStatus)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary cursor-pointer font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value={BookStatus.Reading}>{statusConfigs[BookStatus.Reading].label}</option>
                  <option value={BookStatus.TBR}>{statusConfigs[BookStatus.TBR].label}</option>
                  <option value={BookStatus.Read}>{statusConfigs[BookStatus.Read].label}</option>
                  <option value={BookStatus.Wishlist}>{statusConfigs[BookStatus.Wishlist].label}</option>
                  <option value={BookStatus.Dropped}>{statusConfigs[BookStatus.Dropped].label}</option>
                </select>
              </div>

              <div>
                <label className={getLabelClass(false)}>Total de Páginas</label>
                <input 
                  type="number" 
                  min="0" 
                  value={pages} 
                  onFocus={(e) => e.target.select()} 
                  onChange={(e) => setPages(Number(e.target.value))} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  placeholder="Ex: 350"
                />
              </div>
            </div>

            {/* Current page (visible when reading or dropped) */}
            {(status === BookStatus.Dropped || status === BookStatus.Reading) && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className={getLabelClass(false)}>Página Atual (Progresso)</label>
                <input 
                  type="number" 
                  min="0" 
                  max={pages || undefined}
                  value={currentPage} 
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCurrentPage(Number(e.target.value))} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                />
              </div>
            )}

            {/* Quick reminder for user */}
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Pronto para salvar? Use <strong className="text-primary font-bold">Adição Rápida</strong> ou explore as abas acima para notas e acervo.
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('reading_experience')}
                className="text-primary font-black text-xs uppercase tracking-wider hover:underline ml-2 flex-shrink-0 cursor-pointer"
              >
                Avançar →
              </button>
            </div>
          </div>

          {/* TAB 2: EXPERIÊNCIA DE LEITURA */}
          <div 
            id="tabpanel-reading_experience"
            role="tabpanel"
            aria-labelledby="tab-reading_experience"
            data-testid="tabpanel-reading_experience"
            className={`space-y-6 ${activeTab === 'reading_experience' ? 'block' : 'hidden'}`}
          >
            {/* Rating */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={getLabelClass(false)}>Avaliação (0 a 5.0)</label>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                  {(rating || 0).toFixed(1)} / 5.0
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
                <div className="flex-1 w-full flex items-center justify-center sm:justify-start">
                  <RatingStars
                    rating={rating}
                    onChange={(newVal) => setRating(newVal)}
                    size="lg"
                    precision={0.1}
                    showLabel={false}
                    aria-label="Avaliação do livro de 0 a 5.0 estrelas"
                  />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    step="0.1" 
                    value={rating} 
                    onChange={(e) => setRating(parseFloat(e.target.value))}
                    className="w-28 sm:w-36 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    aria-label="Controle deslizante de avaliação"
                  />
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number" 
                      min="0" 
                      max="5" 
                      step="0.1" 
                      value={rating} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setRating(isNaN(val) ? 0 : Math.min(5, Math.max(0, val)));
                      }}
                      className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-center font-black text-amber-500 font-mono text-sm"
                      aria-label="Nota numérica de 0 a 5"
                    />
                    <span className="text-xs font-black text-slate-400 font-mono">/5</span>
                    <StarIconFilled className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary Section / Synopsis */}
            <AiSummarySection
              title={title}
              authors={authors}
              summary={summary}
              setSummary={setSummary}
              handleGenerateSummary={handleGenerateSummary}
              isGeneratingSummary={isGeneratingSummary}
              isSubmitting={isSubmitting}
            />

            {/* Read status completion details */}
            {status === BookStatus.Read && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl">
                <div>
                  <label className={getLabelClass(false)}>Data de Conclusão</label>
                  <input 
                    type="date" 
                    value={dateFinished} 
                    onChange={(e) => setDateFinished(e.target.value)} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 text-sm" 
                  />
                </div>
                <div>
                  <label className={getLabelClass(false)}>Dias Gastos</label>
                  <input 
                    type="number" 
                    value={daysToFinish} 
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setDaysToFinish(e.target.value)} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 text-sm" 
                  />
                </div>
                <div>
                  <label className={getLabelClass(false)}>Vezes Lido</label>
                  <input 
                    type="number" 
                    min="1"
                    value={timesRead} 
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setTimesRead(Number(e.target.value))} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 text-sm" 
                  />
                </div>
              </div>
            )}

            {/* Registration Date */}
            <div>
              <label className={getLabelClass(false)}>Data de Registro na Estante</label>
              <input 
                type="date" 
                value={dateAdded} 
                onChange={(e) => setDateAdded(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
              />
            </div>

            {/* Personal Notes */}
            <div className="space-y-2">
              <label className={getLabelClass(false)}>Notas Pessoais & Citações</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={3} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary text-sm leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-400" 
                placeholder="Suas impressões, citações favoritas ou anotações pessoais..."
              />
            </div>

            {/* History Observation */}
            {(status === BookStatus.Read || status === BookStatus.Dropped) && (
              <div className="space-y-2">
                <label className={getLabelClass(false)}>Observação do Histórico (O que achou?)</label>
                <textarea 
                  value={historyObservation} 
                  onChange={(e) => setHistoryObservation(e.target.value)} 
                  rows={3} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary text-sm leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-400" 
                  placeholder="Deixe aqui sua opinião definitiva sobre a obra..."
                />
              </div>
            )}
          </div>

          {/* TAB 3: ACERVO & COLEÇÃO */}
          <div 
            id="tabpanel-collection"
            role="tabpanel"
            aria-labelledby="tab-collection"
            data-testid="tabpanel-collection"
            className={`space-y-6 ${activeTab === 'collection' ? 'block' : 'hidden'}`}
          >
            {/* Media Type & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={getLabelClass(false)}>Tipo de Mídia</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value as BookType)} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value={BookType.Book}>Livro</option>
                  <option value={BookType.HQ}>HQ</option>
                  <option value={BookType.Manga}>Mangá</option>
                </select>
              </div>

              <div>
                <label className={getLabelClass(false)}>Formato</label>
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setIsDigital(false)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${!isDigital ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Físico
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsDigital(true)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${isDigital ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Digital
                  </button>
                </div>
              </div>
            </div>

            {/* Price & Acquisition */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Aquisição & Valor</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={getLabelClass(false)}>Valor Real Pago (R$)</label>
                  <input 
                    type="text" 
                    value={pricePaid} 
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPricePaid(e.target.value)} 
                    placeholder="0,00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                <div>
                  <label className={getLabelClass(false)}>Valor Estimado (R$)</label>
                  <input 
                    type="text" 
                    value={estimatedPrice} 
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setEstimatedPrice(e.target.value)} 
                    placeholder="0,00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                <div>
                  <label className={getLabelClass(false)}>Loja / Local de Compra</label>
                  <input 
                    type="text" 
                    value={store} 
                    onChange={(e) => setStore(e.target.value)} 
                    placeholder="Ex: Amazon, Panini, Sebo..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                <div>
                  <label className={getLabelClass(false)}>Data da Compra</label>
                  <input 
                    type="date" 
                    value={purchaseDate} 
                    onChange={(e) => setPurchaseDate(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
              </div>
            </div>

            {/* Collector Details & Physical Location */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-4 w-4 text-purple-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Estante & Edição</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={getLabelClass(false)}>Localização Física na Estante</label>
                  <input 
                    type="text" 
                    value={physicalLocation} 
                    onChange={(e) => setPhysicalLocation(e.target.value)} 
                    placeholder="Ex: Prateleira 2, Caixa HQ, Quarto..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                <div>
                  <label className={getLabelClass(false)}>Edição / Versão</label>
                  <input 
                    type="text" 
                    value={edition} 
                    onChange={(e) => setEdition(e.target.value)} 
                    placeholder="Ex: 1ª Edição, Edição de Luxo..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                <div>
                  <label className={getLabelClass(false)}>Condição do Item</label>
                  <select 
                    value={condition} 
                    onChange={(e) => setCondition(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300"
                  >
                    <option value="">Selecione...</option>
                    <option value="Novo">Novo (Lacrado/Impecável)</option>
                    <option value="Como Novo">Como Novo (Perfeito estado)</option>
                    <option value="Muito Bom">Muito Bom (Mínimos detalhes)</option>
                    <option value="Bom">Bom (Estado normal de uso)</option>
                    <option value="Razoável">Razoável (Desgastes evidentes)</option>
                    <option value="Danificado">Danificado / Incompleto</option>
                  </select>
                </div>
                <div>
                  <label className={getLabelClass(false)}>Link de Compra</label>
                  <input 
                    type="text" 
                    value={buyLink} 
                    onChange={(e) => setBuyLink(e.target.value)} 
                    placeholder="https://..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
              </div>

              {/* Collector Checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary focus:ring-primary h-4 w-4" 
                    checked={signed} 
                    onChange={(e) => setSigned(e.target.checked)} 
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Autografado</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary focus:ring-primary h-4 w-4" 
                    checked={sealed} 
                    onChange={(e) => setSealed(e.target.checked)} 
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Lacrado</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary focus:ring-primary h-4 w-4" 
                    checked={limitedEdition} 
                    onChange={(e) => setLimitedEdition(e.target.checked)} 
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Ed. Limitada</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary focus:ring-primary h-4 w-4" 
                    checked={firstEdition} 
                    onChange={(e) => setFirstEdition(e.target.checked)} 
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">1ª Edição</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary focus:ring-primary h-4 w-4" 
                    checked={variantCover} 
                    onChange={(e) => setVariantCover(e.target.checked)} 
                  />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Capa Var.</span>
                </label>
              </div>
            </div>

            {/* Series & Volume */}
            <SeriesVolumeSection
              series={series}
              setSeries={setSeries}
              seriesId={seriesId}
              setSeriesId={setSeriesId}
              showSeriesSug={showSeriesSug}
              setShowSeriesSug={setShowSeriesSug}
              activeSuggestionIndex={activeSuggestionIndex}
              setActiveSuggestionIndex={setActiveSuggestionIndex}
              definedSeries={definedSeries}
              existingBooks={existingBooks}
              volume={volume}
              setVolume={setVolume}
              errors={errors}
              seriesRef={seriesRef}
            />

            {/* Genres */}
            <div>
              <label className={getLabelClass(false)}>Gêneros</label>
              <div className={`p-4 bg-slate-50/50 dark:bg-slate-800/20 border rounded-2xl ${errors.genre ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}>
                {selectedGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedGenres.map(g => (
                      <span key={g} className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                        {g}
                        <button type="button" onClick={() => toggleGenre(g)} className="hover:text-tertiary transition-colors p-0.5 cursor-pointer">
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {GENRES.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        selectedGenres.includes(g) 
                          ? 'bg-primary text-white border border-primary shadow-xs' 
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <TagsSection
              profile={profile}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
            />

            {/* Linked Books */}
            <LinkedBooksSection
              linkSearch={linkSearch}
              setLinkSearch={setLinkSearch}
              showLinkSuggestions={showLinkSuggestions}
              setShowLinkSuggestions={setShowLinkSuggestions}
              handleKeyDown={handleKeyDown}
              linkableBooks={linkableBooks}
              activeSuggestionIndex={activeSuggestionIndex}
              setActiveSuggestionIndex={setActiveSuggestionIndex}
              toggleLinkedBook={toggleLinkedBook}
              linkedBookIds={linkedBookIds}
              existingBooks={existingBooks}
              linkRef={linkRef}
            />

            {/* Loan details */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all hover:border-primary/40">
                <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${isLoaned ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isLoaned ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isLoaned} 
                  onChange={(e) => setIsLoaned(e.target.checked)} 
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Este livro está emprestado no momento?</span>
              </label>

              {isLoaned && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className={getLabelClass(true)}>Nome de quem pegou emprestado</label>
                    <input 
                      type="text" 
                      value={borrowerName} 
                      onChange={(e) => setBorrowerName(e.target.value)} 
                      placeholder="Ex: João Silva"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 text-sm" 
                    />
                  </div>
                  <div>
                    <label className={getLabelClass(true)}>Data do Empréstimo</label>
                    <input 
                      type="date" 
                      value={loanDate} 
                      onChange={(e) => setLoanDate(e.target.value)} 
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300 text-sm" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Action Footer with Quick Add Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button 
              type="button" 
              onClick={handleSafeClose} 
              disabled={isSubmitting}
              className="px-5 py-3 rounded-2xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Tab Navigation helpers */}
              {activeTab !== 'essential' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'collection' ? 'reading_experience' : 'essential')}
                  disabled={isSubmitting}
                  className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                >
                  ← Voltar
                </button>
              )}

              {activeTab === 'essential' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('reading_experience')}
                  disabled={isSubmitting}
                  className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                >
                  Mais Detalhes →
                </button>
              )}

              {activeTab === 'reading_experience' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('collection')}
                  disabled={isSubmitting}
                  className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                >
                  Acervo →
                </button>
              )}

              {/* Quick Add (Adição Rápida) Primary Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="quick-add-btn"
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                title="Salvar imediatamente com os dados preenchidos"
              >
                <span>⚡</span>
                <span>{isSubmitting ? 'Salvando...' : 'Adição Rápida'}</span>
              </button>

              {/* Standard Save Book Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="save-book-btn"
                className="px-8 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 disabled:bg-slate-400 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Livro'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={() => {
          setShowConfirmClose(false);
          onClose();
        }}
        title="Descartar alterações?"
        message="Você possui alterações não salvas. Se sair agora, as edições feitas neste livro serão perdidas."
        confirmLabel="Descartar e Sair"
        confirmButtonClass="bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20"
      />
    </div>
  );
};

export default AddBookModal;
