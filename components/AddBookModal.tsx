
import React, { useState, useCallback } from 'react';
import type { NewBook, Book, StatusConfigs } from '../types';
import { BookStatus, BookType, GENRES, STATUS_CONFIGS } from '../types';
import { XMarkIcon, BookOpenIcon } from './Icons';
import { generateBookSummary, generateBookCover } from '../services/geminiService';

interface AddBookModalProps {
  onClose: () => void;
  onAddBook: (book: NewBook) => Promise<void>;
  onUpdateBook: (book: Book) => Promise<void>;
  bookToEdit?: Book | null;
  defaultStatus?: BookStatus;
  existingBooks: Book[];
  statusConfigs?: StatusConfigs;
}

interface FormErrors {
  title?: string;
  author?: string;
  genre?: string;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({ 
  onClose, 
  onAddBook, 
  onUpdateBook, 
  bookToEdit, 
  defaultStatus, 
  existingBooks, 
  statusConfigs = STATUS_CONFIGS 
}) => {
  const isEditMode = !!bookToEdit;

  const [title, setTitle] = useState(bookToEdit?.title || '');
  const [author, setAuthor] = useState(bookToEdit?.author || '');
  const [pages, setPages] = useState(bookToEdit?.pages || 0);
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    bookToEdit?.genre ? bookToEdit.genre.split(',').map(g => g.trim()).filter(g => g !== '') : []
  );
  
