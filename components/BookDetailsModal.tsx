
import React, { useMemo, useState } from 'react';
import type { Book, StatusConfigs, Profile } from '../types';
import { BookStatus, STATUS_COLORS, STATUS_CONFIGS } from '../types';
import { XMarkIcon, StarIconFilled, ExternalLinkIcon, BookOpenIcon, TagIcon, PlusIcon } from './Icons';

interface BookDetailsModalProps {
  book: Book;
  allBooks: Book[];
  onClose: () => void;
  onNavigateToBook: (book: Book) => void;
  statusConfigs?: StatusConfigs;
  profile: Profile | null;
  onUpdateBook: (book: Book) => Promise<void>;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({ 
  book, 
  allBooks, 
  onClose, 
  onNavigateToBook,
  statusConfigs = STATUS_CONFIGS,
  profile,
  onUpdateBook
}) => {
  const config = statusConfigs[book.status];
  const colorStyles = STATUS_COLORS[config.color as keyof typeof STATUS_COLORS];
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const linkedBooks = useMemo(() => {
    return allBooks.filter(b => 
        (book.linkedBookIds?.includes(b.id)) || 
        (b.linkedBookIds?.includes(book.id))
    );
  }, [book.id, book.linkedBookIds, allBooks]);

  const toggleTag = async (tag: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
        const currentTags = book.tags || [];
        const newTags = currentTags.includes(tag) 
            ? currentTags.filter(t => t !== tag) 
            : [...currentTags, tag];
        
        await onUpdateBook({ ...book, tags: newTags });
    } catch (err) {
        console.error(err);
    } finally {
        setIsUpdating(false);
    }
  };

  const genresList = book.genre ? book.genre.split(',').map(g => g.trim()).filter(g => g !== '') : [];
  const authorsList = book.author ? book.author.split(',').map(a => a.trim()).filter(a => a !== '') : [];
  const currentBookTags = book.tags || [];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-white/20 dark:border-slate-800 max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colorStyles.bg} ${colorStyles.text} ${colorStyles.border}`}>
                        {config.label}
                    </span>
                    <span className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-slate-100 dark:bg-slate-800 text-slate-400">
                        {book.type}
                    </span>
                </div>
                <h2 className="text-3xl font-black font-serif italic text-slate-900 dark:text-white leading-tight">
                    {book.title}
                </h2>
                <p className="text-lg font-bold text-slate-400 dark:text-slate-500 mt-1">
                    de {authorsList.join(', ')}
                </p>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-all hover:rotate-90">
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
            {/* Métricas Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Páginas</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-200">{book.pages}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avaliação</p>
                    <div className="flex items-center gap-1.5">
                        <p className="text-xl font-black text-amber-500">{book.rating || '--'}</p>
                        <StarIconFilled className="h-4 w-4 text-amber-500" />
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{config.label}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lido</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-200">{book.timesRead || 0}x</p>
                </div>
            </div>

            {/* Tags e Gêneros */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <TagIcon className="h-4 w-4" /> Tags e Categorias
                    </h3>
                    <button 
                        onClick={() => setShowTagSelector(!showTagSelector)}
                        className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                    >
                        <PlusIcon className="h-3 w-3" /> Gerenciar Tags
                    </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {genresList.map(g => (
                        <span key={g} className="bg-primary/5 dark:bg-primary/10 border border-primary/10 text-primary text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl">
                            {g}
                        </span>
                    ))}
                    {currentBookTags.map(tag => (
                        <span key={tag} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl flex items-center gap-2">
                            <TagIcon className="h-3 w-3" /> {tag}
                        </span>
                    ))}
                    {currentBookTags.length === 0 && !showTagSelector && (
                        <p className="text-[10px] font-bold text-slate-300 italic uppercase tracking-widest ml-1">Nenhuma tag atribuída.</p>
                    )}
                </div>

                {showTagSelector && (
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Selecione suas tags customizadas:</p>
                        <div className="flex flex-wrap gap-2">
                            {profile?.customTags?.map(tag => {
                                const isSelected = currentBookTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        disabled={isUpdating}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            isSelected 
                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
                                            : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                            {(profile?.customTags?.length || 0) === 0 && (
                                <p className="text-[9px] font-bold text-slate-400 uppercase italic">Crie tags nas configurações primeiro!</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Resumo */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                    <BookOpenIcon className="h-4 w-4" /> Resumo & Sinopse
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic font-medium">
                    {book.summary || "Nenhuma sinopse cadastrada para esta obra."}
                </p>
            </div>

            {/* Notas Pessoais */}
            {book.notes && (
                <div className="space-y-4 p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50">
                    <h3 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em]">Notas Pessoais</h3>
                    <p className="text-sm text-amber-700/80 dark:text-amber-400/80 font-medium whitespace-pre-wrap">
                        {book.notes}
                    </p>
                </div>
            )}

            {/* Vínculos Literários */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg> Obras Relacionadas
                </h3>
                {linkedBooks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {linkedBooks.map(linkedBook => (
                            <button
                                key={linkedBook.id}
                                onClick={() => onNavigateToBook(linkedBook)}
                                className="group p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-left hover:border-primary transition-all shadow-sm flex items-center gap-4 active:scale-95"
                            >
                                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <BookOpenIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-900 dark:text-white truncate font-serif italic">{linkedBook.title}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate">de {linkedBook.author}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic ml-1">Nenhum vínculo registrado.</p>
                )}
            </div>
        </div>

        <div className="p-7 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            {book.buyLink && (
                <a 
                    href={book.buyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all shadow-lg"
                >
                    Link de Compra <ExternalLinkIcon className="h-4 w-4" />
                </a>
            )}
            <button 
                onClick={onClose}
                className="px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};
