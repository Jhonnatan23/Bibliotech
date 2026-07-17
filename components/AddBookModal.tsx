import React from 'react';
import type { NewBook, Book, StatusConfigs, Profile } from '../types';
import { BookStatus, BookType, GENRES, STATUS_CONFIGS } from '../types';
import { XMarkIcon, StarIconFilled, PlusIcon, TagIcon } from './Icons';
import { useBookForm } from '../hooks/useBookForm';
import { IsbnLookupSection } from './IsbnLookupSection';
import { SeriesVolumeSection } from './SeriesVolumeSection';
import { LinkedBooksSection } from './LinkedBooksSection';
import { TagsSection } from './TagsSection';
import { AiSummarySection } from './AiSummarySection';
import { SuggestionDropdown } from './SuggestionDropdown';
import { getLabelClass } from './add-book/utils';

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

  const modalTitle = isEditMode ? 'Editar Registro' : (isDuplicating ? 'Duplicar Registro' : 'Novo Registro');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 dark:border-slate-800 transition-transform duration-500 ${isShaking ? 'animate-shake' : ''}`}
        style={{ animation: isShaking ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'none' }}
      >
        <div className="p-5 md:p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <h2 className="text-xl md:text-2xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight">{modalTitle}</h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-all hover:rotate-90 disabled:opacity-30">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
            {!isEditMode && (
              <IsbnLookupSection
                isbn={isbn}
                setIsbn={setIsbn}
                isIsbnLoading={isIsbnLoading}
                handleIsbnLookup={handleIsbnLookup}
              />
            )}

            <div className="md:col-span-2 relative" ref={titleRef}>
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

            <div className="md:col-span-2">
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
                  className="px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 flex-shrink-0"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {authors.map(a => (
                  <span key={a} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                    {a}
                    <button type="button" onClick={() => removeAuthor(a)} className="hover:text-red-500 transition-colors p-0.5">
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

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
              volume={volume}
              setVolume={setVolume}
              errors={errors}
              seriesRef={seriesRef}
            />

            <div>
              <label className={getLabelClass(false)}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as BookStatus)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                <option value={BookStatus.TBR}>{statusConfigs[BookStatus.TBR].label}</option>
                <option value={BookStatus.Reading}>{statusConfigs[BookStatus.Reading].label}</option>
                <option value={BookStatus.Read}>{statusConfigs[BookStatus.Read].label}</option>
                <option value={BookStatus.Wishlist}>{statusConfigs[BookStatus.Wishlist].label}</option>
                <option value={BookStatus.Dropped}>{statusConfigs[BookStatus.Dropped].label}</option>
              </select>
            </div>

            <div>
              <label className={getLabelClass(false)}>Total de Páginas</label>
              <input type="number" min="0" value={pages} onFocus={(e) => e.target.select()} onChange={(e) => setPages(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" />
            </div>

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

            <TagsSection
              profile={profile}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
            />

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

            <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-emerald-600">
                  <TagIcon className="h-4 w-4" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Informações de Aquisição</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                <div>
                  <label className={getLabelClass(false)}>Valor Estimado (R$)</label>
                  <input 
                    type="text" 
                    value={estimatedPrice} 
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setEstimatedPrice(e.target.value)} 
                    placeholder="0,00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                {(bookToEdit?.wasWishlist || bookToEdit?.pricePaid) && (
                  <div>
                    <label className={getLabelClass(false)}>Valor Real Pago (R$)</label>
                    <input 
                      type="text" 
                      value={pricePaid} 
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setPricePaid(e.target.value)} 
                      placeholder="0,00"
                      className="w-full bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl px-5 py-3.5 outline-none focus:border-emerald-500 font-bold text-emerald-700 dark:text-emerald-400" 
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={getLabelClass(false)}>Link de Compra</label>
              <input 
                type="text" 
                value={buyLink} 
                onChange={(e) => setBuyLink(e.target.value)} 
                placeholder="https://..."
                className="w-full md:col-span-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all hover:border-primary/40">
                <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${isLoaned ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isLoaned ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isLoaned} 
                  onChange={(e) => setIsLoaned(e.target.checked)} 
                />
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Este livro está emprestado no momento?</span>
              </label>

              {isLoaned && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 p-5 md:p-6 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[2rem] animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className={getLabelClass(true)}>Nome de quem pegou emprestado</label>
                    <input 
                      type="text" 
                      value={borrowerName} 
                      onChange={(e) => setBorrowerName(e.target.value)} 
                      placeholder="Ex: João Silva"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                    />
                  </div>
                  <div>
                    <label className={getLabelClass(true)}>Data do Empréstimo</label>
                    <input 
                      type="date" 
                      value={loanDate} 
                      onChange={(e) => setLoanDate(e.target.value)} 
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                    />
                  </div>
                  <p className="md:col-span-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    Livros emprestados aparecem na aba dedicada de Empréstimos.
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={getLabelClass(false)}>Data de Registro</label>
              <input 
                type="date" 
                value={dateAdded} 
                onChange={(e) => setDateAdded(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
              />
            </div>

            <div className="md:col-span-2">
              <label className={getLabelClass(false)}>Tipo de Mídia</label>
              <select value={type} onChange={(e) => setType(e.target.value as BookType)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300">
                <option value={BookType.Book}>Livro</option>
                <option value={BookType.HQ}>HQ</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={getLabelClass(false)}>Formato</label>
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setIsDigital(false)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isDigital ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Físico
                </button>
                <button 
                  type="button"
                  onClick={() => setIsDigital(true)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDigital ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Digital
                </button>
              </div>
            </div>

            {status === BookStatus.Read && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
                <div>
                  <label className={getLabelClass(false)}>Data de Conclusão</label>
                  <input 
                    type="date" 
                    value={dateFinished} 
                    onChange={(e) => setDateFinished(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
                <div>
                  <label className={getLabelClass(false)}>Dias Gastos</label>
                  <input 
                    type="number" 
                    value={daysToFinish} 
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setDaysToFinish(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                  />
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className={getLabelClass(true)}>Gêneros <span className="text-red-500">*</span></label>
              <div className={`p-5 bg-slate-50/50 dark:bg-slate-800/20 border rounded-[2.5rem] ${errors.genre ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex flex-wrap gap-2.5 mb-5">
                  {selectedGenres.map(g => (
                    <span key={g} className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-md">
                      {g}
                      <button type="button" onClick={() => toggleGenre(g)} className="hover:text-tertiary transition-colors p-0.5">
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-5 border-t border-slate-200/60 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {GENRES.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
                        selectedGenres.includes(g) 
                          ? 'bg-primary text-white border border-primary' 
                          : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={getLabelClass(false)}>Avaliação (0 a 10)</label>
              <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-2xl">
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.1" 
                  value={rating} 
                  onChange={(e) => setRating(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0" 
                    max="10" 
                    step="0.1" 
                    value={rating} 
                    onChange={(e) => setRating(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl px-2 py-1.5 text-center font-black text-amber-500"
                  />
                  <StarIconFilled className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </div>
          </div>

          <AiSummarySection
            title={title}
            authors={authors}
            summary={summary}
            setSummary={setSummary}
            handleGenerateSummary={handleGenerateSummary}
            isGeneratingSummary={isGeneratingSummary}
            isSubmitting={isSubmitting}
          />

          <div className="space-y-3">
            <label className={getLabelClass(false)}>Notas Pessoais</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows={4} 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-[1.5rem] px-5 py-4 outline-none focus:border-primary text-sm leading-relaxed" 
              placeholder="Suas anotações..."
            ></textarea>
          </div>

          {(status === BookStatus.Read || status === BookStatus.Dropped) && (
            <div className="space-y-3">
              <label className={getLabelClass(false)}>Observação do Histórico (O que achou?)</label>
              <textarea 
                value={historyObservation} 
                onChange={(e) => setHistoryObservation(e.target.value)} 
                rows={4} 
                className="w-full bg-gradient-to-br from-indigo-50/30 to-slate-50 dark:from-indigo-900/10 dark:to-slate-800 border border-indigo-100 dark:border-indigo-900/50 rounded-[1.5rem] px-5 py-4 outline-none focus:border-primary text-sm leading-relaxed" 
                placeholder="Deixe aqui sua opinião definitiva sobre a obra..."
              ></textarea>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-2xl text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-10 py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 disabled:bg-slate-400 flex items-center gap-3"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Livro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
