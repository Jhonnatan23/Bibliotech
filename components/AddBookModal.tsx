
import React, { useState, useCallback, useMemo } from 'react';
import type { NewBook, Book, StatusConfigs } from '../types';
// Fixed: Added STATUS_CONFIGS to imports
import { BookStatus, BookType, GENRES, STATUS_CONFIGS } from '../types';
import { XMarkIcon, BookOpenIcon } from './Icons';
import { generateBookSummary, generateBookCover } from '../services/geminiService';

interface AddBookModalProps {
  onClose: () => void;
  onAddBook: (book: NewBook) => void;
  onUpdateBook: (book: Book) => void;
  bookToEdit?: Book | null;
  defaultStatus?: BookStatus;
  existingBooks: Book[];
  // Fixed: Made statusConfigs optional
  statusConfigs?: StatusConfigs;
}

interface FormErrors {
  title?: string;
  author?: string;
  genre?: string;
}

// Fixed: Provided default value for statusConfigs using STATUS_CONFIGS
export const AddBookModal: React.FC<AddBookModalProps> = ({ onClose, onAddBook, onUpdateBook, bookToEdit, defaultStatus, existingBooks, statusConfigs = STATUS_CONFIGS }) => {
  const isEditMode = !!bookToEdit;

  const [title, setTitle] = useState(bookToEdit?.title || '');
  const [author, setAuthor] = useState(bookToEdit?.author || '');
  const [pages, setPages] = useState(bookToEdit?.pages || 0);
  
  // Estado de gênero agora é um array para suportar múltiplos
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    bookToEdit?.genre ? bookToEdit.genre.split(',').map(g => g.trim()).filter(g => g !== '') : []
  );
  
  const [type, setType] = useState<BookType>(bookToEdit?.type || BookType.Book);
  const [status, setStatus] = useState<BookStatus>(bookToEdit?.status || defaultStatus || BookStatus.TBR);
  const [rating, setRating] = useState(bookToEdit?.rating?.toString() || '');
  const [summary, setSummary] = useState(bookToEdit?.summary || '');
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(bookToEdit?.coverImageUrl);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [dateAdded] = useState(bookToEdit?.dateAdded || new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<FormErrors>({});

  const toggleGenre = (genreName: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreName) 
        ? prev.filter(g => g !== genreName) 
        : [...prev, genreName]
    );
    if (errors.genre) setErrors({ ...errors, genre: undefined });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = "O título é obrigatório";
    if (!author.trim()) newErrors.author = "O autor é obrigatório";
    if (selectedGenres.length === 0) newErrors.genre = "Selecione ao menos um gênero";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const bookData = { 
        title: title.trim(), 
        author: author.trim(), 
        pages, 
        genre: selectedGenres.join(', '), // Salva como string separada por vírgula
        type, 
        status, 
        summary, 
        rating: rating ? parseInt(rating, 10) : undefined,
        coverImageUrl, 
        dateAdded
    };

    if (isEditMode) onUpdateBook({ ...bookToEdit, ...bookData });
    else onAddBook(bookData);
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

  const labelClass = "block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-bold font-serif text-slate-900">{isEditMode ? 'Editar Livro' : 'Novo Livro'}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className={labelClass}>Título</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary/10 ${errors.title ? 'border-red-500' : 'border-slate-200 focus:border-primary'}`} />
                    {errors.title && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{errors.title}</p>}
                </div>
                <div>
                    <label className={labelClass}>Autor</label>
                    <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary/10 ${errors.author ? 'border-red-500' : 'border-slate-200 focus:border-primary'}`} />
                    {errors.author && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{errors.author}</p>}
                </div>
                <div>
                    <label className={labelClass}>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as BookStatus)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary">
                        <option value={BookStatus.TBR}>{statusConfigs[BookStatus.TBR].label}</option>
                        <option value={BookStatus.Reading}>{statusConfigs[BookStatus.Reading].label}</option>
                        <option value={BookStatus.Read}>{statusConfigs[BookStatus.Read].label}</option>
                        <option value={BookStatus.Wishlist}>{statusConfigs[BookStatus.Wishlist].label}</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className={labelClass}>Gêneros (Selecione um ou mais)</label>
                    <div className={`p-4 bg-slate-50 border rounded-2xl transition-all ${errors.genre ? 'border-red-500' : 'border-slate-200'}`}>
                        {/* Tags Selecionadas */}
                        <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                            {selectedGenres.length > 0 ? (
                                selectedGenres.map(g => (
                                    <span key={g} className="bg-primary text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm animate-in fade-in zoom-in duration-200">
                                        {g}
                                        <button type="button" onClick={() => toggleGenre(g)} className="hover:text-blue-200 transition-colors">
                                            <XMarkIcon className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-400 text-xs italic">Nenhum gênero selecionado...</span>
                            )}
                        </div>
                        
                        {/* Grade de Opções */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200/60 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {GENRES.map(g => {
                                const isSelected = selectedGenres.includes(g);
                                return (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => toggleGenre(g)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                            isSelected 
                                                ? 'bg-primary/10 text-primary border border-primary/20 scale-95' 
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/40 hover:bg-slate-50'
                                        }`}
                                    >
                                        {isSelected ? '✓ ' : '+ '}{g}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {errors.genre && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{errors.genre}</p>}
                </div>

                <div>
                    <label className={labelClass}>Total de Páginas</label>
                    <input type="number" value={pages} onChange={(e) => setPages(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div>
                    <label className={labelClass}>Tipo de Mídia</label>
                    <select value={type} onChange={(e) => setType(e.target.value as BookType)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none">
                        <option value={BookType.Book}>Livro</option>
                        <option value={BookType.HQ}>HQ</option>
                    </select>
                </div>
            </div>

            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-6">
                <div className="relative group">
                    {coverImageUrl ? (
                        <img src={coverImageUrl} alt="Capa" className="w-20 h-28 object-cover rounded-xl shadow-md transition-transform group-hover:scale-105"/>
                    ) : (
                        <div className="w-20 h-28 bg-slate-200 rounded-xl flex items-center justify-center">
                            <BookOpenIcon className="h-6 w-6 text-slate-400" />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-800 mb-1">Capa por IA</h4>
                    <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-tight">Gere uma arte baseada no título e gênero</p>
                    <button type="button" onClick={handleGenerateCover} disabled={isGeneratingCover || !title || selectedGenres.length === 0} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-white text-primary border border-blue-200 hover:bg-primary hover:text-white transition-all disabled:opacity-50">
                        {isGeneratingCover ? 'Gerando...' : 'Gerar Arte'}
                    </button>
                </div>
            </div>

            <div>
                <label className={labelClass}>Resumo & Sinopse</label>
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-primary" placeholder="Descreva brevemente a obra..."></textarea>
                <button type="button" onClick={handleGenerateSummary} disabled={isGeneratingSummary || !title || !author} className="mt-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline disabled:opacity-50">
                    {isGeneratingSummary ? 'Processando...' : '✦ Gerar Resumo Inteligente'}
                </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-all">Cancelar</button>
                <button type="submit" className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95">
                    {isEditMode ? 'Salvar Alterações' : 'Salvar Livro'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
