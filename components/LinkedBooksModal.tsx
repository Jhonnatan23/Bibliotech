
import React from 'react';
import type { Book } from '../types';
import { XMarkIcon, Square2StackIcon, BookOpenIcon } from './Icons';

interface LinkedBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentBook: Book;
  allBooks: Book[];
  onNavigateToBook: (book: Book) => void;
}

export const LinkedBooksModal: React.FC<LinkedBooksModalProps> = ({
  isOpen,
  onClose,
  parentBook,
  allBooks,
  onNavigateToBook,
}) => {
  if (!isOpen) return null;

  const linkedBooks = allBooks.filter(b => 
    (parentBook.linkedBookIds?.includes(b.id)) || 
    (b.linkedBookIds?.includes(parentBook.id))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 dark:border-slate-800 animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                    <Square2StackIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-black font-serif italic text-slate-900 dark:text-white leading-tight">
                        Conexões
                    </h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Vínculos de "{parentBook.title}"
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-all">
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {linkedBooks.length > 0 ? (
                linkedBooks.map(linkedBook => (
                    <button
                        key={linkedBook.id}
                        onClick={() => {
                            onNavigateToBook(linkedBook);
                            onClose();
                        }}
                        className="w-full group p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-left hover:border-primary hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-4 active:scale-95"
                    >
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-slate-100 dark:border-slate-800">
                            <BookOpenIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate font-serif italic group-hover:text-primary transition-colors">{linkedBook.title}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase truncate">de {linkedBook.author}</p>
                        </div>
                        <div className="text-slate-300 group-hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>
                    </button>
                ))
            ) : (
                <div className="py-10 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Nenhum vínculo encontrado.</p>
                </div>
            )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
            <button 
                onClick={onClose}
                className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};
