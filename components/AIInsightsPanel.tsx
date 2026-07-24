import { logger } from '../services/monitoring';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Award, ArrowUpRight, Quote, BookOpen, BrainCircuit } from 'lucide-react';
import { getAIInsights, type AIInsightReport } from '../services/geminiService';
import type { Book } from '../types';

interface AIInsightsPanelProps {
  books: Book[];
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ books }) => {
  const [insights, setInsights] = useState<AIInsightReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      // Map books to simplified format for AI prompt tokens efficiency
      const simplifiedBooks = books.map(b => ({
        title: b.title,
        author: b.author,
        genre: b.genre,
        status: b.status,
        rating: b.rating,
        pages: b.pages
      }));

      const report = await getAIInsights(simplifiedBooks);
      if (report) {
        setInsights(report);
        // Persist local copy so it loads instantly next time
        localStorage.setItem('bibliotech_ai_insights', JSON.stringify(report));
      } else {
        setError('Não foi possível gerar os insights literários no momento. Tente novamente em instantes.');
      }
    } catch (err: any) {
      logger.error('Error fetching AI insights:', err);
      setError('Erro de conexão ao servidor de inteligência. Por favor, recarregue e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load persisted insights on mount or trigger initial fetch
    const cached = localStorage.getItem('bibliotech_ai_insights');
    if (cached) {
      try {
        setInsights(JSON.parse(cached));
      } catch (e) {
        fetchInsights();
      }
    } else {
      fetchInsights();
    }
  }, [books.length]); // Refresh report when library count changes

  return (
    <div className="bg-slate-50 dark:bg-slate-950/40 p-6 md:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/80 shadow-soft space-y-8 transition-all hover:shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <BrainCircuit className="h-5 w-5 animate-pulse" />
            </span>
            <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-900 dark:text-slate-50 italic tracking-tight">
              Análise Literária Inteligente
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mt-3 ml-1">
            ✦ Nossa IA decodifica sua estante e hábitos literários
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary/20 dark:hover:text-primary transition-all shadow-md active:scale-95 disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          {isLoading ? 'Analisando...' : 'Reavaliar Estante'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            <div className="md:col-span-12 bg-white dark:bg-slate-900/60 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 space-y-4 animate-pulse">
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-48"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-5/6"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-4/5"></div>
              </div>
            </div>

            <div className="md:col-span-6 bg-white dark:bg-slate-900/60 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 space-y-4 animate-pulse">
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-32"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-11/12"></div>
              </div>
            </div>

            <div className="md:col-span-6 bg-white dark:bg-slate-900/60 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 space-y-4 animate-pulse">
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-32"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-11/12"></div>
              </div>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 bg-red-50/50 dark:bg-red-950/10 rounded-[2rem] border border-red-100 dark:border-red-900/20 text-center space-y-4"
          >
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchInsights}
              className="px-6 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-colors"
            >
              Tentar Novamente
            </button>
          </motion.div>
        ) : insights ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8"
          >
            {/* PROFILE CARD */}
            <div className="md:col-span-12 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-soft relative overflow-hidden group">
              <div className="absolute -right-24 -top-24 w-60 h-60 bg-primary/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 dark:bg-primary/20 text-primary border border-primary/10">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Perfil de Leitor</span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-black font-serif text-slate-800 dark:text-slate-100 italic leading-snug">
                  Curadoria Literária BiblioTech
                </h3>
                
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium font-serif italic">
                  "{insights.readingProfile}"
                </p>
              </div>
            </div>

            {/* STRENGTHS COLUMN */}
            <div className="md:col-span-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-soft flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
                    <Award className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Pontos Fortes de Hábito
                  </h4>
                </div>

                <ul className="space-y-4">
                  {insights.strengths.map((strength, index) => (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={index} 
                      className="flex items-start gap-3.5"
                    >
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                        {strength}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* GROWTH OPPORTUNITIES COLUMN */}
            <div className="md:col-span-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-soft flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Horizontes para Expandir
                  </h4>
                </div>

                <ul className="space-y-4">
                  {insights.growthOpportunities.map((opportunity, index) => (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      key={index} 
                      className="flex items-start gap-3.5"
                    >
                      <ArrowUpRight className="h-4.5 w-4.5 text-indigo-500 mt-0.5 shrink-0" />
                      <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                        {opportunity}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CURATED QUOTE */}
            <div className="md:col-span-12 bg-slate-900 dark:bg-slate-950/50 text-slate-100 p-8 md:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
              <div className="absolute right-6 top-6 opacity-5">
                <Quote className="h-32 w-32" />
              </div>
              
              <div className="relative z-10 space-y-4 text-center md:text-left">
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-primary">
                  Citação Curada Especialmente Para Você
                </span>
                
                <p className="text-lg md:text-xl font-bold font-serif italic text-white leading-relaxed max-w-4xl">
                  "{insights.curatedQuote}"
                </p>
                
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  — {insights.quoteAuthor}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-400 font-medium text-xs">Insira livros na sua estante para carregar relatórios literários.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
