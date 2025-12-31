
import React, { useMemo, useState } from 'react';
import { Book, BookStatus, BookType } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

interface StatsViewProps {
  books: Book[];
  availableYears: number[];
}

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label, prefix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
        <p className="font-black text-slate-900 dark:text-slate-100 mb-3 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 pb-2">{label}</p>
        <div className="space-y-3">
            {payload.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{p.name}</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                        {prefix}{typeof p.value === 'number' ? (p.value % 1 === 0 ? p.value.toLocaleString('pt-BR') : p.value.toFixed(1)) : p.value}
                    </span>
                </div>
            ))}
        </div>
      </div>
    );
  }
  return null;
};

export const StatsView: React.FC<StatsViewProps> = ({ books, availableYears }) => {
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

    const filteredBooks = useMemo(() => {
        if (selectedYear === 'all') return books;
        return books.filter(b => {
            const date = b.dateFinished || b.dateAdded;
            return new Date(date).getFullYear() === selectedYear;
        });
    }, [books, selectedYear]);

    // Dados de evolução por ano
    const evolutionData = useMemo(() => {
        const sortedYears = [...availableYears].sort((a, b) => a - b);
        return sortedYears.map(year => {
            const yearBooks = books.filter(b => {
                const date = b.dateFinished || b.dateAdded;
                return new Date(date).getFullYear() === year && b.status === BookStatus.Read;
            });

            const booksOnly = yearBooks.filter(b => b.type === BookType.Book);
            const hqsOnly = yearBooks.filter(b => b.type === BookType.HQ);

            const pagesBooks = booksOnly.reduce((acc, b) => acc + (b.pages || 0), 0);
            const pagesHQs = hqsOnly.reduce((acc, b) => acc + (b.pages || 0), 0);

            const ratingBooks = booksOnly.filter(b => b.rating !== undefined);
            const ratingHQs = hqsOnly.filter(b => b.rating !== undefined);

            const avgRatingBooks = ratingBooks.length > 0 ? ratingBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / ratingBooks.length : 0;
            const avgRatingHQs = ratingHQs.length > 0 ? ratingHQs.reduce((acc, b) => acc + (b.rating || 0), 0) / ratingHQs.length : 0;

            return {
                year,
                'Páginas Livros': pagesBooks,
                'Páginas HQs': pagesHQs,
                'Nota Livros': avgRatingBooks,
                'Nota HQs': avgRatingHQs
            };
        });
    }, [books, availableYears]);

    const metrics = useMemo(() => {
        // 1. Estante Principal (TBR + Reading + Read)
        const shelfBooks = books.filter(b => b.status !== BookStatus.Wishlist);
        const totalShelf = shelfBooks.length;
        const totalShelfHQ = shelfBooks.filter(b => b.type === BookType.HQ).length;
        const totalShelfBook = shelfBooks.filter(b => b.type === BookType.Book).length;

        // 2. Lidos (Baseado no Filtro de Ano)
        const readBooks = filteredBooks.filter(b => b.status === BookStatus.Read);
        const readTotal = readBooks.length;
        const readHQ = readBooks.filter(b => b.type === BookType.HQ).length;
        const readBook = readBooks.filter(b => b.type === BookType.Book).length;

        // 3. Páginas
        const pagesTotal = readBooks.reduce((acc, b) => acc + (b.pages || 0), 0);
        const pagesHQ = readBooks.filter(b => b.type === BookType.HQ).reduce((acc, b) => acc + (b.pages || 0), 0);
        const pagesBook = readBooks.filter(b => b.type === BookType.Book).reduce((acc, b) => acc + (b.pages || 0), 0);

        // 4. Médias
        const avgPagesTotal = readTotal > 0 ? pagesTotal / readTotal : 0;
        const avgPagesHQ = readHQ > 0 ? pagesHQ / readHQ : 0;
        const avgPagesBook = readBook > 0 ? pagesBook / readBook : 0;

        const booksWithRating = readBooks.filter(b => b.rating !== undefined);
        const avgRatingTotal = booksWithRating.length > 0 ? booksWithRating.reduce((acc, b) => acc + (b.rating || 0), 0) / booksWithRating.length : 0;
        const avgRatingHQ = readBooks.filter(b => b.type === BookType.HQ && b.rating !== undefined).reduce((acc, b) => acc + (b.rating || 0), 0) / (readBooks.filter(b => b.type === BookType.HQ && b.rating !== undefined).length || 1);
        const avgRatingBook = readBooks.filter(b => b.type === BookType.Book && b.rating !== undefined).reduce((acc, b) => acc + (b.rating || 0), 0) / (readBooks.filter(b => b.type === BookType.Book && b.rating !== undefined).length || 1);

        const booksWithTime = readBooks.filter(b => b.daysToFinish !== undefined && b.daysToFinish !== null);
        const avgTimeTotal = booksWithTime.length > 0 ? booksWithTime.reduce((acc, b) => acc + (b.daysToFinish || 0), 0) / booksWithTime.length : 0;
        const avgTimeHQ = readBooks.filter(b => b.type === BookType.HQ && b.daysToFinish).reduce((acc, b) => acc + (b.daysToFinish || 0), 0) / (readBooks.filter(b => b.type === BookType.HQ && b.daysToFinish).length || 1);
        const avgTimeBook = readBooks.filter(b => b.type === BookType.Book && b.daysToFinish).reduce((acc, b) => acc + (b.daysToFinish || 0), 0) / (readBooks.filter(b => b.type === BookType.Book && b.daysToFinish).length || 1);

        // 5. Wishlist
        const wishlistBooks = filteredBooks.filter(b => b.status === BookStatus.Wishlist);
        const wishlistTotal = wishlistBooks.length;
        const wishlistHQ = wishlistBooks.filter(b => b.type === BookType.HQ).length;
        const wishlistBook = wishlistBooks.filter(b => b.type === BookType.Book).length;

        const wishlistValueTotal = wishlistBooks.reduce((acc, b) => acc + (b.estimatedPrice || 0), 0);
        const wishlistValueHQ = wishlistBooks.filter(b => b.type === BookType.HQ).reduce((acc, b) => acc + (b.estimatedPrice || 0), 0);
        const wishlistValueBook = wishlistBooks.filter(b => b.type === BookType.Book).reduce((acc, b) => acc + (b.estimatedPrice || 0), 0);

        // 6. Conversão (Wishlist -> Estante)
        const convertedBooks = filteredBooks.filter(b => b.wasWishlist && b.status !== BookStatus.Wishlist);
        const conversionTotal = convertedBooks.length;
        const conversionHQ = convertedBooks.filter(b => b.type === BookType.HQ).length;
        const conversionBook = convertedBooks.filter(b => b.type === BookType.Book).length;

        return {
            shelf: { total: totalShelf, hq: totalShelfHQ, book: totalShelfBook },
            read: { total: readTotal, hq: readHQ, book: readBook },
            pages: { total: pagesTotal, hq: pagesHQ, book: pagesBook },
            avgPages: { total: avgPagesTotal, hq: avgPagesHQ, book: avgPagesBook },
            avgRating: { total: avgRatingTotal, hq: avgRatingHQ, book: avgRatingBook },
            avgTime: { total: avgTimeTotal, hq: avgTimeHQ, book: avgTimeBook },
            wishlist: { total: wishlistTotal, hq: wishlistHQ, book: wishlistBook },
            wishlistValue: { total: wishlistValueTotal, hq: wishlistValueHQ, book: wishlistValueBook },
            conversion: { total: conversionTotal, hq: conversionHQ, book: conversionBook }
        };
    }, [books, filteredBooks]);

    const typeData = [
        { name: 'Livros', value: metrics.read.book, color: '#2563eb' },
        { name: 'HQs', value: metrics.read.hq, color: '#f59e0b' },
    ];

    const StatCard = ({ title, value, subValues, icon, prefix = '' }: any) => (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-soft transition-all hover:shadow-xl">
            <div className="flex items-center gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-primary">{icon}</div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
            </div>
            <p className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter mb-4">
                {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : value}
            </p>
            <div className="flex gap-4 border-t border-slate-50 dark:border-slate-800 pt-4">
                <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Livros</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{prefix}{subValues.book.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</p>
                </div>
                <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">HQs</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{prefix}{subValues.hq.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black font-serif text-slate-900 dark:text-slate-50 tracking-tight italic">Centro de Inteligência</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mt-2 ml-1">✦ Análise profunda do seu acervo</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Ano:</span>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
                    >
                        <option value="all">Todo o Tempo</option>
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard 
                    title="Total na Estante" 
                    value={metrics.shelf.total} 
                    subValues={{ book: metrics.shelf.book, hq: metrics.shelf.hq }}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
                <StatCard 
                    title="Livros Lidos" 
                    value={metrics.read.total} 
                    subValues={{ book: metrics.read.book, hq: metrics.read.hq }}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard 
                    title="Total de Páginas" 
                    value={metrics.pages.total} 
                    subValues={{ book: metrics.pages.book, hq: metrics.pages.hq }}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Distribuição por Tipo */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft">
                    <h3 className="text-xl font-black font-serif italic mb-8">Composição de Leitura</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={typeData} 
                                    innerRadius={80} 
                                    outerRadius={120} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 flex flex-col items-center min-w-[120px]">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{data.name}</span>
                                                    <span className="text-xl font-black text-slate-900 dark:text-white">{data.value}</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Médias */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col justify-between">
                    <h3 className="text-xl font-black font-serif italic mb-8">Performance Média</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Páginas por Obra</p>
                                <p className="text-2xl font-black">{Math.round(metrics.avgPages.total)}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Book</p>
                                    <p className="text-xs font-bold text-primary">{Math.round(metrics.avgPages.book)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">HQ</p>
                                    <p className="text-xs font-bold text-amber-500">{Math.round(metrics.avgPages.hq)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avaliação Geral</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-black">{metrics.avgRating.total.toFixed(1)}</p>
                                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Book</p>
                                    <p className="text-xs font-bold text-primary">{metrics.avgRating.book.toFixed(1)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">HQ</p>
                                    <p className="text-xs font-bold text-amber-500">{metrics.avgRating.hq.toFixed(1)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tempo de Leitura</p>
                                <p className="text-2xl font-black">{Math.round(metrics.avgTime.total)} <span className="text-xs text-slate-400 font-bold uppercase">Dias</span></p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Book</p>
                                    <p className="text-xs font-bold text-primary">{Math.round(metrics.avgTime.book)}d</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">HQ</p>
                                    <p className="text-xs font-bold text-amber-500">{Math.round(metrics.avgTime.hq)}d</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nova Seção: Evolução Temporal */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Evolução de Páginas Lidas */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft">
                    <div className="mb-8">
                        <h3 className="text-xl font-black font-serif italic">Evolução de Páginas</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">✦ Histórico anual por tipo de obra</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={evolutionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ paddingBottom: '20px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                <Bar dataKey="Páginas Livros" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={20} />
                                <Bar dataKey="Páginas HQs" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Evolução de Notas Médias */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft">
                    <div className="mb-8">
                        <h3 className="text-xl font-black font-serif italic">Evolução de Notas</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">✦ Qualidade média anual por tipo</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evolutionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} domain={[0, 10]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={6} wrapperStyle={{ paddingBottom: '20px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                <Line type="monotone" dataKey="Nota Livros" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Nota HQs" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Wishlist Estatísticas */}
                <div className="bg-gradient-to-br from-pink-50 to-white dark:from-pink-900/10 dark:to-slate-900 p-8 rounded-[2.5rem] border border-pink-100 dark:border-pink-900/20 shadow-soft">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black font-serif italic text-pink-600 dark:text-pink-400">Investimento Wishlist</h3>
                        <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-xl text-pink-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total de Desejos</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{metrics.wishlist.total} <span className="text-xs text-slate-400">obras</span></p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valor Total</p>
                                <p className="text-xl font-black text-emerald-500">R$ {metrics.wishlistValue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valor Livros</p>
                                <p className="text-xl font-black text-slate-700 dark:text-slate-200">R$ {metrics.wishlistValue.book.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversão Wishlist -> Estante */}
                <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-900 p-8 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/20 shadow-soft">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black font-serif italic text-blue-600 dark:text-blue-400">Desejos Realizados</h3>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Movido da Wishlist</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{metrics.conversion.total} <span className="text-xs text-slate-400">obras</span></p>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="flex-1 bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Livros</p>
                                <p className="text-xl font-black text-primary">{metrics.conversion.book}</p>
                            </div>
                            <div className="flex-1 bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">HQs</p>
                                <p className="text-xl font-black text-amber-500">{metrics.conversion.hq}</p>
                            </div>
                        </div>

                        <div className="bg-blue-600 text-white p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Taxa de Aquisição</p>
                            <p className="text-2xl font-black">
                                {metrics.wishlist.total > 0 ? ((metrics.conversion.total / (metrics.conversion.total + metrics.wishlist.total)) * 100).toFixed(0) : 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
