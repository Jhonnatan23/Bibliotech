
import React, { useMemo } from 'react';
import type { Book } from '../types';
import { BookStatus } from '../types';
import { BookListItem } from './BookListItem';
import { ClockIcon, HeartIcon } from './Icons';

interface LoansViewProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onDuplicate: (book: Book) => void;
  onViewDetails: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({ 
  books, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onViewDetails, 
  onUpdateBook 
}) => {
  const loanedBooks = useMemo(() => {
    return books
      .filter(b => b.isLoaned)
      .sort((a, b) => (b.loanDate || '').localeCompare(a.loanDate || ''));
  }, [books]);

  const handleUpdateStatus = (book: Book, status: BookStatus) => {
    onUpdateBook({ ...book, status });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight italic">Controle de Empréstimos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] mt-1 md:mt-2 ml-1">✦ Acompanhe quem está com suas obras</p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-4 rounded-3xl border border-amber-100 dark:border-amber-800 shadow-sm flex items-center gap-4">
            <div className="bg-amber-500 p-2.5 rounded-2xl shadow-lg shadow-amber-500/20">
                <HeartIcon className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-0.5">Livros Fora</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{loanedBooks.length}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loanedBooks.length > 0 ? (
          loanedBooks.map(book => (
            <div key={book.id} className="relative group/loan">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-amber-500 rounded-full z-10 shadow-lg shadow-amber-500/40" />
              <div className="bg-amber-50/50 dark:bg-amber-900/5 border-amber-100 dark:border-amber-900/20 p-4 rounded-[2rem] mb-2 flex items-center gap-4 transition-all group-hover/loan:bg-amber-50 dark:group-hover/loan:bg-amber-900/10">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-amber-100 dark:border-amber-900/20 text-amber-600">
                    <ClockIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 mb-0.5">Emprestado para:</p>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {book.borrowerName || 'Não informado'} <span className="text-slate-400 font-medium ml-2 text-xs">em {book.loanDate ? new Date(book.loanDate).toLocaleDateString('pt-BR') : 'Data não informada'}</span>
                    </p>
                </div>
              </div>
              <BookListItem 
                book={book} 
                allBooks={books}
                onEdit={onEdit} 
                onDelete={onDelete} 
                onDuplicate={onDuplicate}
                onViewDetails={onViewDetails}
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[3rem] mb-6 shadow-inner">
                <HeartIcon className="h-16 w-16 text-slate-200 dark:text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-serif italic mb-2">Tudo no lugar!</h3>
            <p className="text-slate-400 dark:text-slate-500 max-w-sm font-medium">Nenhum livro está emprestado no momento. Sua estante está completa.</p>
          </div>
        )}
      </div>
    </div>
  );
};
