import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { NewBook, Book, Profile } from '../types';
import { BookStatus, BookType } from '../types';
import { generateBookSummary } from '../services/geminiService';
import { fetchBookByIsbn } from '../services/googleBooksService';
import { dbService } from '../services/database';
import { parseNotesField, serializeNotesField } from '../components/quickNotesUtils';

export interface FormErrors {
  title?: string;
  authors?: string;
  genre?: string;
  volume?: string;
}

interface UseBookFormProps {
  onClose: () => void;
  onAddBook: (book: NewBook) => Promise<void>;
  onUpdateBook: (book: Book) => Promise<void>;
  bookToEdit?: Book | null;
  isDuplicating?: boolean;
  defaultStatus?: BookStatus;
  existingBooks: Book[];
  profile: Profile | null;
}

export const useBookForm = ({
  onClose,
  onAddBook,
  onUpdateBook,
  bookToEdit,
  isDuplicating = false,
  defaultStatus,
  existingBooks,
  profile
}: UseBookFormProps) => {
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
  const [notes, setNotes] = useState(isDuplicating ? '' : parseNotesField(bookToEdit?.notes).generalNotes);
  const [estimatedPrice, setEstimatedPrice] = useState(bookToEdit?.estimatedPrice?.toString() || '');
  const [pricePaid, setPricePaid] = useState(isDuplicating ? '' : (bookToEdit?.pricePaid?.toString() || ''));
  const [buyLink, setBuyLink] = useState(bookToEdit?.buyLink || '');
  const [linkedBookIds, setLinkedBookIds] = useState<string[]>(bookToEdit?.linkedBookIds || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(bookToEdit?.tags || []);
  const [isLoaned, setIsLoaned] = useState<boolean>(bookToEdit?.isLoaned || false);
  const [borrowerName, setBorrowerName] = useState(bookToEdit?.borrowerName || '');
  const [loanDate, setLoanDate] = useState(bookToEdit?.loanDate || new Date().toISOString().split('T')[0]);
  const [isDigital, setIsDigital] = useState<boolean>(bookToEdit?.isDigital || false);
  const [series, setSeries] = useState(bookToEdit?.series || '');
  const [volume, setVolume] = useState(bookToEdit?.volume?.toString() || '');
  const [seriesId, setSeriesId] = useState(bookToEdit?.seriesId || '');
  
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
  const [showSeriesSug, setShowSeriesSug] = useState(false);
  const [definedSeries, setDefinedSeries] = useState<any[]>([]);

  const titleRef = useRef<HTMLDivElement>(null);
  const authorRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) setShowTitleSug(false);
      if (authorRef.current && !authorRef.current.contains(event.target as Node)) setShowAuthorSug(false);
      if (linkRef.current && !linkRef.current.contains(event.target as Node)) setShowLinkSuggestions(false);
      if (seriesRef.current && !seriesRef.current.contains(event.target as Node)) setShowSeriesSug(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadSeries = async () => {
        const data = await dbService.getAllSeries();
        setDefinedSeries(data);
    };
    loadSeries();
  }, []);

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

  const addAuthor = useCallback((name?: string) => {
    const val = name || authorInput.trim();
    if (val && !authors.includes(val)) {
      setAuthors(prev => [...prev, val]);
      setAuthorInput('');
      setShowAuthorSug(false);
      if (errors.authors) setErrors(prev => ({ ...prev, authors: undefined }));
    }
  }, [authorInput, authors, errors.authors]);

  const removeAuthor = useCallback((name: string) => {
    setAuthors(prev => prev.filter(a => a !== name));
  }, []);

  const toggleLinkedBook = useCallback((id: string) => {
    setLinkedBookIds(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    setLinkSearch('');
    setShowLinkSuggestions(false);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [errors.title, uniqueTitles]);

  const handleAuthorInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [authors, uniqueAuthors]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, type: 'title' | 'author' | 'link') => {
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
        } else if (type === 'link') {
          toggleLinkedBook((selected as Book).id);
        }
      } else if (e.key === 'Escape') {
        if (type === 'title') setShowTitleSug(false);
        else if (type === 'author') setShowAuthorSug(false);
        else if (type === 'link') setShowLinkSuggestions(false);
      }
    }
  }, [activeSuggestionIndex, authorSuggestions, titleSuggestions, linkableBooks, showAuthorSug, showLinkSuggestions, showTitleSug, addAuthor, toggleLinkedBook]);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
    if (errors.genre) setErrors(prev => ({ ...prev, genre: undefined }));
  }, [errors.genre]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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

    // Validations for Collection & Editions
    const trimmedSeries = series.trim();
    const parsedVolume = volume ? parseInt(volume, 10) : undefined;
    const hasCollection = trimmedSeries !== '' || seriesId !== '';

    if (hasCollection) {
      // RN04 - Vínculo de Item à Coleção:
      if (!volume || volume.trim() === '' || isNaN(parseInt(volume, 10))) {
        newErrors.volume = "O número da edição é obrigatório ao selecionar uma coleção.";
      } else if (parsedVolume !== undefined && parsedVolume < 1) {
        newErrors.volume = "O número da edição deve ser maior ou igual a 1.";
      } else {
        // RN05 - Limite do Número da Edição:
        const matchedSeries = definedSeries.find(s => 
          (seriesId && s.id === seriesId) || 
          (!seriesId && s.name.toLowerCase() === trimmedSeries.toLowerCase())
        );
        if (matchedSeries && matchedSeries.total_volumes !== undefined && matchedSeries.total_volumes !== null) {
          if (parsedVolume !== undefined && parsedVolume > matchedSeries.total_volumes) {
            newErrors.volume = `O número da edição não pode ser maior do que o total de edições da coleção (Máx: ${matchedSeries.total_volumes}).`;
          }
        }

        // RN06 - Unicidade de Volume:
        if (!newErrors.volume) {
          const duplicateVolumeBook = existingBooks.find(b => {
            // Ignore current book in edit mode
            if (isEditMode && b.id === bookToEdit?.id) return false;
            
            const bSeriesId = b.seriesId;
            const bSeriesName = b.series?.trim();
            
            const matchesSeries = (seriesId && bSeriesId === seriesId) || 
                                  (trimmedSeries && bSeriesName?.toLowerCase() === trimmedSeries.toLowerCase());
                                  
            return matchesSeries && b.volume === parsedVolume;
          });
          
          if (duplicateVolumeBook) {
            newErrors.volume = `Já existe um livro cadastrado com o número de edição ${parsedVolume} na coleção "${trimmedSeries || duplicateVolumeBook.series}".`;
          }
        }
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      if (newErrors.volume) {
        alert(newErrors.volume);
      }
      return;
    }

    setIsSubmitting(true);
    try {
        const originalQuickNotes = (!isDuplicating && bookToEdit) ? parseNotesField(bookToEdit.notes).quickNotes : [];
        const finalNotes = serializeNotesField(notes, originalQuickNotes);

        const bookData = { 
            title: trimmedTitle, 
            author: finalAuthors.join(', '), 
            pages, 
            genre: selectedGenres.join(', '), 
            type, 
            status, 
            summary, 
            notes: finalNotes,
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
            series: series.trim() || undefined,
            volume: volume ? parseInt(volume, 10) : undefined,
            seriesId: seriesId || undefined,
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
  }, [
    authors, authorInput, title, selectedGenres, series, volume, seriesId, definedSeries, existingBooks,
    isEditMode, bookToEdit, isDuplicating, notes, pages, type, status, rating, estimatedPrice, pricePaid,
    buyLink, dateAdded, currentPage, dateFinished, daysToFinish, timesRead, linkedBookIds, selectedTags,
    isLoaned, borrowerName, loanDate, isDigital, historyObservation, onUpdateBook, onAddBook, isSubmitting
  ]);

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

  const handleIsbnLookup = useCallback(async () => {
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
            setErrors(prev => ({ ...prev, title: undefined, authors: undefined }));
        } else {
            setErrors(prev => ({ ...prev, title: 'ISBN não encontrado. Verifique os números.' }));
            setTimeout(() => setErrors(prev => ({ ...prev, title: undefined })), 4000);
        }
    } catch (err) {
        console.error("Erro ao buscar ISBN:", err);
    } finally {
        setIsIsbnLoading(false);
    }
  }, [isbn, selectedGenres]);

  return {
    isEditMode,
    title, setTitle,
    isbn, setIsbn,
    isIsbnLoading,
    authors, setAuthors,
    authorInput, setAuthorInput,
    pages, setPages,
    currentPage, setCurrentPage,
    selectedGenres, setSelectedGenres,
    type, setType,
    status, setStatus,
    rating, setRating,
    summary, setSummary,
    notes, setNotes,
    estimatedPrice, setEstimatedPrice,
    pricePaid, setPricePaid,
    buyLink, setBuyLink,
    linkedBookIds, setLinkedBookIds,
    selectedTags, setSelectedTags,
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
    errors, setErrors,
    isShaking, setIsShaking,
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
  };
};
