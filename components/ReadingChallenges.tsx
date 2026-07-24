import { logger } from '../services/monitoring';
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import type { Book, Profile, ChallengeType } from '../types';
import { BookStatus, BookType } from '../types';
import { useChallengeProgress } from '../hooks/useChallengeProgress';
import { useBadgeUnlocks } from '../hooks/useBadgeUnlocks';
import { CustomChallengeForm } from './CustomChallengeForm';
import { groupChallengesAndStats } from './reading-challenges/utils';

const PREDEFINED_CHALLENGES: ChallengeType[] = [
  {
    id: 'myst_thrill_5',
    title: 'Mestre do Mistério & Crime',
    description: 'Devore intrigas e investigações policiais intrigantes.',
    badge: '🕵️‍♂️',
    category: 'Mistério & Policial',
    targetCount: 5,
    genreKeywords: ['Mistério', 'Suspense', 'Policial', 'Thriller Psicológico', 'Investigação']
  },
  {
    id: 'hq_fanatic_5',
    title: 'Maratona da Nona Arte',
    description: 'Aprecie a arte sequencial lendo histórias em quadrinhos.',
    badge: '🦸‍♂️',
    category: 'HQ / Quadrinho',
    targetCount: 5,
    genreKeywords: ['Quadrinho', 'Marvel', 'DC'],
    types: [BookType.HQ]
  },
  {
    id: 'scifi_voyage_3',
    title: 'Desbravador Cósmico',
    description: 'Trilhe as estrelas, futuros alternativos e ficção científica pura.',
    badge: '🚀',
    category: 'Ficção Científica',
    targetCount: 3,
    genreKeywords: ['Ficção', 'Científico', 'Espacial', 'Contos']
  },
  {
    id: 'mind_power_3',
    title: 'Impulso Próprio',
    description: 'Fortaleça a sua mentalidade, negócios e habilidades gerais.',
    badge: '💡',
    category: 'Autoajuda & Negócios',
    targetCount: 3,
    genreKeywords: ['Autoajuda', 'Negócio', 'Biografia', 'Economia']
  },
  {
    id: 'fantasy_legends_3',
    title: 'Explorador de lendas',
    description: 'Visite impérios perdidos e universos fantásticos mágicos.',
    badge: '🧝‍♂️',
    category: 'Fantasia & Aventura',
    targetCount: 3,
    genreKeywords: ['Fantasia', 'Aventura', 'Mitologia', 'Misticismo']
  },
  {
    id: 'heavy_books_2',
    title: 'Devorador de Tijolo',
    description: 'Termine tomos e calhamaços desafiadores com mais de 450 páginas.',
    badge: '📚',
    category: 'Calhamaços',
    targetCount: 2,
    genreKeywords: [],
    minPages: 450
  },
  {
    id: 'classics_traveler_3',
    title: 'Turismo no Tempo',
    description: 'Descubra grandes clássicos universais ou narrativas históricas.',
    badge: '🏛️',
    category: 'Clássicos & História',
    targetCount: 3,
    genreKeywords: ['Clássico', 'História']
  },
  {
    id: 'high_rated_3',
    title: 'Crítico Exigente',
    description: 'Marque 3 leituras excelentes com avaliações de no mínimo 4.5 estrelas.',
    badge: '⭐',
    category: 'Crítica',
    targetCount: 3,
    genreKeywords: [],
    minRating: 4.5
  },
  {
    id: 'series_finisher_3',
    title: 'Maratona Sequencial',
    description: 'Siga a cronologia de volumes concluindo obras vinculadas a séries.',
    badge: '🔗',
    category: 'Séries',
    targetCount: 3,
    genreKeywords: [],
    requiresSeries: true
  }
];

interface ReadingChallengesProps {
  books: Book[];
  profile: Profile | null;
}

