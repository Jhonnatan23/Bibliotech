import React, { useMemo, useState, useEffect } from 'react';
import { Book, BookStatus } from '../types';
import { STATUS_CONFIGS, STATUS_COLORS } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ShelfViewProps {
  books: Book[];
  onViewDetails?: (book: Book) => void;
}

// Deterministic cover colors and styles for spines
const getBookSpineStyle = (title: string, genre: string) => {
  const colors = [
    { 
      bg: 'from-amber-900 to-amber-950 text-amber-100 border-amber-800/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-amber-400/20', 
      foil: 'text-amber-300/90',
      badge: 'bg-amber-400'
    },
    { 
      bg: 'from-emerald-850 to-emerald-950 text-emerald-100 border-emerald-700/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-emerald-400/20', 
      foil: 'text-emerald-300/80',
      badge: 'bg-emerald-400'
    },
    { 
      bg: 'from-indigo-950 to-slate-950 text-indigo-100 border-indigo-900/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-indigo-400/30', 
      foil: 'text-indigo-300/95',
      badge: 'bg-indigo-400'
    },
    { 
      bg: 'from-rose-900 to-rose-950 text-rose-100 border-rose-800/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-rose-400/20', 
      foil: 'text-amber-200/90',
      badge: 'bg-rose-400'
    },
    { 
      bg: 'from-stone-800 to-stone-950 text-stone-100 border-stone-700/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-stone-600/30', 
      foil: 'text-slate-300/90',
      badge: 'bg-stone-400'
    },
    { 
      bg: 'from-violet-900 to-violet-950 text-violet-100 border-violet-800/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-violet-400/20', 
      foil: 'text-yellow-400/80',
      badge: 'bg-violet-400'
    },
    { 
      bg: 'from-amber-700 to-amber-900 text-amber-50 border-amber-600/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-amber-300/20', 
      foil: 'text-amber-100/90',
      badge: 'bg-amber-300'
    },
    { 
      bg: 'from-cyan-900 to-slate-900 text-cyan-100 border-cyan-800/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-cyan-400/25', 
      foil: 'text-cyan-200/95',
      badge: 'bg-cyan-400'
    },
    { 
      bg: 'from-red-950 to-stone-950 text-red-100 border-red-900/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-red-400/20', 
      foil: 'text-amber-300/80',
      badge: 'bg-red-400'
    },
    { 
      bg: 'from-teal-900 to-teal-950 text-teal-50 border-teal-800/40 shadow-[4px_4px_8px_rgba(0,0,0,0.35)]', 
      accent: 'border-teal-400/20', 
      foil: 'text-teal-200/90',
      badge: 'bg-teal-400'
    },
  ];
  let hash = 0;
  const combined = title + genre;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const ShelfView: React.FC<ShelfViewProps> = React.memo(({ books, onViewDetails }) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive book count per shelf (can fit many more since it's spines!)
  const booksPerShelf = useMemo(() => {
    if (windowWidth < 480) return 6;   // Small mobile
    if (windowWidth < 640) return 8;   // Mobile
    if (windowWidth < 768) return 10;  // Large mobile/tablet
    if (windowWidth < 1024) return 13; // Tablets
    if (windowWidth < 1280) return 18; // Laptops
    if (windowWidth < 1536) return 22; // Large desktops
    return 26;                         // Ultra-wide screens
  }, [windowWidth]);

  // Group books onto individual shelves
  const shelves = useMemo(() => {
    const chunks: Book[][] = [];
    for (let i = 0; i < books.length; i += booksPerShelf) {
      chunks.push(books.slice(i, i + booksPerShelf));
    }
    return chunks;
  }, [books, booksPerShelf]);

  return (
    <div className="w-full space-y-16 py-6 animate-in fade-in duration-500">
      {shelves.length > 0 ? (
        shelves.map((shelfBooks, shelfIdx) => (
          <div key={shelfIdx} className="relative pt-8 pb-3 select-none">
            
            {/* The books container positioned standing side-by-side on the shelf */}
            <div className="flex justify-center items-end px-2 sm:px-6 pb-2 min-h-[190px] sm:min-h-[250px] relative z-10 gap-1 sm:gap-1.5">
              {shelfBooks.map(book => {
                const style = getBookSpineStyle(book.title, book.genre);
                
                // Deterministic variance for height and spine thickness
                let seed = book.title.length + (book.pages || 150);
                const heightVariance = (seed % 16) - 8; // -8px to +8px height difference
                const rotationVariance = ((seed % 6) - 3) * 0.3; // -0.9deg to +0.9deg slant
                
                // Spine thickness/width based on pages count
                const baseSpineWidth = windowWidth < 640 ? 20 : 30;
                const pageThickness = book.pages ? Math.min(18, Math.max(4, Math.round(book.pages / 30))) : 8;
                const finalWidth = baseSpineWidth + (windowWidth < 640 ? pageThickness * 0.6 : pageThickness);
                
                // Spine height
                const baseSpineHeight = windowWidth < 640 ? 125 : 180;
                const finalHeight = baseSpineHeight + heightVariance;
                
                const isHovered = hoveredBookId === book.id;
                
                // Reading progress calculation
                const progressPercentage = book.pages > 0 && book.currentPage !== undefined 
                  ? Math.min(Math.round((book.currentPage / book.pages) * 100), 100) 
                  : 0;

                const statusCfg = STATUS_CONFIGS[book.status];
                const badgeStyle = STATUS_COLORS[statusCfg.color as keyof typeof STATUS_COLORS];

                return (
                  <div
                    key={book.id}
                    className="relative flex justify-center items-end"
                    onMouseEnter={() => setHoveredBookId(book.id)}
                    onMouseLeave={() => setHoveredBookId(null)}
                    style={{ width: `${finalWidth}px` }}
                  >
                    
                    {/* Hover Tooltip / Detail Card */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: -15, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-full mb-4 z-40 w-56 sm:w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 text-left cursor-default pointer-events-none"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                                {statusCfg.label}
                              </span>
                              {book.rating !== undefined && book.status === BookStatus.Read && (
                                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md text-[8px] font-black">
                                  ★ {book.rating.toFixed(1)}
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="font-serif font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm line-clamp-2 leading-snug">
                                {book.title}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                {book.author}
                              </p>
                            </div>

                            {/* Vol / Series */}
                            {book.series && (
                              <div className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 py-0.5 px-2 rounded-lg inline-block">
                                {book.series} {book.volume ? `#${book.volume}` : ''}
                              </div>
                            )}

                            {/* Pages & Reading Progress */}
                            {book.status === BookStatus.Reading && (
                              <div className="space-y-1 pt-1 border-t border-slate-50 dark:border-slate-800/60">
                                <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                  <span>Progresso</span>
                                  <span className="text-primary">{progressPercentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-primary h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${progressPercentage}%` }}
                                  />
                                </div>
                                <div className="text-[8px] text-right text-slate-400">
                                  {book.currentPage} de {book.pages} páginas
                                </div>
                              </div>
                            )}

                            {book.status !== BookStatus.Reading && (
                              <div className="text-[9px] font-bold text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-800/60 flex justify-between">
                                <span>{book.type}</span>
                                <span>{book.pages} páginas</span>
                              </div>
                            )}

                            {book.summary && (
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 italic line-clamp-2 border-t border-slate-50 dark:border-slate-800/60 pt-1">
                                "{book.summary}"
                              </p>
                            )}

                            <div className="text-[7px] font-black uppercase text-center text-slate-300 dark:text-slate-600 tracking-widest pt-1.5 border-t border-slate-50 dark:border-slate-800/40">
                              Clique para ver detalhes
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* BOOK SPINE CONTAINER */}
                    <div
                      onClick={() => onViewDetails?.(book)}
                      className={`relative bg-gradient-to-b ${style.bg} border border-black/15 dark:border-slate-950/40 rounded-sm cursor-pointer transition-all duration-300 origin-bottom select-none overflow-hidden`}
                      style={{
                        height: `${finalHeight}px`,
                        width: `${finalWidth}px`,
                        transform: isHovered 
                          ? 'translateY(-10px) scale(1.05) rotate(0deg)' 
                          : `translateY(0px) scale(1) rotate(${rotationVariance}deg)`,
                        zIndex: isHovered ? 30 : 10,
                        boxShadow: isHovered 
                          ? '0 10px 25px -5px rgba(255, 255, 255, 0.15), 12px 16px 28px rgba(0,0,0,0.5), -4px 0px 10px rgba(0,0,0,0.15)' 
                          : '4px 6px 12px rgba(0,0,0,0.25), -2px 0px 4px rgba(0,0,0,0.08)',
                      }}
                    >
                      {/* Dynamic Soft Shine Sweep on Hover */}
                      <div 
                        className="absolute inset-0 pointer-events-none z-26 transition-all duration-1000 ease-out"
                        style={{
                          background: 'linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.45) 50%, transparent 65%)',
                          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
                          width: '200%',
                          left: '-50%',
                        }}
                      />

                      {/* Cylindrical shading simulating spine curve */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-white/10 to-black/55 pointer-events-none z-25" />

                      {/* Spine Ribs / Raised nervuras (Horizontal ridges) */}
                      <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex flex-col justify-between py-5 z-20">
                        <div className="h-[3px] bg-black/35 border-t border-black/40 border-b border-white/10 shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
                        <div className="h-[3px] bg-black/35 border-t border-black/40 border-b border-white/10 shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
                        <div className="h-[3px] bg-black/35 border-t border-black/40 border-b border-white/10 shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
                        <div className="h-[3px] bg-black/35 border-t border-black/40 border-b border-white/10 shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
                      </div>

                      {/* Foil borders at top and bottom */}
                      <div className="absolute top-2 inset-x-1.5 h-[1.5px] bg-gradient-to-r from-yellow-500/20 via-yellow-400/80 to-yellow-500/20 opacity-70 pointer-events-none z-20" />
                      <div className="absolute bottom-2 inset-x-1.5 h-[1.5px] bg-gradient-to-r from-yellow-500/20 via-yellow-400/80 to-yellow-500/20 opacity-70 pointer-events-none z-20" />

                      {/* Spine Content Layer */}
                      <div className="absolute inset-y-3.5 inset-x-1 flex flex-col items-center justify-between z-20 text-center select-none">
                        
                        {/* Upper Decoration / Code */}
                        <div className="text-[6.5px] sm:text-[8px] font-black uppercase tracking-wider opacity-60 leading-none">
                          {book.type === 'HQ' ? 'HQ' : 'VOL'}
                        </div>

                        {/* ROTATED SPINE TITLE TEXT */}
                        <div 
                          className="flex-1 flex items-center justify-center overflow-hidden my-2.5 max-h-[70%] max-w-[85%] mx-auto"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          <span className={`font-serif font-extrabold tracking-wide text-center leading-none text-white/95 text-[9px] sm:text-[11.5px] uppercase truncate max-h-[110px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]`}>
                            {book.title}
                          </span>
                        </div>

                        {/* Author Short Tag & Vol (Only shown if book is wide enough) */}
                        {finalWidth >= (windowWidth < 640 ? 23 : 33) && (
                          <div className="text-[6px] sm:text-[7.5px] font-bold tracking-widest uppercase opacity-75 leading-none mb-1.5 truncate max-w-full">
                            {book.author.split(' ')[0]}
                          </div>
                        )}

                        {/* Volume Identifier */}
                        {book.volume && (
                          <div className="text-[7px] sm:text-[9px] font-black text-amber-300/90 leading-none mb-1 shadow-sm">
                            #{book.volume}
                          </div>
                        )}

                        {/* Status Dots at very bottom */}
                        <div className="flex items-center justify-center gap-0.5 mt-0.5">
                          {book.status === BookStatus.Read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                          )}
                          {book.status === BookStatus.Reading && (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_4px_#38bdf8]" />
                          )}
                          {book.status === BookStatus.TBR && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#fbbf24]" />
                          )}
                        </div>

                      </div>

                      {/* Paper edge simulated reflection (slight bright vertical line on extreme left) */}
                      <div className="absolute inset-y-0 left-0.5 w-[0.5px] bg-white/15 pointer-events-none z-30" />
                      
                    </div>

                  </div>
                );
              })}
            </div>

            {/* SKEUOMORPHIC WOODEN SHELF BOARD */}
            {/* Wooden top surface */}
            <div className="relative h-6 w-full bg-gradient-to-r from-amber-900 via-amber-700/90 to-amber-950 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.35)] border-t border-white/10 z-0">
              {/* Soft light reflection line on the top surface of the shelf */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-white/20" />
              {/* Soft wooden planks borders details */}
              <div className="absolute inset-y-0 left-1/3 w-px bg-black/15" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-black/15" />
            </div>

            {/* Wooden front bevel edge with deep dropshadow */}
            <div className="h-3.5 w-full bg-gradient-to-r from-amber-950 via-amber-850 to-stone-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-1000 rounded-b-md shadow-[0_12px_24px_rgba(0,0,0,0.6),_0_3px_6px_rgba(0,0,0,0.3)] z-0" />

          </div>
        ))
      ) : (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-200 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 font-serif">Sua estante virtual está vazia</h3>
          <p className="text-slate-400 dark:text-slate-500 mt-2 max-w-xs mx-auto text-sm">Use o botão de adicionar para cadastrar seus primeiros livros!</p>
        </div>
      )}
    </div>
  );
});
