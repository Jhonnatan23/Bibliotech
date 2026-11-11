import { useMemo } from 'react';
import { Book, BookStatus, ChallengeType } from '../types';

export function useChallengeProgress(allChallenges: ChallengeType[], books: Book[]) {
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
        const genreStr = (b.genre || '').trim().toLowerCase();
        if (!genreStr) return false;
        return challenge.genreKeywords.some(kw => {
          const kwLower = (kw || '').trim().toLowerCase();
          return kwLower ? (genreStr === kwLower || genreStr.includes(kwLower)) : false;
        });
      });
    }

    // 3. By minimum page length
    if (challenge.minPages && challenge.minPages > 0) {
      matchedBooks = matchedBooks.filter(b => (b.pages || 0) >= challenge.minPages!);
    }

    // 4. By star rating
    if (challenge.minRating && challenge.minRating > 0) {
      matchedBooks = matchedBooks.filter(b => b.rating !== undefined && b.rating !== null && b.rating >= challenge.minRating!);
    }

    // 5. By series attachment
    if (challenge.requiresSeries) {
      matchedBooks = matchedBooks.filter(b => Boolean((b.series || '').trim()));
    }

    return {
      current: matchedBooks.length,
      matchedList: matchedBooks
    };
  };

  // Category statistics/challenges grouping
  const challengesWithStats = useMemo(() => {
    return allChallenges.map(chal => {
      const stats = getChallengeProgress(chal);
      const target = (chal.targetCount && chal.targetCount > 0) ? chal.targetCount : 1;
      const percentage = Math.min(100, Math.max(0, Math.round((stats.current / target) * 100)));
      return {
        ...chal,
        currentCount: stats.current,
        percentage,
        isCompleted: stats.current >= target,
        matchedBooks: stats.matchedList
      };
    });
  }, [allChallenges, books]);

  return {
    getChallengeProgress,
    challengesWithStats,
  };
}
