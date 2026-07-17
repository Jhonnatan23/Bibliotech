
import React, { useMemo, useState } from 'react';
import { Book, BookStatus, BookType } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

interface StatsViewProps {
  books: Book[];
  availableYears: number[];
  readingGoal?: number;
}

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
const GENRE_COLORS = ['#ec4899', '#8b5cf6', '#2563eb', '#10b981', '#f59e0b', '#64748b'];

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
                        {prefix}{p.value !== undefined ? (p.value % 1 === 0 ? p.value.toLocaleString('pt-BR') : p.value.toFixed(1)) : p.value}
                    </span>
                </div>
            ))}
        </div>
      </div>
    );
  }
  return null;
};

export const StatsView: React.FC<StatsViewProps> = React.memo(({ books, availableYears, readingGoal = 12 }) => {
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

    const monthlyAverage = useMemo(() => {
        const targetYear = selectedYear === 'all' ? new Date().getFullYear() : selectedYear;
        
        const yearBooks = books.filter(b => {
            if (b.status !== BookStatus.Read) return false;
            const date = b.dateFinished || b.dateAdded;
            return new Date(date).getFullYear() === targetYear;
        });

        const totalRead = yearBooks.length;
        
        const currentYear = new Date().getFullYear();
        let monthsCount = 12;
        if (targetYear === currentYear) {
            monthsCount = new Date().getMonth() + 1; // 1-indexed, e.g., Jun = 6
        }
        if (monthsCount < 1) monthsCount = 1;

        const avgPerMonth = totalRead / monthsCount;
        const targetPerMonth = readingGoal / 12;
        const percentageOfTarget = targetPerMonth > 0 ? (avgPerMonth / targetPerMonth) * 100 : 0;

        return {
            targetYear,
            totalRead,
            monthsCount,
            avgPerMonth,
            targetPerMonth,
            percentageOfTarget,
            goal: readingGoal,
            remainingToAnnualGoal: Math.max(0, readingGoal - totalRead)
        };
    }, [books, selectedYear, readingGoal]);

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
        const shelfBooks = books.filter(b => b.status !== BookStatus.Wishlist);
        const totalShelf = shelfBooks.length;
        const totalShelfHQ = shelfBooks.filter(b => b.type === BookType.HQ).length;
        const totalShelfBook = shelfBooks.filter(b => b.type === BookType.Book).length;

        const readBooks = filteredBooks.filter(b => b.status === BookStatus.Read);
        const readTotal = readBooks.length;
        const readDigital = readBooks.filter(b => b.isDigital).length;
        const readPhysical = readTotal - readDigital;
        const readHQ = readBooks.filter(b => b.type === BookType.HQ).length;
        const readBook = readBooks.filter(b => b.type === BookType.Book).length;

        const pagesTotal = readBooks.reduce((acc, b) => acc + (b.pages || 0), 0);
        const pagesDigital = readBooks.filter(b => b.isDigital).reduce((acc, b) => acc + (b.pages || 0), 0);
        const pagesPhysical = pagesTotal - pagesDigital;
        const pagesHQ = readBooks.filter(b => b.type === BookType.HQ).reduce((acc, b) => acc + (b.pages || 0), 0);
        const pagesBook = readBooks.filter(b => b.type === BookType.Book).reduce((acc, b) => acc + (b.pages || 0), 0);

        const avgPagesTotal = readTotal > 0 ? pagesTotal / readTotal : 0;
        const avgPagesDigital = readDigital > 0 ? pagesDigital / readDigital : 0;
        const avgPagesPhysical = readPhysical > 0 ? pagesPhysical / readPhysical : 0;
        const avgPagesHQ = readHQ > 0 ? pagesHQ / readHQ : 0;
        const avgPagesBook = readBook > 0 ? pagesBook / readBook : 0;

        const booksWithRating = readBooks.filter(b => b.rating !== undefined);
        const avgRatingTotal = booksWithRating.length > 0 ? booksWithRating.reduce((acc, b) => acc + (b.rating || 0), 0) / booksWithRating.length : 0;
        const avgRatingDigital = readBooks.filter(b => b.isDigital && b.rating !== undefined).reduce((acc, b) => acc + (b.rating || 0), 0) / (readBooks.filter(b => b.isDigital && b.rating !== undefined).length || 1);
        const avgRatingPhysical = readBooks.filter(b => !b.isDigital && b.rating !== undefined).reduce((acc, b) => acc + (b.rating || 0), 0) / (readBooks.filter(b => !b.isDigital && b.rating !== undefined).length || 1);
        const avgRatingHQ = readBooks.filter(b => b.type === BookType.HQ && b.rating !== undefined).reduce((acc, b) => acc + (b.rating || 0), 0) / (readBooks.filter(b => b.type === BookType.HQ && b.rating !== undefined).length || 1);
        const avgRatingBook = readBooks.filter(b => b.type === BookType.Book && b.rating !== undefined).reduce((acc, b) => acc + (b.rating || 0), 0) / (readBooks.filter(b => b.type === BookType.Book && b.rating !== undefined).length || 1);

        const booksWithTime = readBooks.filter(b => b.daysToFinish !== undefined && b.daysToFinish !== null);
        const avgTimeTotal = booksWithTime.length > 0 ? booksWithTime.reduce((acc, b) => acc + (b.daysToFinish || 0), 0) / booksWithTime.length : 0;
        const avgTimeHQ = readBooks.filter(b => b.type === BookType.HQ && b.daysToFinish).reduce((acc, b) => acc + (b.daysToFinish || 0), 0) / (readBooks.filter(b => b.type === BookType.HQ && b.daysToFinish).length || 1);
        const avgTimeBook = readBooks.filter(b => b.type === BookType.Book && b.daysToFinish).reduce((acc, b) => acc + (b.daysToFinish || 0), 0) / (readBooks.filter(b => b.type === BookType.Book && b.daysToFinish).length || 1);

        const wishlistBooks = filteredBooks.filter(b => b.status === BookStatus.Wishlist);
        const wishlistTotal = wishlistBooks.length;
        const wishlistHQ = wishlistBooks.filter(b => b.type === BookType.HQ).length;
        const wishlistBook = wishlistBooks.filter(b => b.type === BookType.Book).length;

        const wishlistValueTotal = wishlistBooks.reduce((acc, b) => acc + (b.estimatedPrice || 0), 0);
        const wishlistValueHQ = wishlistBooks.filter(b => b.type === BookType.HQ).reduce((acc, b) => acc + (b.estimatedPrice || 0), 0);
        const wishlistValueBook = wishlistBooks.filter(b => b.type === BookType.Book).reduce((acc, b) => acc + (b.estimatedPrice || 0), 0);

        // Análise de Aquisição (Novos Dados v14)
        const convertedBooks = filteredBooks.filter(b => b.wasWishlist && b.status !== BookStatus.Wishlist);
        const conversionTotal = convertedBooks.length;
        
        const estValueConverted = convertedBooks.reduce((acc, b) => acc + (b.estimatedPrice || 0), 0);
        const paidValueConverted = convertedBooks.reduce((acc, b) => acc + (b.pricePaid || 0), 0);
        const diffValue = estValueConverted - paidValueConverted;

        return {
            shelf: { total: totalShelf, hq: totalShelfHQ, book: totalShelfBook },
            read: { total: readTotal, hq: readHQ, book: readBook },
            pages: { total: pagesTotal, hq: pagesHQ, book: pagesBook },
            avgPages: { total: avgPagesTotal, hq: avgPagesHQ, book: avgPagesBook },
            avgRating: { total: avgRatingTotal, hq: avgRatingHQ, book: avgRatingBook },
            avgTime: { total: avgTimeTotal, hq: avgTimeHQ, book: avgTimeBook },
            wishlist: { total: wishlistTotal, hq: wishlistHQ, book: wishlistBook },
            wishlistValue: { total: wishlistValueTotal, hq: wishlistValueHQ, book: wishlistValueBook },
            conversion: { 
              total: conversionTotal, 
              estValue: estValueConverted, 
              paidValue: paidValueConverted, 
              savings: diffValue,
              book: convertedBooks.filter(b => b.type === BookType.Book).length,
              hq: convertedBooks.filter(b => b.type === BookType.HQ).length
            },
            digital: {
                total: readDigital,
                physical: readPhysical,
                avgRatingDigital,
                avgRatingPhysical
            }
        };
    }, [books, filteredBooks]);

    const typeData = [
        { name: 'Livros', value: metrics.read.book, color: '#2563eb' },
        { name: 'HQs', value: metrics.read.hq, color: '#f59e0b' },
    ];

    const digitalData = [
        { name: 'Digital', value: metrics.digital.total, color: '#8b5cf6' },
        { name: 'Físico', value: metrics.digital.physical, color: '#10b981' },
    ];

    const genreData = useMemo(() => {
        const readBooks = filteredBooks.filter(b => b.status === BookStatus.Read);
        const counts: Record<string, number> = {};
        
        readBooks.forEach(b => {
            const genre = b.genre ? b.genre.trim() : 'Sem Gênero';
            counts[genre] = (counts[genre] || 0) + 1;
        });

        const data = Object.entries(counts).map(([name, value]) => ({
            name,
            value
        }));

        data.sort((a, b) => b.value - a.value);

        if (data.length > 5) {
            const top5 = data.slice(0, 5);
            const othersCount = data.slice(5).reduce((acc, curr) => acc + curr.value, 0);
            top5.push({ name: 'Outros', value: othersCount });
            return top5;
        }

        return data;
    }, [filteredBooks]);

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

            {/* NOVO CARD: DESEMPENHO VS OBJECTIVO/META DE LEITURA POR MÊS */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50/70 dark:from-indigo-950/20 dark:via-slate-900/40 dark:to-slate-950/20 p-6 md:p-8 rounded-[2.5rem] border border-indigo-100/50 dark:border-indigo-900/20 shadow-soft grid grid-cols-1 lg:grid-cols-12 gap-8 items-center transition-all hover:shadow-xl">
                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Média de Leituras por Mês</p>
                    <p className="text-5xl font-black text-primary dark:text-indigo-400 tracking-tighter mb-4">
                        {monthlyAverage.avgPerMonth.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </p>
                    <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1.5 rounded-full text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
                        Meta Mensal: {monthlyAverage.targetPerMonth.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} / mês
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                    <div>
                        <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                            Desempenho no Ano de {monthlyAverage.targetYear}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            {monthlyAverage.percentageOfTarget >= 100 ? (
                                <span>🌟 <strong>Ritmo fantástico!</strong> Você está superando o ritmo necessário para atingir o seu objetivo anual de {monthlyAverage.goal} livros.</span>
                            ) : monthlyAverage.percentageOfTarget >= 75 ? (
                                <span>📈 <strong>Excelente progresso!</strong> Seu ritmo de leitura está muito próximo do objetivo ideal estabelecido mensalmente.</span>
                            ) : monthlyAverage.percentageOfTarget >= 40 ? (
                                <span>📖 <strong>No rumo certo!</strong> Continue lendo suas obras de forma persistente para consolidar o hábito literário.</span>
                            ) : (
                                <span>⏱️ <strong>Ritmo moderado.</strong> Tente dedicar alguns minutos a mais por dia para alavancar seu progresso rumo ao objetivo de {monthlyAverage.goal} livros.</span>
                            )}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline text-xs">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Progresso da Meta Mensal</span>
                            <span className="font-semibold text-primary dark:text-indigo-400">{Math.round(monthlyAverage.percentageOfTarget)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
                            <div 
                                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(8, monthlyAverage.percentageOfTarget))}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <div className="bg-white/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Lidos no Ano</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100">{monthlyAverage.totalRead} / {monthlyAverage.goal} <span className="text-xs font-normal text-slate-400">livros</span></p>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Restantes para Meta Anual</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100">{monthlyAverage.remainingToAnnualGoal} <span className="text-xs font-normal text-slate-400">livros</span></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft">
                    <h3 className="text-lg sm:text-xl font-black font-serif italic mb-6 sm:mb-8 uppercase tracking-widest">Digital vs Físico</h3>
                    <div className="h-[300px] md:h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={digitalData} 
                                    innerRadius="50%" 
                                    outerRadius="72%" 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {digitalData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col justify-between">
                    <h3 className="text-lg sm:text-xl font-black font-serif italic mb-6 sm:mb-8 uppercase tracking-widest">Satisfação por Formato</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-6 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Média de Nota (Digital)</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-black">{metrics.digital.avgRatingDigital.toFixed(1)}</p>
                                    <svg className="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-6 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Média de Nota (Físico)</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-black">{metrics.digital.avgRatingPhysical.toFixed(1)}</p>
                                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                </div>
                            </div>
                        </div>

                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-center">✦ Qual formato mais te agrada?</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft">
                    <h3 className="text-lg sm:text-xl font-black font-serif italic mb-6 sm:mb-8">Composição de Leitura</h3>
                    <div className="h-[300px] md:h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={typeData} 
                                    innerRadius="50%" 
                                    outerRadius="72%" 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col justify-between">
                    <h3 className="text-lg sm:text-xl font-black font-serif italic mb-6 sm:mb-8">Performance Média</h3>
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

            {/* Gêneros Literários Distribuição */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft">
                    <h3 className="text-lg sm:text-xl font-black font-serif italic mb-2 text-slate-800 dark:text-white">Gêneros & Estilos Favoritos</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest mb-6">Distribuição por gêneros das obras lidas</p>
                    <div className="h-[300px] md:h-[400px] w-full">
                        {genreData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={genreData} 
                                        innerRadius="50%" 
                                        outerRadius="72%" 
                                        paddingAngle={4} 
                                        dataKey="value"
                                    >
                                        {genreData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma obra lida para analisar gêneros</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg sm:text-xl font-black font-serif italic mb-2 text-slate-800 dark:text-white">Análise de Estilo</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest mb-6">Sua preferência literária predominante</p>
                    </div>
                    
                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                        {genreData.length > 0 ? (
                            <>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gênero Predominante</p>
                                        <p className="text-2xl font-black text-primary font-serif italic">{genreData[0]?.name}</p>
                                    </div>
                                    <div className="bg-primary/10 text-primary text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                                        {genreData[0]?.value} {genreData[0]?.value === 1 ? 'Livro lido' : 'Livros lidos'}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Top Gêneros Lidos:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {genreData.map((genre, index) => (
                                            <div key={genre.name} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/30 px-4 py-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: GENRE_COLORS[index % GENRE_COLORS.length] }}></div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-black text-slate-750 dark:text-slate-300 truncate uppercase tracking-wider">{genre.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400">{genre.value} {genre.value === 1 ? 'unidade' : 'unidades'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Adicione livros marcados como "Lido" para ver quais são os seus gêneros literários favoritos e ler estatísticas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Wishlist Estatísticas Atualizadas */}
                <div className="bg-gradient-to-br from-pink-50 to-white dark:from-pink-900/10 dark:to-slate-900 p-8 rounded-[2.5rem] border border-pink-100 dark:border-pink-900/20 shadow-soft">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black font-serif italic text-pink-600 dark:text-pink-400">Poder de Compra Wishlist</h3>
                        <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-xl text-pink-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Desejos Atuais</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{metrics.wishlist.total} <span className="text-xs text-slate-400">obras</span></p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl border border-pink-50 dark:border-pink-900/30">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Investimento Necessário</p>
                                <p className="text-2xl font-black text-pink-600 dark:text-pink-400">R$ {metrics.wishlistValue.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance de Aquisição (Novidade v14) */}
                <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-slate-900 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/20 shadow-soft">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black font-serif italic text-emerald-600 dark:text-emerald-400">Inteligência Financeira</h3>
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-1 bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Pago (Desejos)</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">R$ {metrics.conversion.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="flex-1 bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Diferença (Savings)</p>
                                <p className={`text-xl font-black ${metrics.conversion.savings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {metrics.conversion.savings >= 0 ? '+' : ''} R$ {metrics.conversion.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="bg-emerald-600 text-white p-5 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">Desempenho de Aquisição</p>
                                <p className="text-lg font-bold">
                                    {metrics.conversion.savings >= 0 ? 'Você economizou!' : 'Pagou acima da média'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black">
                                    {metrics.conversion.estValue > 0 ? Math.abs(Math.round((metrics.conversion.savings / metrics.conversion.estValue) * 100)) : 0}%
                                </p>
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">✦ Comparação baseada no valor estimado vs. valor pago</p>
                    </div>
                </div>
            </div>
        </div>
    );
});
