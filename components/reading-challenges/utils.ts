import { ChallengeType } from '../../types';

interface ChallengeWithStats extends ChallengeType {
  currentCount: number;
  percentage: number;
  isCompleted: boolean;
  matchedBooks: any[];
}

/**
 * Pure utility function to group challenges by their status and calculate statistical summaries.
 */
export function groupChallengesAndStats(
  challengesWithStats: ChallengeWithStats[],
  joinedIds: string[]
) {
  const joinedChallenges = challengesWithStats.filter(c => joinedIds.includes(c.id) && !c.isCompleted);
  const availableChallenges = challengesWithStats.filter(c => !joinedIds.includes(c.id) && !c.isCompleted);
  const completedChallenges = challengesWithStats.filter(c => joinedIds.includes(c.id) && c.isCompleted);

  const totalCompletedCount = completedChallenges.length;
  const activeChallengesCount = joinedChallenges.length;

  const successRate = joinedIds.length > 0
    ? Math.round((totalCompletedCount / joinedIds.length) * 100)
    : 0;

  return {
    joinedChallenges,
    availableChallenges,
    completedChallenges,
    totalCompletedCount,
    activeChallengesCount,
    successRate
  };
}
