
import React, { useState } from 'react';
import { searchGoogleBooks, mapGoogleToNewBook, type GoogleBookResult } from '../services/googleBooksService';
import { MagnifyingGlassIcon, HeartIcon, XMarkIcon, StarIconFilled, ExternalLinkIcon } from './Icons';
import type { NewBook, Book } from '../types';

interface BookSearchProps {
  onAddWishlist: (book: NewBook) => Promise<void>;
  existingBooks: Book[];
}

export const BookSearch: React.FC<BookSearchProps> = ({ onAddWishlist, existingBooks }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedBook, setSelectedBook] = useState<GoogleBookResult | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const books = await searchGoogleBooks(query);
      setResults(books);
    } finally {
      setIsLoading(false);
    }
  };

  const isAlreadyOnShelf = (title: string, author: string) => {
      return existingBooks.some(b => 
          b.title.toLowerCase() === title.toLowerCase() && 
          b.author.toLowerCase().includes(author.toLowerCase())
      );
  };

  const handleAdd = async (gBook: GoogleBookResult) => {
    const newBook = mapGoogleToNewBook(gBook);
    await onAddWishlist(newBook);
    setAddedIds(prev => new Set(prev).add(gBook.id));
    if (selectedBook?.id === gBook.id) setSelectedBook(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 px-2 sm:px-0">
      <div className="text-center md:text-left">
        <h2 className="text-4xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight italic">Descobrir Novas Obras</h2>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mt-2 ml-1">✦ Busque em milhões de registros globais</p>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <input
          type="text"
          placeholder="Busque por título, autor ou ISBN..."
          value={query}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-5 pl-14 pr-32 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-xl text-lg font-medium"
        />
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 group-focus-within:text-primary transition-colors" />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2.5 top-2.5 bottom-2.5 px-8 rounded-full bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Buscando...' : 'Pesquisar'}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4">
        {results.map((book) => {
          const alreadyInLibrary = isAlreadyOnShelf(book.title, book.authors[0]);
          const recentlyAdded = addedIds.has(book.id);

          return (
            <div 
              key={book.id} 
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-xl group"
            >
              <div className="flex-1 text-center md:text-left cursor-pointer" onClick={() => setSelectedBook(book)}>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                    {book.categories.slice(0, 2).map(cat => (
                        <span key={cat} className="text-[9px] font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded-md">
                            {cat}
                        </span>
                    ))}
                    {book.pageCount > 0 && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {book.pageCount} págs
                        </span>
                    )}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 leading-tight font-serif italic mb-1 group-hover:text-primary transition-colors decoration-primary/30 decoration-2 underline-offset-4 hover:underline">
                  {book.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                  {book.authors.join(', ')}
                </p>
                {book.description && (
                  <p className="text-xs text-slate-400 dark:text-slate-600 line-clamp-2 mt-3 leading-relaxed">
                    {book.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full md:w-48">
                {alreadyInLibrary ? (
                    <div className="w-full px-6 py-3 text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl text-center">
                        Já na Estante
                    </div>
                ) : recentlyAdded ? (
                    <div className="w-full px-6 py-3 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 border border-primary/20 rounded-xl text-center animate-in fade-in zoom-in">
                        Adicionado!
                    </div>
                ) : (
                    <button
                        onClick={() => handleAdd(book)}
                        className="w-full px-6 py-3.5 text-[10px] font-black uppercase tracking-widest bg-primary text-white rounded-xl shadow-lg hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <HeartIcon className="h-4 w-4" />
                        Aos Desejos
                    </button>
                )}
              </div>
            </div>
          );
        })}

        {!isLoading && query && results.length === 0 && (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <MagnifyingGlassIcon className="h-12 w-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Nenhum livro encontrado para sua busca.</p>
          </div>
        )}
      </div>

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedBook(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            
            <div className="p-6 sm:p-8 flex justify-between items-start border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1 pr-8">
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedBook.categories.map(cat => (
                    <span key={cat} className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                      {cat}
                    </span>
                  ))}
                </div>
                <h2 className="text-3xl font-black font-serif italic text-slate-900 dark:text-white leading-tight mb-2">
                  {selectedBook.title}
                </h2>
                <p className="text-lg font-bold text-slate-500 dark:text-slate-400">
                  {selectedBook.authors.join(', ')}
                </p>
              </div>
              <button onClick={() => setSelectedBook(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <XMarkIcon className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Páginas</p>
                  <p className="font-bold dark:text-slate-200">{selectedBook.pageCount || '--'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Publicado</p>
                  <p className="font-bold dark:text-slate-200">{selectedBook.publishedDate?.split('-')[0] || '--'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avaliação</p>
                  <div className="flex items-center gap-1">
                    <p className="font-bold dark:text-slate-200">{selectedBook.averageRating || '--'}</p>
                    <StarIconFilled className="h-3 w-3 text-amber-400" />
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reviews</p>
                  <p className="font-bold dark:text-slate-200">{selectedBook.ratingsCount || '0'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-8 h-px bg-slate-200 dark:bg-slate-800"></span>
                  Sinopse Completa
                  <span className="w-full h-px bg-slate-200 dark:bg-slate-800"></span>
                </h4>
                <div 
                  className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-4"
                  dangerouslySetInnerHTML={{ __html: selectedBook.description || 'Nenhuma descrição disponível.' }}
                />
              </div>

              {selectedBook.publisher && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Editora: <span className="text-slate-600 dark:text-slate-300 ml-1">{selectedBook.publisher}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
              {selectedBook.previewLink && (
                <a 
                  href={selectedBook.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-8 py-4 text-[11px] font-black rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  Ver Prévia
                </a>
              )}
              {isAlreadyOnShelf(selectedBook.title, selectedBook.authors[0]) ? (
                <div className="flex-[2] py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                  Já está na sua estante
                </div>
              ) : addedIds.has(selectedBook.id) ? (
                <div className="flex-[2] py-4 bg-primary/5 text-primary rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center border border-primary/20">
                  Adicionado com sucesso!
                </div>
              ) : (
                <button
                  onClick={() => handleAdd(selectedBook)}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <HeartIcon className="h-4 w-4" />
                  Adicionar aos Desejos
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
