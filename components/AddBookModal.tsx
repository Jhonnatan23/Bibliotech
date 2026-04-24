
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { NewBook, Book, StatusConfigs, Profile } from '../types';
import { BookStatus, BookType, GENRES, STATUS_CONFIGS } from '../types';
import { XMarkIcon, BookOpenIcon, StarIcon, StarIconFilled, PlusIcon, TagIcon, MagnifyingGlassIcon } from './Icons';
import { generateBookSummary } from '../services/geminiService';
import { fetchBookByIsbn } from '../services/googleBooksService';

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

interface FormErrors {
  title?: string;
  authors?: string;
  genre?: string;
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
  const isEditMode = !!bookToEdit && !isDuplicating;

  const [title, setTitle] = useState(bookToEdit?.title || '');
  const [isbn, setIsbn] = useState('');
  const [isIsbnLoading, setIsIsbnLoading] = useState(false);
  const [authors, setAuthors] = useState<string[]>(
    bookToEdit?.author ? bookToEdit.author.split(',').map(a => a.trim()).filter(a => a !== '') : []
  );
  const [authorInput, setAuthorInput] = useState('');
  const [pages, setPages] = useState(bookToEdit?.pages || 0);
  const [currentPage, setCurrentPage] = useState(isDuplicating ? 0 : (bookToEdit?.currentPage || 0));
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    bookToEdit?.genre ? bookToEdit.genre.split(',').map(g => g.trim()).filter(g => g !== '') : []
  );
  const [type, setType] = useState<BookType>(bookToEdit?.type || BookType.Book);
  const [status, setStatus] = useState<BookStatus>(bookToEdit?.status || defaultStatus || BookStatus.TBR);
  const [rating, setRating] = useState<number>(isDuplicating ? 0 : (bookToEdit?.rating || 0));
  const [summary, setSummary] = useState(bookToEdit?.summary || '');
  const [notes, setNotes] = useState(isDuplicating ? '' : (bookToEdit?.notes || ''));
  const [estimatedPrice, setEstimatedPrice] = useState(bookToEdit?.estimatedPrice?.toString() || '');
  const [pricePaid, setPricePaid] = useState(isDuplicating ? '' : (bookToEdit?.pricePaid?.toString() || ''));
  const [buyLink, setBuyLink] = useState(bookToEdit?.buyLink || '');
  const [linkedBookIds, setLinkedBookIds] = useState<string[]>(bookToEdit?.linkedBookIds || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(bookToEdit?.tags || []);
  const [isLoaned, setIsLoaned] = useState<boolean>(bookToEdit?.isLoaned || false);
  const [borrowerName, setBorrowerName] = useState(bookToEdit?.borrowerName || '');
  const [loanDate, setLoanDate] = useState(bookToEdit?.loanDate || new Date().toISOString().split('T')[0]);
  const [isDigital, setIsDigital] = useState<boolean>(bookToEdit?.isDigital || false);
  
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dateAdded, setDateAdded] = useState(isDuplicating ? new Date().toISOString().split('T')[0] : (bookToEdit?.dateAdded || new Date().toISOString().split('T')[0]));
  const [dateFinished, setDateFinished] = useState(isDuplicating ? new Date().toISOString().split('T')[0] : (bookToEdit?.dateFinished || new Date().toISOString().split('T')[0]));
  const [daysToFinish, setDaysToFinish] = useState(isDuplicating ? '' : (bookToEdit?.daysToFinish?.toString() || ''));
  const [timesRead, setTimesRead] = useState(isDuplicating ? 0 : (bookToEdit?.timesRead || (bookToEdit?.status === BookStatus.Read ? 1 : 0)));
  const [historyObservation, setHistoryObservation] = useState(isDuplicating ? '' : (bookToEdit?.historyObservation || ''));

  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);

  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [authorSuggestions, setAuthorSuggestions] = useState<string[]>([]);
  const [linkSearch, setLinkSearch] = useState('');
  const [showLinkSuggestions, setShowLinkSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [showTitleSug, setShowTitleSug] = useState(false);
  const [showAuthorSug, setShowAuthorSug] = useState(false);

  const titleRef = useRef<HTMLDivElement>(null);
  const authorRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);

  const uniqueTitles = useMemo(() => Array.from(new Set(existingBooks.map(b => b.title))), [existingBooks]);
  const uniqueAuthors = useMemo(() => {
    const all = existingBooks.flatMap(b => b.author.split(',').map(a => a.trim()));
    return Array.from(new Set(all));
  }, [existingBooks]);

  const linkableBooks = useMemo(() => {
    return existingBooks
        .filter(b => b.id !== bookToEdit?.id)
        .filter(b => b.title.toLowerCase().includes(linkSearch.toLowerCase()) || b.author.toLowerCase().includes(linkSearch.toLowerCase()))
        .slice(0, 5);
  }, [existingBooks, linkSearch, bookToEdit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) setShowTitleSug(false);
      if (authorRef.current && !authorRef.current.contains(event.target as Node)) setShowAuthorSug(false);
      if (linkRef.current && !linkRef.current.contains(event.target as Node)) setShowLinkSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addAuthor = (name?: string) => {
    const val = name || authorInput.trim();
    if (val && !authors.includes(val)) {
      setAuthors([...authors, val]);
      setAuthorInput('');
      setShowAuthorSug(false);
      if (errors.authors) setErrors(prev => ({ ...prev, authors: undefined }));
    }
  };

  const removeAuthor = (name: string) => {
    setAuthors(authors.filter(a => a !== name));
  };

  const toggleLinkedBook = (id: string) => {
    setLinkedBookIds(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    setLinkSearch('');
    setShowLinkSuggestions(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
    if (value.trim().length > 0) {
      const filtered = uniqueTitles.filter(t => t.toLowerCase().includes(value.toLowerCase()) && t.toLowerCase() !== value.toLowerCase()).slice(0, 5);
      setTitleSuggestions(filtered);
      setShowTitleSug(filtered.length > 0);
      setActiveSuggestionIndex(0);
    } else {
      setShowTitleSug(false);
    }
  };

  const handleAuthorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAuthorInput(value);
    if (value.trim().length > 0) {
      const filtered = uniqueAuthors.filter(a => a.toLowerCase().includes(value.toLowerCase()) && !authors.includes(a)).slice(0, 5);
      setAuthorSuggestions(filtered);
      setShowAuthorSug(filtered.length > 0);
      setActiveSuggestionIndex(0);
    } else {
      setShowAuthorSug(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'title' | 'author' | 'link') => {
    const suggestions = type === 'title' ? titleSuggestions : (type === 'author' ? authorSuggestions : linkableBooks);
    const show = type === 'title' ? showTitleSug : (type === 'author' ? showAuthorSug : showLinkSuggestions);
    if (show && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = suggestions[activeSuggestionIndex];
        if (type === 'title') {
          setTitle(selected as string);
          setShowTitleSug(false);
        } else if (type === 'author') {
          addAuthor(selected as string);
        } else {
            toggleLinkedBook((selected as Book).id);
        }
      } else if (e.key === 'Escape') {
        if (type === 'title') setShowTitleSug(false);
        else if (type === 'author') setShowAuthorSug(false);
        else setShowLinkSuggestions(false);
      }
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
    if (errors.genre) setErrors(prev => ({ ...prev, genre: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let finalAuthors = [...authors];
    if (authorInput.trim() && !finalAuthors.includes(authorInput.trim())) {
        finalAuthors.push(authorInput.trim());
    }

    const newErrors: FormErrors = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      newErrors.title = "O título é obrigatório";
    }

    if (finalAuthors.length === 0) newErrors.authors = "Adicione ao menos um autor";
    if (selectedGenres.length === 0) newErrors.genre = "Selecione ao menos um gênero";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsSubmitting(true);
    try {
        const bookData = { 
            title: trimmedTitle, 
            author: finalAuthors.join(', '), 
            pages, 
            genre: selectedGenres.join(', '), 
            type, 
            status, 
            summary, 
            notes,
            rating: (status === BookStatus.Read || rating > 0) ? (rating || undefined) : undefined,
            estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice.replace(',', '.')) : undefined,
            pricePaid: pricePaid ? parseFloat(pricePaid.replace(',', '.')) : (isDuplicating ? undefined : bookToEdit?.pricePaid),
            buyLink: buyLink.trim() || undefined,
            dateAdded,
            currentPage: status === BookStatus.Read ? pages : (status === BookStatus.TBR || status === BookStatus.Wishlist ? 0 : currentPage),
            dateStarted: isDuplicating ? undefined : bookToEdit?.dateStarted,
            dateFinished: status === BookStatus.Read ? dateFinished : undefined,
            daysToFinish: status === BookStatus.Read && daysToFinish ? parseInt(daysToFinish, 10) : undefined,
            timesRead: status === BookStatus.Read ? Number(timesRead) : (isDuplicating ? 0 : (bookToEdit?.timesRead || 0)),
            wasWishlist: isDuplicating ? (status === BookStatus.Wishlist) : (bookToEdit?.wasWishlist || (status === BookStatus.Wishlist)),
            linkedBookIds,
            tags: selectedTags,
            isLoaned,
            borrowerName: isLoaned ? borrowerName.trim() : undefined,
            loanDate: isLoaned ? loanDate : undefined,
            isDigital,
            historyObservation: (status === BookStatus.Read || status === BookStatus.Dropped) ? historyObservation : undefined
        };
        if (isEditMode) {
            await onUpdateBook({ ...bookToEdit, ...bookData });
        } else {
            await onAddBook(bookData);
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGenerateSummary = useCallback(async () => {
    if (!title || authors.length === 0) return;
    setIsGeneratingSummary(true);
    try {
      const result = await generateBookSummary(title, authors.join(', '));
      if (result) setSummary(result);
    } catch (err) {
      console.error("Erro ao gerar resumo:", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [title, authors]);

  const handleIsbnLookup = async () => {
    if (!isbn.trim()) return;
    setIsIsbnLoading(true);
    try {
        const book = await fetchBookByIsbn(isbn);
        if (book) {
            setTitle(book.title);
            setAuthors(book.authors);
            setPages(book.pageCount);
            setSummary(book.description);
            if (book.categories && book.categories.length > 0) {
                const category = book.categories[0];
                if (!selectedGenres.includes(category)) {
                    setSelectedGenres(prev => [...prev, category]);
                }
            }
            if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
            if (errors.authors) setErrors(prev => ({ ...prev, authors: undefined }));
        } else {
            setErrors(prev => ({ ...prev, title: 'ISBN não encontrado. Verifique os números.' }));
            setTimeout(() => setErrors(prev => ({ ...prev, title: undefined })), 4000);
        }
    } catch (err) {
        console.error("Erro ao buscar ISBN:", err);
    } finally {
        setIsIsbnLoading(false);
    }
  };

  const labelClass = (isRequired: boolean) => 
    `block text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 ml-1 flex items-center gap-1 ${isRequired ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`;

  const SuggestionDropdown = ({ suggestions, show, onSelect, activeIndex }: { suggestions: any[], show: boolean, onSelect: (val: any) => void, activeIndex: number }) => {
    if (!show || suggestions.length === 0) return null;
    return (
      <div className="absolute left-0 right-0 top-full mt-2 z-[60] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        {suggestions.map((suggestion, index) => {
            const isBook = typeof suggestion !== 'string';
            return (
                <button
                    key={index}
                    type="button"
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onClick={() => onSelect(suggestion)}
                    className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors ${activeIndex === index ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                    {isBook ? (
                        <div className="flex flex-col">
                            <span>{(suggestion as Book).title}</span>
                            <span className={`text-[9px] uppercase tracking-widest ${activeIndex === index ? 'text-white/60' : 'text-slate-400'}`}>
                                de {(suggestion as Book).author}
                            </span>
                        </div>
                    ) : suggestion}
                </button>
            );
        })}
      </div>
    );
  };

  const modalTitle = isEditMode ? 'Editar Registro' : (isDuplicating ? 'Duplicar Registro' : 'Novo Registro');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 dark:border-slate-800 transition-transform duration-500 ${isShaking ? 'animate-shake' : ''}`}
        style={{ animation: isShaking ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'none' }}
      >
        <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
            <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight">{modalTitle}</h2>
            <button onClick={onClose} disabled={isSubmitting} className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-all hover:rotate-90 disabled:opacity-30">
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                {!isEditMode && (
                    <div className="md:col-span-2">
                        <label className={labelClass(false)}>Buscar por Código ISBN</label>
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
                )}

                <div className="md:col-span-2 relative" ref={titleRef}>
                    <label className={labelClass(true)}>
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
                      className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl px-5 py-3.5 outline-none transition-all focus:ring-4 focus:ring-primary/5 ${errors.title ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-700 focus:border-primary font-bold'}`} 
                    />
                    <SuggestionDropdown 
                      suggestions={titleSuggestions} 
                      show={showTitleSug} 
                      activeIndex={activeSuggestionIndex}
                      onSelect={(val) => { setTitle(val); setShowTitleSug(false); }} 
                    />
                    {errors.title && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-wide ml-1 animate-in fade-in slide-in-from-top-1">{errors.title}</p>}
                </div>

                <div className="md:col-span-2">
                    <label className={labelClass(true)}>
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
                            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl px-5 py-3.5 outline-none transition-all focus:ring-4 focus:ring-primary/5 ${errors.authors ? 'border-red-400' : 'border-slate-200 dark:border-slate-700 focus:border-primary font-bold'}`} 
                          />
                          <SuggestionDropdown 
                            suggestions={authorSuggestions} 
                            show={showAuthorSug} 
                            activeIndex={activeSuggestionIndex}
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

                <div>
                    <label className={labelClass(false)}>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as BookStatus)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                        <option value={BookStatus.TBR}>{statusConfigs[BookStatus.TBR].label}</option>
                        <option value={BookStatus.Reading}>{statusConfigs[BookStatus.Reading].label}</option>
                        <option value={BookStatus.Read}>{statusConfigs[BookStatus.Read].label}</option>
                        <option value={BookStatus.Wishlist}>{statusConfigs[BookStatus.Wishlist].label}</option>
                        <option value={BookStatus.Dropped}>{statusConfigs[BookStatus.Dropped].label}</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass(false)}>Total de Páginas</label>
                    <input type="number" min="0" value={pages} onFocus={(e) => e.target.select()} onChange={(e) => setPages(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" />
                </div>

                {/* Vínculo de Obras Relacionadas */}
                <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 relative" ref={linkRef}>
                    <label className={labelClass(false)}>Vincular a Outras Obras</label>
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

                {/* Tags Personalizadas */}
                <div className="md:col-span-2">
                    <label className={labelClass(false)}>Atribuir Tags</label>
                    <div className="p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700 rounded-[2rem] space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {profile?.customTags?.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            isSelected 
                                            ? 'bg-emerald-500 text-white border-emerald-500' 
                                            : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                            {(profile?.customTags?.length || 0) === 0 && (
                                <p className="text-[9px] font-bold text-slate-400 uppercase italic">Configure suas tags nas preferências!</p>
                            )}
                        </div>
                    </div>
                </div>

                {(status === BookStatus.Dropped || status === BookStatus.Reading) && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        <label className={labelClass(false)}>Página Atual (Progresso)</label>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className={labelClass(false)}>Valor Estimado (R$)</label>
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
                                <label className={labelClass(false)}>Valor Real Pago (R$)</label>
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
                    <label className={labelClass(false)}>Link de Compra</label>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[2rem] animate-in slide-in-from-top-2 duration-300">
                            <div>
                                <label className={labelClass(true)}>Nome de quem pegou emprestado</label>
                                <input 
                                    type="text" 
                                    value={borrowerName} 
                                    onChange={(e) => setBorrowerName(e.target.value)} 
                                    placeholder="Ex: João Silva"
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                                />
                            </div>
                            <div>
                                <label className={labelClass(true)}>Data do Empréstimo</label>
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

                <div>
                    <label className={labelClass(false)}>Data de Registro</label>
                    <input 
                      type="date" 
                      value={dateAdded} 
                      onChange={(e) => setDateAdded(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                    />
                </div>

                <div>
                    <label className={labelClass(false)}>Tipo de Mídia</label>
                    <select value={type} onChange={(e) => setType(e.target.value as BookType)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300">
                        <option value={BookType.Book}>Livro</option>
                        <option value={BookType.HQ}>HQ</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass(false)}>Formato</label>
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
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className={labelClass(false)}>Data de Conclusão</label>
                      <input 
                        type="date" 
                        value={dateFinished} 
                        onChange={(e) => setDateFinished(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                      />
                    </div>
                    <div>
                      <label className={labelClass(false)}>Dias Gastos</label>
                      <input 
                        type="number" 
                        value={daysToFinish} 
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setDaysToFinish(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold text-slate-700 dark:text-slate-300" 
                      />
                    </div>
                    <div>
                      <label className={labelClass(false)}>Vezes Lido</label>
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
                    <label className={labelClass(true)}>Gêneros <span className="text-red-500">*</span></label>
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
                    <label className={labelClass(false)}>Avaliação (0 a 10)</label>
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
                <label className={labelClass(false)}>Resumo & Sinopse</label>
                <textarea 
                  value={summary} 
                  onChange={(e) => setSummary(e.target.value)} 
                  rows={4} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-[1.5rem] px-5 py-4 outline-none focus:border-primary text-sm leading-relaxed" 
                  placeholder="Descrição da obra..."
                ></textarea>
            </div>

                <div className="space-y-3">
                    <label className={labelClass(false)}>Notas Pessoais</label>
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
                        <label className={labelClass(false)}>Observação do Histórico (O que achou?)</label>
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
