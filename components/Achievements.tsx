import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Book } from '../types';
import { BookStatus, BookType } from '../types';

interface AchievementsProps {
  books: Book[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  isUnlocked: boolean;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  progressText: string;
  theme: {
    bg: string;
    border: string;
    glow: string;
    text: string;
    accent: string;
  };
}

export const Achievements: React.FC<AchievementsProps> = ({ books }) => {
  // 1. Calculate dynamic statistics
  const readBooks = useMemo(() => books.filter(b => b.status === BookStatus.Read), [books]);
  const countOfReadBooks = readBooks.length;
  
  const totalReadPages = useMemo(() => {
    return readBooks.reduce((acc, curr) => acc + (curr.pages || 0), 0);
  }, [readBooks]);

  const hasFastFinish = useMemo(() => {
    return readBooks.some(b => b.daysToFinish !== undefined && b.daysToFinish <= 5 && b.daysToFinish > 0);
  }, [readBooks]);

  const hasFlashFinish = useMemo(() => {
    return readBooks.some(b => b.daysToFinish !== undefined && b.daysToFinish <= 2 && b.daysToFinish > 0);
  }, [readBooks]);

  const fastFinishes7DaysCount = useMemo(() => {
    return readBooks.filter(b => b.daysToFinish !== undefined && b.daysToFinish <= 7 && b.daysToFinish > 0).length;
  }, [readBooks]);

  const uniqueGenresRead = useMemo(() => {
    const genres = new Set<string>();
    readBooks.forEach(b => {
      if (b.genre) genres.add(b.genre.trim().toLowerCase());
    });
    return genres;
  }, [readBooks]);

  // Specific selectors for genre-based achievements
  const terrorSuspenseCount = useMemo(() => {
    return readBooks.filter(b => {
      const g = b.genre?.trim().toLowerCase() || '';
      return g.includes('terror') || g.includes('suspense') || g.includes('policial') || g.includes('thriller') || g.includes('investigação') || g.includes('mistério');
    }).length;
  }, [readBooks]);

  const aventuraFantasiaCount = useMemo(() => {
    return readBooks.filter(b => {
      const g = b.genre?.trim().toLowerCase() || '';
      return g.includes('aventura') || g.includes('fantasia') || g.includes('ficção') || g.includes('marvel') || g.includes('dc') || g.includes('espacial');
    }).length;
  }, [readBooks]);

  const romanceContosCount = useMemo(() => {
    return readBooks.filter(b => {
      const g = b.genre?.trim().toLowerCase() || '';
      return g.includes('romance') || g.includes('contos') || g.includes('clássico') || g.includes('biografia');
    }).length;
  }, [readBooks]);

  const readHQsCount = useMemo(() => {
    return readBooks.filter(b => b.type === BookType.HQ).length;
  }, [readBooks]);

  const readNormalBooksCount = useMemo(() => {
    return readBooks.filter(b => b.type === BookType.Book).length;
  }, [readBooks]);

  const ratedBooksCount = useMemo(() => {
    return readBooks.filter(b => b.rating !== undefined && b.rating > 0).length;
  }, [readBooks]);

  const totalSpentOnPaidBooks = useMemo(() => {
    return books.reduce((acc, curr) => acc + (curr.pricePaid || 0), 0);
  }, [books]);

  // 2. Define the badges schema and calculate values
  const badges: Badge[] = useMemo(() => {
    return [
      {
        id: 'pioneiro_literario',
        title: 'Pioneiro Literário',
        description: 'Diga olá à sua estante ao concluir o primeiro livro.',
        emoji: '📖',
        isUnlocked: countOfReadBooks >= 1,
        currentValue: countOfReadBooks,
        targetValue: 1,
        progressPercent: Math.min((countOfReadBooks / 1) * 100, 100),
        progressText: `${Math.min(countOfReadBooks, 1)} / 1 livro`,
        theme: {
          bg: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-950/40 dark:to-indigo-950/40',
          border: 'border-blue-200 dark:border-blue-900/50',
          glow: 'shadow-blue-500/10',
          text: 'text-blue-600 dark:text-blue-400',
          accent: 'bg-blue-600'
        }
      },
      {
        id: 'leitor_avido',
        title: 'Leitor Ávido',
        description: 'Vá fundo nas histórias completando um total de 10 livros.',
        emoji: '🏆',
        isUnlocked: countOfReadBooks >= 10,
        currentValue: countOfReadBooks,
        targetValue: 10,
        progressPercent: Math.min((countOfReadBooks / 10) * 100, 100),
        progressText: `${Math.min(countOfReadBooks, 10)} / 10 livros`,
        theme: {
          bg: 'from-amber-500/10 to-orange-500/10 dark:from-amber-950/40 dark:to-orange-950/40',
          border: 'border-amber-200 dark:border-amber-900/50',
          glow: 'shadow-amber-500/10',
          text: 'text-amber-600 dark:text-amber-400',
          accent: 'bg-amber-600'
        }
      },
      // PROGRESSÃO DE PÁGINAS LIDAS
      {
        id: 'iniciante_papel',
        title: 'Desbravador do Papel',
        description: 'Dê os primeiros passos brilhantes acumulando 500 páginas lidas.',
        emoji: '🌱',
        isUnlocked: totalReadPages >= 500,
        currentValue: totalReadPages,
        targetValue: 500,
        progressPercent: Math.min((totalReadPages / 500) * 100, 100),
        progressText: `${Math.min(totalReadPages, 500).toLocaleString('pt-BR')} / 500 págs`,
        theme: {
          bg: 'from-green-500/10 to-emerald-500/10 dark:from-green-950/40 dark:to-emerald-950/40',
          border: 'border-green-200 dark:border-green-900/50',
          glow: 'shadow-green-500/10',
          text: 'text-green-600 dark:text-green-450',
          accent: 'bg-green-600'
        }
      },
      {
        id: 'mestre_das_paginas',
        title: 'Mestre das Páginas',
        description: 'Devore calhamaços e alcance 1.500 páginas concluídas.',
        emoji: '⚡',
        isUnlocked: totalReadPages >= 1500,
        currentValue: totalReadPages,
        targetValue: 1500,
        progressPercent: Math.min((totalReadPages / 1500) * 100, 100),
        progressText: `${Math.min(totalReadPages, 1500).toLocaleString('pt-BR')} / 1.500 págs`,
        theme: {
          bg: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40',
          border: 'border-emerald-200 dark:border-emerald-900/50',
          glow: 'shadow-emerald-500/10',
          text: 'text-emerald-600 dark:text-emerald-400',
          accent: 'bg-emerald-600'
        }
      },
      {
        id: 'devorador_tomos',
        title: 'Devorador de Tomos',
        description: 'Sua estante pesa! Atravesse um total incrível de 3.000 páginas lidas.',
        emoji: '📚',
        isUnlocked: totalReadPages >= 3000,
        currentValue: totalReadPages,
        targetValue: 3000,
        progressPercent: Math.min((totalReadPages / 3000) * 100, 100),
        progressText: `${Math.min(totalReadPages, 3000).toLocaleString('pt-BR')} / 3.000 págs`,
        theme: {
          bg: 'from-teal-500/10 to-cyan-500/10 dark:from-teal-950/40 dark:to-cyan-950/40',
          border: 'border-teal-200 dark:border-teal-900/50',
          glow: 'shadow-teal-500/10',
          text: 'text-teal-600 dark:text-teal-400',
          accent: 'bg-teal-600'
        }
      },
      {
        id: 'enciclopedia_humana',
        title: 'Enciclopédia Humana',
        description: 'Um monumento sagrado à literatura com mais de 7.500 páginas lecionadas.',
        emoji: '🧠',
        isUnlocked: totalReadPages >= 7500,
        currentValue: totalReadPages,
        targetValue: 7500,
        progressPercent: Math.min((totalReadPages / 7500) * 100, 100),
        progressText: `${Math.min(totalReadPages, 7500).toLocaleString('pt-BR')} / 7.500 págs`,
        theme: {
          bg: 'from-cyan-500/15 to-blue-500/15 dark:from-cyan-950/50 dark:to-blue-950/50',
          border: 'border-cyan-200 dark:border-cyan-900/50',
          glow: 'shadow-cyan-500/20',
          text: 'text-cyan-600 dark:text-cyan-400',
          accent: 'bg-cyan-600'
        }
      },
      // VELOCIDADE E TEMPO DE LEITURA
      {
        id: 'relampago_literario',
        title: 'Relâmpago Literário',
        description: 'Conclua a leitura completa de uma obra em até extraordinários 2 dias.',
        emoji: '⚡',
        isUnlocked: hasFlashFinish,
        currentValue: hasFlashFinish ? 1 : 0,
        targetValue: 1,
        progressPercent: hasFlashFinish ? 100 : 0,
        progressText: hasFlashFinish ? 'Concluído!' : 'Falta 1 veloz',
        theme: {
          bg: 'from-amber-400/10 to-yellow-500/15 dark:from-amber-900/30 dark:to-yellow-905/30',
          border: 'border-amber-300 dark:border-amber-700/50',
          glow: 'shadow-amber-500/20',
          text: 'text-amber-600 dark:text-yellow-400',
          accent: 'bg-amber-500'
        }
      },
      {
        id: 'maratonista_resiliente',
        title: 'Maratonista',
        description: 'Leia uma obra com extrema velocidade (em até 5 dias).',
        emoji: '🔥',
        isUnlocked: hasFastFinish,
        currentValue: hasFastFinish ? 1 : 0,
        targetValue: 1,
        progressPercent: hasFastFinish ? 100 : 0,
        progressText: hasFastFinish ? 'Concluído!' : 'Falta 1 veloz',
        theme: {
          bg: 'from-rose-500/10 to-red-500/10 dark:from-rose-950/40 dark:to-red-950/40',
          border: 'border-rose-200 dark:border-rose-900/50',
          glow: 'shadow-rose-500/10',
          text: 'text-rose-600 dark:text-rose-400',
          accent: 'bg-rose-600'
        }
      },
      {
        id: 'velocista_consistente',
        title: 'Velocista Consistente',
        description: 'Mantenha o hábito dinâmico: leia 3 livros em até 7 dias cada.',
        emoji: '🚀',
        isUnlocked: fastFinishes7DaysCount >= 3,
        currentValue: fastFinishes7DaysCount,
        targetValue: 3,
        progressPercent: Math.min((fastFinishes7DaysCount / 3) * 100, 100),
        progressText: `${Math.min(fastFinishes7DaysCount, 3)} / 3 rápidos`,
        theme: {
          bg: 'from-indigo-500/10 to-purple-500/10 dark:from-indigo-950/40 dark:to-purple-950/40',
          border: 'border-indigo-200 dark:border-indigo-900/50',
          glow: 'shadow-indigo-500/15',
          text: 'text-indigo-600 dark:text-indigo-400',
          accent: 'bg-indigo-600'
        }
      },
      // TIPOS DE LIVROS (LIVROS VS HQS)
      {
        id: 'sio_da_prosa',
        title: 'Sábio da Prosa',
        description: 'Inicie uma incrível rotina literária ao ler 5 livros tradicionais.',
        emoji: '📖',
        isUnlocked: readNormalBooksCount >= 5,
        currentValue: readNormalBooksCount,
        targetValue: 5,
        progressPercent: Math.min((readNormalBooksCount / 5) * 100, 100),
        progressText: `${Math.min(readNormalBooksCount, 5)} / 5 livros`,
        theme: {
          bg: 'from-teal-500/10 to-emerald-500/10 dark:from-teal-950/40 dark:to-emerald-950/40',
          border: 'border-teal-250 dark:border-teal-900/40',
          glow: 'shadow-teal-500/10',
          text: 'text-teal-600 dark:text-teal-400',
          accent: 'bg-teal-600'
        }
      },
      {
        id: 'lenda_da_estante',
        title: 'Lenda da Estante',
        description: 'Navegue profundamente pela literatura completando 10 livros tradicionais.',
        emoji: '🪐',
        isUnlocked: readNormalBooksCount >= 10,
        currentValue: readNormalBooksCount,
        targetValue: 10,
        progressPercent: Math.min((readNormalBooksCount / 10) * 100, 100),
        progressText: `${Math.min(readNormalBooksCount, 10)} / 10 livros`,
        theme: {
          bg: 'from-violet-500/10 to-indigo-500/10 dark:from-violet-950/40 dark:to-indigo-950/40',
          border: 'border-violet-250 dark:border-violet-900/40',
          glow: 'shadow-violet-500/15',
          text: 'text-violet-600 dark:text-violet-450',
          accent: 'bg-violet-600'
        }
      },
      {
        id: 'mestre_das_hqs',
        title: 'Mestre da Nona Arte',
        description: 'Aprecie a arte sequencial completando pelo menos 3 HQs.',
        emoji: '👾',
        isUnlocked: readHQsCount >= 3,
        currentValue: readHQsCount,
        targetValue: 3,
        progressPercent: Math.min((readHQsCount / 3) * 100, 100),
        progressText: `${Math.min(readHQsCount, 3)} / 3 HQs`,
        theme: {
          bg: 'from-sky-500/10 to-cyan-500/10 dark:from-sky-950/40 dark:to-cyan-950/40',
          border: 'border-sky-200 dark:border-sky-900/50',
          glow: 'shadow-sky-500/10',
          text: 'text-sky-600 dark:text-sky-400',
          accent: 'bg-sky-600'
        }
      },
      {
        id: 'imperio_dos_paineis',
        title: 'Império dos Painéis',
        description: 'Uma coleção de respeito: devore pelo menos 8 HQs ou mangás na estante.',
        emoji: '🌌',
        isUnlocked: readHQsCount >= 8,
        currentValue: readHQsCount,
        targetValue: 8,
        progressPercent: Math.min((readHQsCount / 8) * 100, 100),
        progressText: `${Math.min(readHQsCount, 8)} / 8 HQs`,
        theme: {
          bg: 'from-pink-500/10 to-rose-500/10 dark:from-pink-950/40 dark:to-rose-950/40',
          border: 'border-pink-200 dark:border-pink-900/50',
          glow: 'shadow-pink-500/15',
          text: 'text-pink-600 dark:text-pink-400',
          accent: 'bg-pink-600'
        }
      },
      // GÊNEROS LITERARES
      {
        id: 'sobrevivente_horror',
        title: 'Sobrevivente do Terror',
        description: 'Não olhe para trás! Encare seus medos completando 2 obras de Terror ou Suspense.',
        emoji: '👻',
        isUnlocked: terrorSuspenseCount >= 2,
        currentValue: terrorSuspenseCount,
        targetValue: 2,
        progressPercent: Math.min((terrorSuspenseCount / 2) * 100, 100),
        progressText: `${Math.min(terrorSuspenseCount, 2)} / 2 livros`,
        theme: {
          bg: 'from-purple-900/20 to-stone-900/20 dark:from-purple-950/50 dark:to-stone-950/50',
          border: 'border-purple-800/40 dark:border-purple-800/50',
          glow: 'shadow-purple-900/25',
          text: 'text-purple-700 dark:text-purple-400',
          accent: 'bg-purple-800'
        }
      },
      {
        id: 'desbravador_mundos',
        title: 'Desbravador de Mundos',
        description: 'Atravesse portais mágicos ao concluir 2 livros de Aventura, Fantasia ou Ficção.',
        emoji: '🐉',
        isUnlocked: aventuraFantasiaCount >= 2,
        currentValue: aventuraFantasiaCount,
        targetValue: 2,
        progressPercent: Math.min((aventuraFantasiaCount / 2) * 100, 100),
        progressText: `${Math.min(aventuraFantasiaCount, 2)} / 2 aventureiros`,
        theme: {
          bg: 'from-amber-600/10 to-red-600/10 dark:from-amber-950/40 dark:to-red-950/40',
          border: 'border-amber-400 dark:border-amber-900/40',
          glow: 'shadow-amber-500/10',
          text: 'text-amber-700 dark:text-amber-400',
          accent: 'bg-amber-600'
        }
      },
      {
        id: 'romantico_inabalavel',
        title: 'Coração de Poeta',
        description: 'Deixe-se levar pelas emoções concluindo 2 deliciosos Romances ou Contos.',
        emoji: '💖',
        isUnlocked: romanceContosCount >= 2,
        currentValue: romanceContosCount,
        targetValue: 2,
        progressPercent: Math.min((romanceContosCount / 2) * 100, 100),
        progressText: `${Math.min(romanceContosCount, 2)} / 2 sentimentos`,
        theme: {
          bg: 'from-pink-500/10 to-fuchsia-500/10 dark:from-pink-950/40 dark:to-fuchsia-950/40',
          border: 'border-pink-250 dark:border-pink-900/50',
          glow: 'shadow-pink-500/15',
          text: 'text-pink-600 dark:text-pink-400',
          accent: 'bg-pink-500'
        }
      },
      // JUVENTUDE GERAL
      {
        id: 'explorador_multigenero',
        title: 'Explorador Multigênero',
        description: 'Expanda horizontes completando livros de 5 gêneros distintos.',
        emoji: '🔮',
        isUnlocked: uniqueGenresRead.size >= 5,
        currentValue: uniqueGenresRead.size,
        targetValue: 5,
        progressPercent: Math.min((uniqueGenresRead.size / 5) * 100, 100),
        progressText: `${Math.min(uniqueGenresRead.size, 5)} / 5 gêneros`,
        theme: {
          bg: 'from-purple-500/10 to-fuchsia-500/10 dark:from-purple-950/40 dark:to-fuchsia-950/40',
          border: 'border-purple-200 dark:border-purple-900/50',
          glow: 'shadow-purple-500/10',
          text: 'text-purple-600 dark:text-purple-400',
          accent: 'bg-purple-600'
        }
      },
      {
        id: 'espirito_critico',
        title: 'Espírito Crítico',
        description: 'Atribua notas/avaliações detalhadas para pelo menos 5 obras lidas.',
        emoji: '⭐',
        isUnlocked: ratedBooksCount >= 5,
        currentValue: ratedBooksCount,
        targetValue: 5,
        progressPercent: Math.min((ratedBooksCount / 5) * 100, 100),
        progressText: `${Math.min(ratedBooksCount, 5)} / 5 notas`,
        theme: {
          bg: 'from-yellow-500/10 to-amber-500/10 dark:from-yellow-950/30 dark:to-amber-950/30',
          border: 'border-yellow-250 dark:border-yellow-900/40',
          glow: 'shadow-yellow-500/10',
          text: 'text-yellow-600 dark:text-amber-400',
          accent: 'bg-yellow-500'
        }
      },
      {
        id: 'investidor_literario',
        title: 'Mecenas Literário',
        description: 'Valorize o mercado investindo mais de R$ 150 em livros.',
        emoji: '💎',
        isUnlocked: totalSpentOnPaidBooks >= 150,
        currentValue: totalSpentOnPaidBooks,
        targetValue: 150,
        progressPercent: Math.min((totalSpentOnPaidBooks / 150) * 100, 100),
        progressText: `R$ ${Math.min(totalSpentOnPaidBooks, 150).toFixed(0)} / R$ 150`,
        theme: {
          bg: 'from-violet-500/10 to-fuchsia-500/10 dark:from-violet-950/40 dark:to-fuchsia-950/40',
          border: 'border-violet-200 dark:border-violet-900/50',
          glow: 'shadow-violet-500/10',
          text: 'text-violet-600 dark:text-violet-400',
          accent: 'bg-violet-600'
        }
      }
    ];
  }, [
    countOfReadBooks,
    totalReadPages,
    hasFastFinish,
    hasFlashFinish,
    fastFinishes7DaysCount,
    uniqueGenresRead,
    terrorSuspenseCount,
    aventuraFantasiaCount,
    romanceContosCount,
    readHQsCount,
    readNormalBooksCount,
    ratedBooksCount,
    totalSpentOnPaidBooks
  ]);

  const unlockedCount = useMemo(() => badges.filter(b => b.isUnlocked).length, [badges]);

  // State elements to handle celebrations and particles
  const [activeCelebration, setActiveCelebration] = useState<Badge | null>(null);
  const [particles, setParticles] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize celebrated badges list on first load to prevent flash-celebrating pre-existing badges
  useEffect(() => {
    const celebratedStr = localStorage.getItem('celebrated_badges');
    if (celebratedStr === null) {
      const currentlyUnlockedIds = badges.filter(b => b.isUnlocked).map(b => b.id);
      localStorage.setItem('celebrated_badges', JSON.stringify(currentlyUnlockedIds));
    }
    setIsInitialized(true);
  }, [badges]);

  // Observe newly unlocked badges and deploy custom confetti celebrations
  useEffect(() => {
    if (!isInitialized) return;

    const celebratedStr = localStorage.getItem('celebrated_badges');
    const celebratedIds: string[] = celebratedStr ? JSON.parse(celebratedStr) : [];

    const newlyUnlocked = badges.find(b => b.isUnlocked && !celebratedIds.includes(b.id));

    if (newlyUnlocked) {
      // Mark as acknowledged immediately to shield from double triggers
      const updatedCelebrated = [...celebratedIds, newlyUnlocked.id];
      localStorage.setItem('celebrated_badges', JSON.stringify(updatedCelebrated));

      // Trigger the spectacular model overlays 
      setActiveCelebration(newlyUnlocked);

      // Festive bright colors for floating bits
      const CONFETTI_COLORS = [
        '#f43f5e', // rose-500
        '#ec4899', // pink-500
        '#d946ef', // fuchsia-500
        '#a855f7', // purple-500
        '#6366f1', // indigo-500
        '#3b82f6', // blue-500
        '#0ea5e9', // sky-500
        '#10b981', // emerald-500
        '#eab308', // yellow-500
        '#f97316', // orange-500
      ];

      // Build 80 random particle paths 
      const newParticles = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // starting viewport horizontal coordinate percentage
        y: Math.random() * 20 + 80, // randomized bottom rise
        angle: (Math.random() - 0.5) * 50,
        drift: (Math.random() - 0.5) * 40,
        size: Math.random() * 11 + 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 1.5,
        duration: Math.random() * 2.2 + 1.8,
        rotate: Math.random() * 720 - 360,
        shape: Math.random() > 0.55 ? 'circle' : 'square',
      }));
      setParticles(newParticles);
    }
  }, [badges, isInitialized]);

  // Motion variants for stagger animations
  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 20 }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 shadow-soft border border-slate-100 dark:border-slate-800 transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black font-serif text-slate-900 dark:text-slate-50 italic">Salão de Conquistas</h2>
          <p className="text-slate-400 dark:text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1">✦ Medalhas e marcos alcançados em sua jornada literária</p>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2 py-1.5 md:p-3 md:py-2 rounded-2xl border border-slate-100 dark:border-slate-700">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progresso</span>
          <div className="flex items-center gap-1">
            <span className="text-base font-black font-serif text-slate-800 dark:text-slate-200 italic">{unlockedCount}</span>
            <span className="text-[10px] font-black text-slate-400">/ {badges.length}</span>
          </div>
          <span className="bg-primary/25 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full dark:bg-primary/30">
            {((unlockedCount / badges.length) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {badges.map((badge) => {
          return (
            <motion.div
              key={badge.id}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`relative overflow-hidden rounded-3xl p-5 border-2 transition-all flex flex-col justify-between align-stretch h-[180px] ${
                badge.isUnlocked 
                  ? `bg-gradient-to-br ${badge.theme.bg} ${badge.theme.border} shadow-lg ${badge.theme.glow}` 
                  : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/80'
              }`}
            >
              {/* Card Header & Glow Accents */}
              <div className="flex justify-between items-start gap-4">
                {/* Badge circle with icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                  badge.isUnlocked 
                    ? 'bg-white dark:bg-slate-800 shadow-sm border border-black/5 dark:border-white/5 active:scale-110 duration-200' 
                    : 'bg-slate-150/40 dark:bg-slate-850/40 text-slate-400 saturation-0'
                }`}>
                  <span className={`${badge.isUnlocked ? '' : 'opacity-40'}`}>{badge.emoji}</span>
                </div>

                {/* Status Indicator */}
                {badge.isUnlocked ? (
                  <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`}>
                    ✦ Ativo
                  </span>
                ) : (
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 flex items-center gap-1 border border-slate-200/50 dark:border-slate-850">
                    🔒 Bloqueado
                  </span>
                )}
              </div>

              {/* Title & Info */}
              <div className="my-2.5 flex-1">
                <h3 className={`text-sm font-black tracking-tight leading-none ${
                  badge.isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 line-clamp-1'
                }`}>
                  {badge.title}
                </h3>
                <p className="text-[10px] leading-snug text-slate-400 dark:text-slate-500 font-medium mt-1 line-clamp-2" title={badge.description}>
                  {badge.description}
                </p>
              </div>

              {/* Progress visual or completed banner */}
              <div className="w-full">
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider mb-1.5">
                  <span className={badge.isUnlocked ? badge.theme.text : 'text-slate-400'}>Meta</span>
                  <span className={badge.isUnlocked ? 'text-slate-850 dark:text-slate-250' : 'text-slate-400'}>
                    {badge.progressText}
                  </span>
                </div>
                {/* Progress bar container */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      badge.isUnlocked ? badge.theme.accent : 'bg-slate-350 dark:bg-slate-650'
                    }`}
                    style={{ width: `${badge.progressPercent}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Overlay Celebration Modal & Confetti Effects */}
      <AnimatePresence>
        {activeCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCelebration(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            {/* Falling/Floating Confetti Particles Canvas (DOM particles with Framer Motion) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ 
                    x: `${p.x}vw`, 
                    y: '105vh', 
                    rotate: 0, 
                    opacity: 1,
                    borderRadius: p.shape === 'circle' ? '50%' : '3px'
                  }}
                  animate={{
                    x: `${p.x + p.drift}vw`,
                    y: '-10vh',
                    rotate: p.rotate,
                    opacity: [1, 1, 0.9, 0]
                  }}
                  transition={{
                    duration: p.duration,
                    delay: p.delay,
                    ease: [0.25, 1, 0.5, 1] // sleek custom timing curve for gravity drift
                  }}
                  style={{
                    position: 'absolute',
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    transformOrigin: 'center'
                  }}
                />
              ))}
            </div>

            {/* Micro celebration card pop up */}
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ 
                scale: 1, 
                y: 0, 
                opacity: 1,
                transition: { type: 'spring', damping: 24, stiffness: 320 }
              }}
              exit={{ scale: 0.92, y: -15, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[3rem] p-8 md:p-10 max-w-sm w-full shadow-2xl text-center overflow-hidden"
            >
              {/* Vibrant abstract glowing light circles matching the celebration colors */}
              <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gradient-to-br ${activeCelebration.theme.bg} opacity-45 blur-3xl`} />
              <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br ${activeCelebration.theme.bg} opacity-45 blur-3xl`} />

              <div className="relative space-y-6">
                {/* Visual badge highlight */}
                <motion.div 
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ 
                    scale: 1,
                    rotate: 0,
                    transition: { delay: 0.15, duration: 0.7, type: 'spring', bounce: 0.5 }
                  }}
                  className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center text-5xl bg-gradient-to-br ${activeCelebration.theme.bg} border-2 ${activeCelebration.theme.border} ${activeCelebration.theme.glow} shadow-xl relative`}
                >
                  <span className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</span>
                  <span className="absolute -bottom-1 -left-1 text-lg animate-pulse">🌟</span>
                  <span>{activeCelebration.emoji}</span>
                </motion.div>

                {/* Badge title details */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary bg-primary/10 px-3.5 py-1.5 rounded-full dark:bg-primary/20">
                    🏆 Conquista Desbloqueada!
                  </span>
                  <h3 className="text-2xl font-black font-serif text-slate-900 dark:text-white italic pt-4 leading-none">
                    {activeCelebration.title}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 px-4 leading-relaxed mt-2">
                    {activeCelebration.description}
                  </p>
                </div>

                {/* Progress metadata box */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex justify-between items-center px-5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Março Alcançado</span>
                  <span className={`text-[10px] font-black ${activeCelebration.theme.text}`}>{activeCelebration.progressText}</span>
                </div>

                {/* Acceptance button */}
                <button
                  type="button"
                  onClick={() => setActiveCelebration(null)}
                  className="w-full bg-slate-900 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-primary dark:hover:text-white hover:bg-primary text-white py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest leading-none outline-none transition-all active:scale-95 shadow-md hover:shadow-primary/20"
                >
                  Continuar Lendo!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
