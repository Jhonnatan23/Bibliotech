import { useState, useEffect, useMemo } from 'react';
import { BadgeType, ChallengeType } from '../types';
import { logger } from '../services/monitoring';

interface ChallengeWithStats extends ChallengeType {
  currentCount: number;
  percentage: number;
  isCompleted: boolean;
  matchedBooks: any[];
}

export function useBadgeUnlocks(
  userId: string,
  joinedIds: string[],
  customChallenges: ChallengeType[],
  challengesWithStats: ChallengeWithStats[]
) {
  const [unlockedDates, setUnlockedDates] = useState<Record<string, string>>({});

  // Load unlocked badges from localStorage
  useEffect(() => {
    try {
      const storedUnlocks = localStorage.getItem(`biblio_tech_badge_unlocks_${userId}`);
      if (storedUnlocks) {
        setUnlockedDates(JSON.parse(storedUnlocks));
      } else {
        setUnlockedDates({});
      }
    } catch (e: any) {
      logger.error('Error loading badges unlocks', { error: e.message || e });
    }
  }, [userId]);

  const completedChallenges = useMemo(() => {
    return challengesWithStats.filter(c => joinedIds.includes(c.id) && c.isCompleted);
  }, [challengesWithStats, joinedIds]);

  const badgesRecord = useMemo<BadgeType[]>(() => {
    return [
      {
        id: 'badge_first_joined',
        title: 'Pioneiro Literário',
        description: 'Você aceitou seu primeiro desafio e iniciou sua jornada em direção ao topo.',
        icon: '🔰',
        rarity: 'Comum',
        unlockedConditionText: 'Inscrever-se em pelo menos 1 desafio',
        isUnlocked: joinedIds.length >= 1
      },
      {
         id: 'badge_myst_thrill',
         title: 'Cérebro de Titânio',
         description: 'Sua lógica impecável desvendou os crimes mais sombrios e misteriosos.',
         icon: '🧠',
         rarity: 'Raro',
         unlockedConditionText: 'Completar o desafio "Mestre do Mistério & Crime"',
         isUnlocked: challengesWithStats.some(c => c.id === 'myst_thrill_5' && c.isCompleted)
      },
      {
         id: 'badge_hq_fanatic',
         title: 'Senhor dos Quadrinhos',
         description: 'Provou que a nona arte tem as narrativas e nuances mais épicas do mundo.',
         icon: '💥',
         rarity: 'Comum',
         unlockedConditionText: 'Completar o desafio "Maratona da Nona Arte"',
         isUnlocked: challengesWithStats.some(c => c.id === 'hq_fanatic_5' && c.isCompleted)
      },
      {
         id: 'badge_scifi_voyage',
         title: 'Ficcionista Cósmico',
         description: 'Atravessou de pontes para outras galáxias e explorou o futuro da tecnologia estelar.',
         icon: '🪐',
         rarity: 'Raro',
         unlockedConditionText: 'Completar o desafio "Desbravador Cósmico"',
         isUnlocked: challengesWithStats.some(c => c.id === 'scifi_voyage_3' && c.isCompleted)
      },
      {
         id: 'badge_mind_power',
         title: 'Magnata do Conhecimento',
         description: 'Desenvolveu as melhores estratégias reais de crescimento mental e profissional.',
         icon: '💼',
         rarity: 'Raro',
         unlockedConditionText: 'Completar o desafio "Impulso Próprio"',
         isUnlocked: challengesWithStats.some(c => c.id === 'mind_power_3' && c.isCompleted)
      },
      {
         id: 'badge_fantasy_legends',
         title: 'Cavaleiro de Elrond',
         description: 'Desbravou reinos desconhecidos e criaturas mágicas com maestria e precisão.',
         icon: '⚔️',
         rarity: 'Raro',
         unlockedConditionText: 'Completar o desafio "Explorador de lendas"',
         isUnlocked: challengesWithStats.some(c => c.id === 'fantasy_legends_3' && c.isCompleted)
      },
      {
         id: 'badge_heavy_books',
         title: 'Estômago de Aço',
         description: 'Nenhum calhamaço ou tomo gigantesco foi o suficiente para assustar seu intelecto.',
         icon: '🏋️‍♂️',
         rarity: 'Épico',
         unlockedConditionText: 'Completar o desafio "Devorador de Tijolo"',
         isUnlocked: challengesWithStats.some(c => c.id === 'heavy_books_2' && c.isCompleted)
      },
      {
         id: 'badge_classics_traveler',
         title: 'Viajante do Tempo',
         description: 'Fez turismo histórico através de obras atemporais de grandes mestres da humanidade.',
         icon: '⏳',
         rarity: 'Épico',
         unlockedConditionText: 'Completar o desafio "Turismo no Tempo"',
         isUnlocked: challengesWithStats.some(c => c.id === 'classics_traveler_3' && c.isCompleted)
      },
      {
         id: 'badge_high_rated',
         title: 'Crítico Supremo',
         description: 'Suas leituras alcançaram excelência máxima, colecionando resenhas do mais alto nível.',
         icon: '🎖️',
         rarity: 'Épico',
         unlockedConditionText: 'Completar o desafio "Crítico Exigente"',
         isUnlocked: challengesWithStats.some(c => c.id === 'high_rated_3' && c.isCompleted)
      },
      {
         id: 'badge_series_finisher',
         title: 'Lenda das Sagas',
         description: 'Acompanhou cada detalhe e concluiu os arcos mais profundos das séries literárias.',
         icon: '⛓️',
         rarity: 'Épico',
         unlockedConditionText: 'Completar o desafio "Maratona Sequencial"',
         isUnlocked: challengesWithStats.some(c => c.id === 'series_finisher_3' && c.isCompleted)
      },
      {
         id: 'badge_custom_creator',
         title: 'Arquiteto de Alvos',
         description: 'Estabeleceu seus próprios caminhos literários com regras personalizadas.',
         icon: '🛠️',
         rarity: 'Raro',
         unlockedConditionText: 'Criar pelo menos 1 desafio customizado',
         isUnlocked: customChallenges.length >= 1
      },
      {
         id: 'badge_triple_threat',
         title: 'Colecionador de Elite',
         description: 'Mais do que um leitor comum, você detém uma coleção rica em troféus conquistados.',
         icon: '🔮',
         rarity: 'Lendário',
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
    } catch (e: any) {
      logger.error('Error verifying rewards unlocks', { error: e.message || e });
    }
  }, [badgesRecord, userId, unlockedDates]);

  const unlockedBadgesCount = useMemo(() => {
    return badgesRecord.filter(b => b.isUnlocked).length;
  }, [badgesRecord]);

  return {
    badgesRecord,
    unlockedDates,
    unlockedBadgesCount
  };
}