  const [type, setType] = useState<BookType>(bookToEdit?.type || BookType.Book);
  const [status, setStatus] = useState<BookStatus>(bookToEdit?.status || defaultStatus || BookStatus.TBR);
  const [rating, setRating] = useState(bookToEdit?.rating?.toString() || '');
  const [summary, setSummary] = useState(bookToEdit?.summary || '');
  const [estimatedPrice, setEstimatedPrice] = useState(bookToEdit?.estimatedPrice?.toString() || '');
  const [buyLink, setBuyLink] = useState(bookToEdit?.buyLink || '');
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(bookToEdit?.coverImageUrl);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateAdded] = useState(bookToEdit?.dateAdded || new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthor(e.target.value);
    if (errors.author) setErrors(prev => ({ ...prev, author: undefined }));
  };

  const toggleGenre = (genreName: string) => {
    setSelectedGenres(prev => {
      const isSelected = prev.includes(genreName);
      const newList = isSelected 
        ? prev.filter(g => g !== genreName) 
        : [...prev, genreName];
      
      if (newList.length > 0 && errors.genre) {
        setErrors(prevErr => ({ ...prevErr, genre: undefined }));
      }
      return newList;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = "O título é obrigatório";
    if (!author.trim()) newErrors.author = "O autor é obrigatório";
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
            title: title.trim(), 
            author: author.trim(), 
            pages, 
            genre: selectedGenres.join(', '), 
            type, 
            status, 
            summary, 
            rating: rating ? parseInt(rating, 10) : undefined,
            estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
            buyLink: buyLink.trim() || undefined,
            coverImageUrl, 
            dateAdded,
            // Mantém os dados de leitura se for edição
            currentPage: bookToEdit?.currentPage,
            dateStarted: bookToEdit?.dateStarted,
            dateFinished: bookToEdit?.dateFinished
        };

        if (isEditMode) {
            await onUpdateBook({ ...bookToEdit, ...bookData });
        } else {
            await onAddBook(bookData);
        }
    } catch (err) {
        console.error("Submit error:", err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGenerateCover = useCallback(async () => {
    if (!title || selectedGenres.length === 0) return;
    setIsGeneratingCover(true);
    const result = await generateBookCover(title, selectedGenres[0], type);
    setCoverImageUrl(result);
    setIsGeneratingCover(false);
  }, [title, selectedGenres, type]);

  const handleGenerateSummary = useCallback(async () => {
    if (!title || !author) return;
    setIsGeneratingSummary(true);
    const result = await generateBookSummary(title, author);
    setSummary(result);
    setIsGeneratingSummary(false);
  }, [title, author]);

  const labelClass = (isRequired: boolean) => 
    `block text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 ml-1 flex items-center gap-1 ${isRequired ? 'text-slate-500' : 'text-slate-400'}`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 transition-transform duration-500 ${isShaking ? 'animate-shake' : ''}`}
        style={{ animation: isShaking ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'none' }}
      >
        <style>{`
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
        `}</style>
        
        <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">{isEditMode ? 'Editar Registro' : 'Novo Registro'}</h2>
            <button onClick={onClose} disabled={isSubmitting} className="p-2.5 rounded-full hover:bg-slate-200 text-slate-400 transition-all hover:rotate-90 disabled:opacity-30">
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="md:col-span-2">
                    <label className={labelClass(true)}>
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={handleTitleChange} 
                      placeholder="Ex: Cem Anos de Solidão"
                      className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 outline-none transition-all focus:ring-4 focus:ring-primary/5 ${errors.title ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-primary'}`} 
                    />
                    {errors.title && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-wide ml-1">{errors.title}</p>}
                </div>

                <div>
                    <label className={labelClass(true)}>
                      Autor <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={author} 
                      onChange={handleAuthorChange} 
                      placeholder="Ex: Gabriel García Márquez"
                      className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 outline-none transition-all focus:ring-4 focus:ring-primary/5 ${errors.author ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-primary'}`} 
                    />
                    {errors.author && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-wide ml-1">{errors.author}</p>}
                </div>

                <div>
                    <label className={labelClass(false)}>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as BookStatus)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary cursor-pointer font-bold text-slate-700">
                        <option value={BookStatus.TBR}>{statusConfigs[BookStatus.TBR].label}</option>
                        <option value={BookStatus.Reading}>{statusConfigs[BookStatus.Reading].label}</option>
                        <option value={BookStatus.Read}>{statusConfigs[BookStatus.Read].label}</option>
                        <option value={BookStatus.Wishlist}>{statusConfigs[BookStatus.Wishlist].label}</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className={labelClass(true)}>
                      Gêneros <span className="text-red-500">*</span>
                    </label>
                    <div className={`p-5 bg-slate-50/50 border rounded-[2rem] transition-all ${errors.genre ? 'border-red-400 ring-4 ring-red-500/5 bg-red-50/10' : 'border-slate-200'}`}>
                        <div className="flex flex-wrap gap-2.5 mb-5 min-h-[38px]">
                            {selectedGenres.length > 0 ? (
                                selectedGenres.map(g => (
                                    <span key={g} className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-md animate-in fade-in zoom-in duration-300">
                                        {g}
                                        <button type="button" onClick={() => toggleGenre(g)} className="hover:text-blue-200 transition-colors p-0.5">
                                            <XMarkIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-400 text-xs italic ml-1 mt-2">Escolha as categorias da obra...</span>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 pt-5 border-t border-slate-200/60 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {GENRES.map(g => {
                                const isSelected = selectedGenres.includes(g);
                                return (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => toggleGenre(g)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
                                            isSelected 
                                                ? 'bg-primary text-white border border-primary scale-95 shadow-sm' 
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/40 hover:bg-slate-50'
                                        }`}
                                    >
                                        {g}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {errors.genre && <p className="text-[10px] text-red-500 font-bold mt-3 uppercase tracking-wide ml-1">{errors.genre}</p>}
                </div>

                <div>
                    <label className={labelClass(false)}>Total de Páginas</label>
                    <input type="number" min="0" value={pages} onChange={(e) => setPages(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold" />
                </div>
                <div>
                    <label className={labelClass(false)}>Tipo de Mídia</label>
                    <select value={type} onChange={(e) => setType(e.target.value as BookType)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold">
                        <option value={BookType.Book}>Livro</option>
                        <option value={BookType.HQ}>HQ</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass(false)}>Valor Estimado (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={estimatedPrice} 
                      onChange={(e) => setEstimatedPrice(e.target.value)} 
                      placeholder="0,00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold" 
                    />
                </div>
                <div>
                    <label className={labelClass(false)}>Link de Compra</label>
                    <input 
                      type="text" 
                      value={buyLink} 
                      onChange={(e) => setBuyLink(e.target.value)} 
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:border-primary font-bold" 
                    />
                </div>
            </div>

            <div className="p-7 bg-blue-50/40 rounded-[2rem] border border-blue-100 flex flex-col sm:flex-row items-center gap-8 shadow-inner">
                <div className="relative group flex-shrink-0">
                    {coverImageUrl ? (
                        <img src={coverImageUrl} alt="Capa" className="w-24 h-36 object-cover rounded-xl shadow-xl transition-transform group-hover:scale-110 duration-500"/>
                    ) : (
                        <div className="w-24 h-36 bg-slate-200 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                            <BookOpenIcon className="h-8 w-8 text-slate-400" />
                        </div>
                    )}
                </div>
                <div className="text-center sm:text-left">
                    <h4 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">✦ Capa sob Medida</h4>
                    <p className="text-[11px] text-slate-500 mb-5 leading-relaxed font-medium uppercase tracking-tight">Gere uma arte única baseada no título e categorias</p>
                    <button 
                        type="button" 
                        onClick={handleGenerateCover} 
                        disabled={isGeneratingCover || isSubmitting || !title || selectedGenres.length === 0} 
                        className="px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white text-primary border border-blue-200 hover:bg-primary hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {isGeneratingCover ? 'Criando Arte...' : 'Gerar Arte Visual'}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <label className={labelClass(false)}>Resumo & Sinopse</label>
                <div className="relative">
                  <textarea 
                    value={summary} 
                    onChange={(e) => setSummary(e.target.value)} 
                    rows={4} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-5 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 text-sm leading-relaxed text-slate-600 font-medium" 
                    placeholder="Como você descreveria esta jornada?..."
                  ></textarea>
                  <button 
                    type="button" 
                    onClick={handleGenerateSummary} 
                    disabled={isGeneratingSummary || isSubmitting || !title || !author} 
                    className="mt-3 flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.15em] hover:bg-primary/5 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                  >
                      {isGeneratingSummary ? 'Processando...' : '✦ Gerar Resumo com IA'}
                  </button>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={onClose} 
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-2xl text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-30"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-10 py-3.5 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-primary shadow-2xl transition-all active:scale-95 shadow-primary/20 disabled:bg-slate-400 flex items-center gap-3"
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar no Banco')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