export const ReadingChallenges: React.FC<ReadingChallengesProps> = ({ books, profile }) => {
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [customChallenges, setCustomChallenges] = useState<ChallengeType[]>([]);
  const [activeTab, setActiveTab] = useState<'joined' | 'available' | 'completed' | 'badges'>('joined');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  const userId = profile?.id || 'anonymous';

  // Load configuration and custom challenges from localStorage
  useEffect(() => {
    try {
      const storedJoined = localStorage.getItem(`biblio_tech_joined_challenges_${userId}`);
      if (storedJoined) {
        setJoinedIds(JSON.parse(storedJoined));
      } else {
        // By default, join the Detective & Comic fan challenges so it looks beautiful
        const initialJoined = ['myst_thrill_5', 'hq_fanatic_5'];
        setJoinedIds(initialJoined);
        localStorage.setItem(`biblio_tech_joined_challenges_${userId}`, JSON.stringify(initialJoined));
      }

      const storedCustom = localStorage.getItem(`biblio_tech_custom_challenges_${userId}`);
      if (storedCustom) {
        setCustomChallenges(JSON.parse(storedCustom));
      }
    } catch (e) {
      logger.error('Error loading challenges state', e);
    }
  }, [userId]);

  // Combine predefined with custom ones
  const allChallenges = useMemo(() => {
    return [...PREDEFINED_CHALLENGES, ...customChallenges];
  }, [customChallenges]);

  // Hook 1: Progress calculations
  const { challengesWithStats } = useChallengeProgress(allChallenges, books);

  // Hook 2: Badge unlocks & persistence
  const { badgesRecord, unlockedDates, unlockedBadgesCount } = useBadgeUnlocks(
    userId,
    joinedIds,
    customChallenges,
    challengesWithStats
  );

  // Utility: Grouping and stats summary
  const {
    joinedChallenges,
    availableChallenges,
    completedChallenges,
    totalCompletedCount,
    activeChallengesCount,
    successRate
  } = groupChallengesAndStats(challengesWithStats, joinedIds);

  // Join a challenge
  const handleJoinChallenge = (id: string) => {
    if (joinedIds.includes(id)) return;
    const updated = [...joinedIds, id];
    setJoinedIds(updated);
    localStorage.setItem(`biblio_tech_joined_challenges_${userId}`, JSON.stringify(updated));
  };

  // Leave / Reset a challenge
  const handleLeaveChallenge = (id: string) => {
    const updated = joinedIds.filter(x => x !== id);
    setJoinedIds(updated);
    localStorage.setItem(`biblio_tech_joined_challenges_${userId}`, JSON.stringify(updated));
  };

  // Create custom thematic challenge
  const handleCreateCustomChallenge = (newChallenge: ChallengeType) => {
    const updatedCustomList = [...customChallenges, newChallenge];
    setCustomChallenges(updatedCustomList);
    localStorage.setItem(`biblio_tech_custom_challenges_${userId}`, JSON.stringify(updatedCustomList));

    // Auto-join
    const updatedJoined = [...joinedIds, newChallenge.id];
    setJoinedIds(updatedJoined);
    localStorage.setItem(`biblio_tech_joined_challenges_${userId}`, JSON.stringify(updatedJoined));

    setIsCreatingCustom(false);
  };

  // Delete custom challenge
  const handleDeleteCustomChallenge = (id: string) => {
    const updatedCustom = customChallenges.filter(c => c.id !== id);
    setCustomChallenges(updatedCustom);
    localStorage.setItem(`biblio_tech_custom_challenges_${userId}`, JSON.stringify(updatedCustom));

    const updatedJoined = joinedIds.filter(x => x !== id);
    setJoinedIds(updatedJoined);
    localStorage.setItem(`biblio_tech_joined_challenges_${userId}`, JSON.stringify(updatedJoined));
  };

  // Derived badges for visual filters
  const filteredBadges = useMemo(() => {
    return badgesRecord.filter(b => {
      if (badgeFilter === 'unlocked') return b.isUnlocked;
      if (badgeFilter === 'locked') return !b.isUnlocked;
      return true;
    });
  }, [badgesRecord, badgeFilter]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 pb-32">
      {/* HEADER SECTION */}
      <div className="mb-8 md:mb-10 text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-slate-50 dark:bg-slate-800/20 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-2xl">🏆</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Desafios Temáticos
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-xl">
            Inscreva-se em campanhas temáticas para colocar suas capacidades de leitura à prova. Seus marcos são recalculados automaticamente e em tempo real a partir dos seus livros marcados como concluídos!
          </p>
        </div>

        <button 
          onClick={() => setIsCreatingCustom(true)}
          className="px-5 py-3 rounded-2xl bg-primary hover:bg-violet-700 text-white text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2"
        >
          ➕ Criar Desafio
        </button>
      </div>

      {/* STATS SUMMARY ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-xl">
            🔥
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ativos</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{activeChallengesCount} em progresso</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-xl">
            🥇
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trofús Ganhos</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{totalCompletedCount} Concluídos</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-150 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-xl">
            📈
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sua Consistência</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {allChallenges.length > 0 
                ? `${successRate}% de sucesso` 
                : 'Crie seu alvo'}
            </h3>
          </div>
        </div>
      </div>

      {/* PORTAL DE SELEÇÃO TABS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-slate-150 dark:border-slate-800/80 mb-6 p-1 bg-slate-50 dark:bg-slate-950/20 rounded-2xl gap-2">
        <button 
          onClick={() => setActiveTab('joined')}
          className={`py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'joined' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🚀 Seus Desafios ({joinedChallenges.length})
        </button>

        <button 
          onClick={() => setActiveTab('available')}
          className={`py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'available' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🎯 Disponíveis ({availableChallenges.length})
        </button>

        <button 
          onClick={() => setActiveTab('completed')}
          className={`py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'completed' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🏆 Galeria de Ouro ({completedChallenges.length})
        </button>

        <button 
          onClick={() => setActiveTab('badges')}
          className={`py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'badges' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🎖️ Medalhas ({unlockedBadgesCount}/{badgesRecord.length})
        </button>
      </div>

      {/* TAB CONTENT GRID */}
      <div className="space-y-6">
        {/* VIEW 1: JOINED IN PROGRESS CHALLENGES */}
        {activeTab === 'joined' && (
          <div>
            {joinedChallenges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-150 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-full flex items-center justify-center text-3xl mb-4">⚓</div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Nenhum desafio ativo</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm px-4">
                  Navegue até a aba "Disponíveis" e inscreva-se nos temas sugeridos para testar seus marcos literários!
                </p>
                <button 
                  onClick={() => setActiveTab('available')}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                  Ver desafios sugeridos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {joinedChallenges.map(chal => (
                  <motion.div 
                    key={chal.id}
                    layoutId={chal.id}
                    className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge / Category Header */}
                      <div className="flex items-start justify-between">
                        <span className="text-4xl p-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl block">{chal.badge}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[8.5px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1 rounded-full">{chal.category}</span>
                          {chal.isCustom && (
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full mt-1">Customizado</span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-base font-black text-slate-850 dark:text-slate-100 mt-4 leading-tight">{chal.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">{chal.description}</p>
                    </div>

                    {/* Meta Criteria Information */}
                    <div className="my-4 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400 space-y-1">
                      <p>📋 <span className="font-bold text-slate-700 dark:text-slate-300">Requisito:</span> Ler {chal.targetCount} {chal.types?.includes(BookType.HQ) ? 'HQs' : 'livros'}.</p>
                      {chal.genreKeywords.length > 0 && (
                        <p>🏷️ <span className="font-bold text-slate-700 dark:text-slate-300">Gêneros aceitos:</span> {chal.genreKeywords.join(', ')}</p>
                      )}
                      {chal.minPages && <p>📄 <span className="font-bold text-slate-700 dark:text-slate-300">Páginas mínimas:</span> {chal.minPages} pgs</p>}
                      {chal.minRating && <p>⭐ <span className="font-bold text-slate-700 dark:text-slate-300">Avaliação mínima:</span> {chal.minRating} ★</p>}
                      {chal.requiresSeries && <p>🔗 <span className="font-bold text-slate-700 dark:text-slate-300">Condição:</span> Deve fazer parte de uma série/saga</p>}
                    </div>

                    {/* Progress details */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider mb-2">
                        <span className="text-slate-400">Progresso</span>
                        <span className="text-primary font-mono">{chal.currentCount} / {chal.targetCount} ({chal.percentage}%)</span>
                      </div>
                      
                      {/* Progress Bar Container */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${chal.percentage}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>

                      {/* Matching Books Trackers */}
                      {chal.matchedBooks.length > 0 && (
                        <div className="mt-3">
                           <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Livros que contaram:</p>
                           <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                             {chal.matchedBooks.map(b => (
                               <span key={b.id} className="text-[8.5px] font-bold px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]" title={b.title}>
                                 ✓ {b.title}
                               </span>
                             ))}
                           </div>
                        </div>
                      )}

                      {/* Controls */}
                      <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                        {chal.isCustom ? (
                          <button 
                            onClick={() => handleDeleteCustomChallenge(chal.id)}
                            className="text-[9px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition"
                          >
                            Excluir desafio
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleLeaveChallenge(chal.id)}
                            className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                          >
                            Abandonar foco
                          </button>
                        )}
                        
                        <div className="text-[10px] font-bold text-slate-400 capitalize">
                          Automatico
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: AVAILABLE THEMATIC CHALLENGES */}
        {activeTab === 'available' && (
          <div>
            {availableChallenges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-150 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-full flex items-center justify-center text-3xl mb-4">✨</div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Você já se inscreveu em tudo!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm px-4">
                  Você está participando de todas as campanhas em nossa estante literária. Desejamos uma excelente leitura!
                </p>
                <button 
                  onClick={() => setIsCreatingCustom(true)}
                  className="mt-4 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-[10px] uppercase tracking-wider transition-all hover:scale-103 active:scale-97"
                >
                  ➕ Criar novo desafio customizado
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableChallenges.map(chal => (
                  <motion.div 
                    key={chal.id}
                    layoutId={chal.id}
                    className="p-5 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] border border-slate-150/60 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge / Category */}
                      <div className="flex items-start justify-between">
                        <span className="text-3xl p-2 bg-white dark:bg-slate-900 rounded-xl block shadow-sm">{chal.badge}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-850 px-2.5 py-1 rounded-full">{chal.category}</span>
                          {chal.isCustom && (
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full mt-1">Criado</span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-4 leading-tight">{chal.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">{chal.description}</p>
                    </div>

                    <div>
                      {/* Requirements display */}
                      <div className="my-3 text-[9px] font-medium text-slate-400 space-y-0.5 border-t border-dashed border-slate-200 dark:border-slate-800 pt-3">
                        <p>🎯 Alvo: LER {chal.targetCount} {chal.types?.includes(BookType.HQ) ? 'HQs' : 'livros'}.</p>
                        {chal.genreKeywords.length > 0 && (
                          <p>🏷️ Gênero: {chal.genreKeywords[0]} ou similar</p>
                        )}
                        {chal.minPages && <p>📄 Mínimo {chal.minPages} Páginas</p>}
                        {chal.minRating && <p>★ Avaliação {chal.minRating}+</p>}
                      </div>

                      <div className="flex gap-2 items-center mt-4 pt-2">
                        <button 
                          onClick={() => handleJoinChallenge(chal.id)}
                          className="w-full py-2.5 rounded-xl bg-white dark:bg-slate-800 select-none hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 transition hover:shadow-md"
                        >
                          Entrar no Desafio
                        </button>
                        
                        {chal.isCustom && (
                          <button 
                            onClick={() => handleDeleteCustomChallenge(chal.id)}
                            className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20"
                            title="Deletar este desafio permanente"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: COMPLETED GALLERY OF TROPHIES */}
        {activeTab === 'completed' && (
          <div>
            {completedChallenges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-150 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-full flex items-center justify-center text-3xl mb-4">🔒</div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Nenhum troféu conquistado ainda</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm px-4">
                  Marque seus livros correspondentes como "Lido" nas outras abas da biblioteca e assista o progresso subir até 100%!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {completedChallenges.map(chal => (
                  <motion.div 
                    key={chal.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-[2.5rem] bg-gradient-to-b from-amber-500/5 to-amber-500/10 dark:from-yellow-500/5 dark:to-yellow-500/10 border border-yellow-250 dark:border-yellow-900/40 text-center flex flex-col justify-between shadow-sm relative overflow-hidden group"
                  >
                    {/* Glowing highlight sphere */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-400/10 dark:bg-yellow-400/5 blur-xl rounded-full" />

                    <div>
                      {/* Trophy Medal Representation */}
                      <span className="text-5xl block my-2 transform group-hover:scale-110 group-hover:rotate-6 transition duration-300">
                        🏆
                      </span>
                      <span className="text-[40px] block absolute top-2 right-1/2 translate-x-4 opacity-10 leading-none">
                        {chal.badge}
                      </span>

                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight uppercase tracking-tight mt-3">
                        {chal.title}
                      </h3>
                      <p className="text-[10px] text-yellow-600 dark:text-yellow-500 font-black uppercase tracking-widest mt-1 mb-3">
                        Completado!
                      </p>
                      
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-1">
                        Sua meta era de {chal.targetCount} livros e você adicionou com perfeição estes marcos literários!
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-yellow-200/55 dark:border-yellow-900/20">
                      <span className="text-[9px] font-bold text-slate-400 block mb-2 uppercase">Concluído em nossa estante</span>
                      <div className="max-h-12 overflow-y-auto space-y-1">
                        {chal.matchedBooks.slice(0, 3).map(b => (
                          <p key={b.id} className="text-[8px] font-bold text-slate-600 dark:text-slate-300 line-clamp-1">✅ {b.title}</p>
                        ))}
                        {chal.matchedBooks.length > 3 && (
                          <p className="text-[7.5px] font-medium text-slate-400">e outros {chal.matchedBooks.length - 3} livros...</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: MEDALHAS / REWARDS BADGES */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            {/* Badges Progress Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl text-amber-500 animate-pulse">🎖️</div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Quadro de Conquistas Literárias</h3>
                  <p className="text-xs text-slate-500 mt-1">Conclua as campanhas de leitura e crie as suas próprias metas para reivindicar as insígnias de prestígio.</p>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="flex flex-col items-end w-full md:w-auto min-w-[200px]">
                <div className="flex justify-between w-full text-xs font-black uppercase tracking-wider mb-2">
                  <span className="text-slate-400">Insígnias</span>
                  <span className="text-primary font-mono">{unlockedBadgesCount} / {badgesRecord.length} ({Math.round((unlockedBadgesCount / Math.max(1, badgesRecord.length)) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-3.5 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(unlockedBadgesCount / Math.max(1, badgesRecord.length)) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <button
                onClick={() => setBadgeFilter('all')}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border cursor-pointer ${
                  badgeFilter === 'all'
                    ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                Todas ({badgesRecord.length})
              </button>
              <button
                onClick={() => setBadgeFilter('unlocked')}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border cursor-pointer ${
                  badgeFilter === 'unlocked'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                Conquistadas ({unlockedBadgesCount})
              </button>
              <button
                onClick={() => setBadgeFilter('locked')}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition border cursor-pointer ${
                  badgeFilter === 'locked'
                    ? 'bg-slate-500 text-white border-slate-500'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                Bloqueadas ({badgesRecord.length - unlockedBadgesCount})
              </button>
            </div>

            {/* Badges Grid */}
            {filteredBadges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-150 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-full flex items-center justify-center text-3xl mb-4">🏆</div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Nenhum resultado correspondente</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm px-4">Tente selecionar outra categoria de filtro acima.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredBadges.map(badge => {
                  // Rarity specific configurations
                  const getsRarityColor = () => {
                    switch(badge.rarity) {
                      case 'Comum':
                        return {
                          title: 'text-slate-500 dark:text-slate-400',
                          badgeBg: 'bg-slate-100 dark:bg-slate-800/60',
                          border: 'border-slate-200 dark:border-slate-800',
                          radial: 'bg-slate-400/5',
                          glow: 'shadow-sm',
                          bgColor: 'bg-white dark:bg-slate-900',
                          label: 'Comum'
                        };
                      case 'Raro':
                        return {
                          title: 'text-indigo-600 dark:text-indigo-400',
                          badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
                          border: 'border-indigo-200 dark:border-indigo-900/50',
                          radial: 'bg-indigo-400/10 dark:bg-indigo-400/5',
                          glow: 'shadow-[0_0_15px_rgba(99,102,241,0.12)]',
                          bgColor: 'bg-gradient-to-b from-indigo-50/5 to-indigo-100/10 dark:from-indigo-105/5 dark:to-indigo-950/5',
                          label: 'Raro'
                        };
                      case 'Épico':
                        return {
                          title: 'text-pink-600 dark:text-pink-400 font-extrabold',
                          badgeBg: 'bg-pink-50 dark:bg-pink-950/40',
                          border: 'border-pink-200 dark:border-pink-900/50',
                          radial: 'bg-pink-400/10 dark:bg-pink-400/5',
                          glow: 'shadow-[0_0_20px_rgba(236,72,153,0.15)]',
                          bgColor: 'bg-gradient-to-b from-pink-50/5 to-pink-100/10 dark:from-pink-955/5 dark:to-pink-950/5',
                          label: 'Épico'
                        };
                      case 'Lendário':
                        return {
                          title: 'text-amber-600 dark:text-yellow-500 font-black',
                          badgeBg: 'bg-amber-100 dark:bg-amber-950/50',
                          border: 'border-amber-400 dark:border-amber-600',
                          radial: 'bg-amber-400/20 dark:bg-yellow-400/10',
                          glow: 'shadow-[0_0_25px_rgba(234,179,8,0.22)] border-[1.5px]',
                          bgColor: 'bg-gradient-to-b from-amber-50/10 to-yellow-105/15 dark:from-amber-950/10 dark:to-yellow-950/15',
                          label: 'Lendário'
                        };
                    }
                  };

                  const rarityStyle = getsRarityColor();

                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={badge.isUnlocked ? { y: -6, transition: { duration: 0.2 } } : {}}
                      className={`relative p-6 rounded-[2.5rem] border ${rarityStyle.border} ${
                        badge.isUnlocked 
                          ? `${rarityStyle.bgColor} ${rarityStyle.glow}` 
                          : 'bg-slate-50/30 dark:bg-slate-900/30 select-none'
                      } text-center flex flex-col justify-between overflow-hidden transition-all duration-300`}
                    >
                      {/* Ambient glowing radial effect */}
                      {badge.isUnlocked && (
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 ${rarityStyle.radial} blur-2xl rounded-full`} />
                      )}

                      <div>
                        {/* Upper Header metadata row */}
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                            badge.isUnlocked 
                              ? `${rarityStyle.badgeBg} ${rarityStyle.title}`
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {rarityStyle.label}
                          </span>
                          
                          {!badge.isUnlocked && (
                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                              🔒 Bloqueada
                            </span>
                          )}
                        </div>

                        {/* Badge Icon Shield */}
                        <div className="relative my-4 flex items-center justify-center">
                          <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center text-4xl transition-transform duration-300 ${
                            badge.isUnlocked 
                              ? `${rarityStyle.badgeBg} transform hover:scale-110 shadow-sm border border-white/10` 
                              : 'bg-slate-200 dark:bg-slate-800 filter grayscale opacity-45'
                          }`}>
                            {badge.icon}
                          </div>
                        </div>

                        {/* Text Title */}
                        <h3 className={`text-sm font-black tracking-tight leading-tight uppercase ${
                          badge.isUnlocked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {badge.title}
                        </h3>

                        {/* Text requirement description */}
                        <p className={`text-[11px] font-medium mt-2 leading-relaxed px-1 ${
                          badge.isUnlocked ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400/80 dark:text-slate-500/85'
                        }`}>
                          {badge.isUnlocked ? badge.description : badge.unlockedConditionText}
                        </p>
                      </div>

                      {/* Bottom Unlock Timestamp info */}
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                        {badge.isUnlocked ? (
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            🏆 Conquistada {unlockedDates[badge.id] || new Date().toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-[8.5px] font-bold text-slate-400/60 uppercase tracking-widest block">
                            Progresso: Bloqueado
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CREATE CUSTOM THEMATIC CHALLENGE */}
      <CustomChallengeForm
        isOpen={isCreatingCustom}
        onClose={() => setIsCreatingCustom(false)}
        onSubmit={handleCreateCustomChallenge}
        profile={profile}
      />
    </div>
  );
};
