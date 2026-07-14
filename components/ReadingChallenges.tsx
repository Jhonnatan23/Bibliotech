import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Book, Profile } from '../types';
import { BookStatus, BookType, GENRES } from '../types';

export interface ChallengeType {
  id: string;
  title: string;
  description: string;
  badge: string; // Emoji representing the trophy/badge
  category: string;
  targetCount: number;
  genreKeywords: string[]; // genres list
  types?: BookType[];     // [Book, HQ]
  minPages?: number;        // page requirement
  minRating?: number;       // rating filter
  requiresSeries?: boolean; // if true, must belong to a trilogy/series
  isCustom?: boolean;       // whether it was created by the user
}

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
  const [unlockedDates, setUnlockedDates] = useState<Record<string, string>>({});
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  
  // Custom challenge form state
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customBadge, setCustomBadge] = useState('🏆');
  const [customTarget, setCustomTarget] = useState(3);
  const [customGenre, setCustomGenre] = useState('');
  const [customType, setCustomType] = useState<BookType | 'Ambos'>('Ambos');
  const [customPagesMin, setCustomPagesMin] = useState(0);
  const [customRatingMin, setCustomRatingMin] = useState(0);

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

      const storedUnlocks = localStorage.getItem(`biblio_tech_badge_unlocks_${userId}`);
      if (storedUnlocks) {
        setUnlockedDates(JSON.parse(storedUnlocks));
      }
    } catch (e) {
      console.error('Error loading challenges state', e);
    }
  }, [userId]);

  // Combine predefined with custom ones
  const allChallenges = useMemo(() => {
    return [...PREDEFINED_CHALLENGES, ...customChallenges];
  }, [customChallenges]);

  // Function to calculate exact progress count on any challenge
  const getChallengeProgress = (challenge: ChallengeType) => {
    const readBooks = books.filter(b => b.status === BookStatus.Read);
    let matchedBooks = readBooks;

    // 1. By type
    if (challenge.types && challenge.types.length > 0) {
      matchedBooks = matchedBooks.filter(b => challenge.types!.includes(b.type));
    }

    // 2. By genre keywords
    if (challenge.genreKeywords && challenge.genreKeywords.length > 0) {
      matchedBooks = matchedBooks.filter(b => {
        if (!b.genre) return false;
        const g = b.genre.trim().toLowerCase();
        return challenge.genreKeywords.some(kw => 
          g === kw.toLowerCase() || g.includes(kw.toLowerCase())
        );
      });
    }

    // 3. By minimum page length
    if (challenge.minPages && challenge.minPages > 0) {
      matchedBooks = matchedBooks.filter(b => b.pages >= challenge.minPages!);
    }

    // 4. By star rating
    if (challenge.minRating && challenge.minRating > 0) {
      matchedBooks = matchedBooks.filter(b => b.rating && b.rating >= challenge.minRating!);
    }

    // 5. By series attachment
    if (challenge.requiresSeries) {
      matchedBooks = matchedBooks.filter(b => b.series && b.series.trim() !== '');
    }

    return {
      current: matchedBooks.length,
      matchedList: matchedBooks
    };
  };

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

  // Create custom thematic challenge description
  const handleCreateCustomChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newChallenge: ChallengeType = {
      id: `custom_chal_${Date.now()}`,
      title: customTitle,
      description: customDescription || `Desafio de leitura customizado criado por ${profile?.fullName || 'você'}.`,
      badge: customBadge,
      category: 'Personalizado',
      targetCount: customTarget,
      genreKeywords: customGenre ? [customGenre] : [],
      types: customType !== 'Ambos' ? [customType] : undefined,
      minPages: customPagesMin > 0 ? customPagesMin : undefined,
      minRating: customRatingMin > 0 ? customRatingMin : undefined,
      isCustom: true
    };

    const updatedCustomList = [...customChallenges, newChallenge];
    setCustomChallenges(updatedCustomList);
    localStorage.setItem(`biblio_tech_custom_challenges_${userId}`, JSON.stringify(updatedCustomList));

    // Auto-join
    const updatedJoined = [...joinedIds, newChallenge.id];
    setJoinedIds(updatedJoined);
    localStorage.setItem(`biblio_tech_joined_challenges_${userId}`, JSON.stringify(updatedJoined));

    // Reset Form
    setCustomTitle('');
    setCustomDescription('');
    setCustomBadge('🏆');
    setCustomTarget(3);
    setCustomGenre('');
    setCustomType('Ambos');
    setCustomPagesMin(0);
    setCustomRatingMin(0);
    setIsCreatingCustom(false);
  };

  const handleDeleteCustomChallenge = (id: string) => {
    const updatedCustom = customChallenges.filter(c => c.id !== id);
    setCustomChallenges(updatedCustom);
    localStorage.setItem(`biblio_tech_custom_challenges_${userId}`, JSON.stringify(updatedCustom));

    const updatedJoined = joinedIds.filter(x => x !== id);
    setJoinedIds(updatedJoined);
    localStorage.setItem(`biblio_tech_joined_challenges_${userId}`, JSON.stringify(updatedJoined));
  };

  // Category statistics/challenges grouping
  const challengesWithStats = useMemo(() => {
    return allChallenges.map(chal => {
      const stats = getChallengeProgress(chal);
      const percentage = Math.min(100, Math.round((stats.current / chal.targetCount) * 100));
      return {
        ...chal,
        currentCount: stats.current,
        percentage,
        isCompleted: stats.current >= chal.targetCount,
        matchedBooks: stats.matchedList
      };
    });
  }, [allChallenges, books]);

  // Divided arrays maps
  const joinedChallenges = challengesWithStats.filter(c => joinedIds.includes(c.id) && !c.isCompleted);
  const availableChallenges = challengesWithStats.filter(c => !joinedIds.includes(c.id) && !c.isCompleted);
  const completedChallenges = challengesWithStats.filter(c => joinedIds.includes(c.id) && c.isCompleted);

  // General statistics summary
  const totalCompletedCount = challengesWithStats.filter(c => joinedIds.includes(c.id) && c.isCompleted).length;
  const activeChallengesCount = joinedChallenges.length;

  // Memoized Badges list and unlock checkers
  const badgesRecord = useMemo(() => {
    return [
      {
        id: 'badge_first_joined',
        title: 'Pioneiro Literário',
        description: 'Você aceitou seu primeiro desafio e iniciou sua jornada em direção ao topo.',
        icon: '🔰',
        rarity: 'Comum' as const,
        unlockedConditionText: 'Inscrever-se em pelo menos 1 desafio',
        isUnlocked: joinedIds.length >= 1
      },
      {
         id: 'badge_myst_thrill',
         title: 'Cérebro de Titânio',
         description: 'Sua lógica impecável desvendou os crimes mais sombrios e misteriosos.',
         icon: '🧠',
         rarity: 'Raro' as const,
         unlockedConditionText: 'Completar o desafio "Mestre do Mistério & Crime"',
         isUnlocked: challengesWithStats.some(c => c.id === 'myst_thrill_5' && c.isCompleted)
      },
      {
         id: 'badge_hq_fanatic',
         title: 'Senhor dos Quadrinhos',
         description: 'Provou que a nona arte tem as narrativas e nuances mais épicas do mundo.',
         icon: '💥',
         rarity: 'Comum' as const,
         unlockedConditionText: 'Completar o desafio "Maratona da Nona Arte"',
         isUnlocked: challengesWithStats.some(c => c.id === 'hq_fanatic_5' && c.isCompleted)
      },
      {
         id: 'badge_scifi_voyage',
         title: 'Ficcionista Cósmico',
         description: 'Atravessou de pontes para outras galáxias e explorou o futuro da tecnologia estelar.',
         icon: '🪐',
         rarity: 'Raro' as const,
         unlockedConditionText: 'Completar o desafio "Desbravador Cósmico"',
         isUnlocked: challengesWithStats.some(c => c.id === 'scifi_voyage_3' && c.isCompleted)
      },
      {
         id: 'badge_mind_power',
         title: 'Magnata do Conhecimento',
         description: 'Desenvolveu as melhores estratégias reais de crescimento mental e profissional.',
         icon: '💼',
         rarity: 'Raro' as const,
         unlockedConditionText: 'Completar o desafio "Impulso Próprio"',
         isUnlocked: challengesWithStats.some(c => c.id === 'mind_power_3' && c.isCompleted)
      },
      {
         id: 'badge_fantasy_legends',
         title: 'Cavaleiro de Elrond',
         description: 'Desbravou reinos desconhecidos e criaturas mágicas com maestria e precisão.',
         icon: '⚔️',
         rarity: 'Raro' as const,
         unlockedConditionText: 'Completar o desafio "Explorador de lendas"',
         isUnlocked: challengesWithStats.some(c => c.id === 'fantasy_legends_3' && c.isCompleted)
      },
      {
         id: 'badge_heavy_books',
         title: 'Estômago de Aço',
         description: 'Nenhum calhamaço ou tomo gigantesco foi o suficiente para assustar seu intelecto.',
         icon: '🏋️‍♂️',
         rarity: 'Épico' as const,
         unlockedConditionText: 'Completar o desafio "Devorador de Tijolo"',
         isUnlocked: challengesWithStats.some(c => c.id === 'heavy_books_2' && c.isCompleted)
      },
      {
         id: 'badge_classics_traveler',
         title: 'Viajante do Tempo',
         description: 'Fez turismo histórico através de obras atemporais de grandes mestres da humanidade.',
         icon: '⏳',
         rarity: 'Épico' as const,
         unlockedConditionText: 'Completar o desafio "Turismo no Tempo"',
         isUnlocked: challengesWithStats.some(c => c.id === 'classics_traveler_3' && c.isCompleted)
      },
      {
         id: 'badge_high_rated',
         title: 'Crítico Supremo',
         description: 'Suas leituras alcançaram excelência máxima, colecionando resenhas do mais alto nível.',
         icon: '🎖️',
         rarity: 'Épico' as const,
         unlockedConditionText: 'Completar o desafio "Crítico Exigente"',
         isUnlocked: challengesWithStats.some(c => c.id === 'high_rated_3' && c.isCompleted)
      },
      {
         id: 'badge_series_finisher',
         title: 'Lenda das Sagas',
         description: 'Acompanhou cada detalhe e concluiu os arcos mais profundos das séries literárias.',
         icon: '⛓️',
         rarity: 'Épico' as const,
         unlockedConditionText: 'Completar o desafio "Maratona Sequencial"',
         isUnlocked: challengesWithStats.some(c => c.id === 'series_finisher_3' && c.isCompleted)
      },
      {
         id: 'badge_custom_creator',
         title: 'Arquiteto de Alvos',
         description: 'Estabeleceu seus próprios caminhos literários com regras personalizadas.',
         icon: '🛠️',
         rarity: 'Raro' as const,
         unlockedConditionText: 'Criar pelo menos 1 desafio customizado',
         isUnlocked: customChallenges.length >= 1
      },
      {
         id: 'badge_triple_threat',
         title: 'Colecionador de Elite',
         description: 'Mais do que um leitor comum, você detém uma coleção rica em troféus conquistados.',
         icon: '🔮',
         rarity: 'Lendário' as const,
         unlockedConditionText: 'Completar pelo menos 3 desafios quaisquer',
         isUnlocked: completedChallenges.length >= 3
      }
    ];
  }, [joinedIds, challengesWithStats, customChallenges, completedChallenges]);

  // Handle automatic badge unlocks, updating localStorage and react state
  useEffect(() => {
    try {
      const storedUnlocks = localStorage.getItem(`biblio_tech_badge_unlocks_${userId}`);
      let loadedUnlocks: Record<string, string> = {};
      if (storedUnlocks) {
        loadedUnlocks = JSON.parse(storedUnlocks);
      }

      let changed = false;
      badgesRecord.forEach(badge => {
        if (badge.isUnlocked && !loadedUnlocks[badge.id]) {
          loadedUnlocks[badge.id] = new Date().toLocaleDateString('pt-BR');
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem(`biblio_tech_badge_unlocks_${userId}`, JSON.stringify(loadedUnlocks));
        setUnlockedDates(loadedUnlocks);
      } else if (Object.keys(unlockedDates).length === 0 && Object.keys(loadedUnlocks).length > 0) {
        setUnlockedDates(loadedUnlocks);
      }
    } catch (e) {
      console.error('Error verifying rewards unlocks', e);
    }
  }, [badgesRecord, userId, unlockedDates]);

  // Derived badges for visual filters
  const filteredBadges = useMemo(() => {
    return badgesRecord.filter(b => {
      if (badgeFilter === 'unlocked') return b.isUnlocked;
      if (badgeFilter === 'locked') return !b.isUnlocked;
      return true;
    });
  }, [badgesRecord, badgeFilter]);

  const unlockedBadgesCount = badgesRecord.filter(b => b.isUnlocked).length;

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
                ? `${Math.round((totalCompletedCount / Math.max(1, joinedIds.length)) * 100)}% de sucesso` 
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
                            className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
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
                <p className="text-xs text-slate-500 mt-1 max-w-xs px-4">Tente selecionar outra categoria de filtro acima.</p>
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
      <AnimatePresence>
        {isCreatingCustom && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    👑 Novo Desafio Customizado
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Defina suas próprias regras de leitura de forma livre e flexível.</p>
                </div>
                <button 
                  onClick={() => setIsCreatingCustom(false)}
                  className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-105 dark:border-slate-700 text-slate-400 hover:text-slate-600 transition"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateCustomChallenge} className="p-6 md:p-8 space-y-4 overflow-y-auto max-h-[65Vh]">
                {/* ID Title */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Título do Desafio *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Fantasia Épica de Inverno"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                  />
                </div>

                {/* Subtitle description */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Breve Descrição</label>
                  <input 
                    type="text"
                    placeholder="Ex: Concluir as maiores trilogias de RPG e literatura fantásticas."
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  />
                </div>

                {/* Badge Emoji Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Ícone / Medalha</label>
                    <select 
                      value={customBadge}
                      onChange={(e) => setCustomBadge(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                    >
                      <option value="🏆">🏆 Troféu de Ouro</option>
                      <option value="👑">👑 Coroa de Ferro</option>
                      <option value="🕵️‍♂️">🕵️‍♂️ Detetive</option>
                      <option value="🚀">🚀 Foguete Espacial</option>
                      <option value="🪄">🪄 Varinha Mágica</option>
                      <option value="🧠">🧠 Intelectual</option>
                      <option value="🔥">🔥 Fogo/Foco</option>
                      <option value="💀">💀 Terror Extremo</option>
                      <option value="🍃">🍃 Filosofal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Target (Livros) *</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={customTarget}
                      onChange={(e) => setCustomTarget(parseInt(e.target.value) || 3)}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                    />
                  </div>
                </div>

                {/* Criteria configurations */}
                <div className="border-t border-slate-100 dark:border-slate-800/85 pt-4 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Especificar Filtros Automáticos</span>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Filtrar Gênero</label>
                      <select 
                        value={customGenre}
                        onChange={(e) => setCustomGenre(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                      >
                        <option value="">Qualquer gênero</option>
                        {GENRES.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tipo de Obra</label>
                      <select 
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                      >
                        <option value="Ambos">Livro ou HQ</option>
                        <option value={BookType.Book}>Somente Livros</option>
                        <option value={BookType.HQ}>Somente HQs</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Páginas Mínimas</label>
                      <input 
                        type="number"
                        min={0}
                        placeholder="Ex: 200 (0 para desativar)"
                        value={customPagesMin || ''}
                        onChange={(e) => setCustomPagesMin(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Estrelas Mínimas</label>
                      <select 
                        value={customRatingMin}
                        onChange={(e) => setCustomRatingMin(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                      >
                        <option value={0}>Sem filtro de estrelas</option>
                        <option value={3.0}>Mínimo 3★</option>
                        <option value={4.0}>Mínimo 4★</option>
                        <option value={4.5}>Mínimo 4.5★</option>
                        <option value={5.0}>Apenas Perfeitos (5★)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submittal buttons */}
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsCreatingCustom(false)}
                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-350 bg-slate-50 hover:bg-slate-100 dark:bg-slate-855 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 transition"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-primary hover:bg-violet-700 rounded-2xl transition shadow-md"
                  >
                    Salvar e Entrar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
