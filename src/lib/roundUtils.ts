import { Round } from "../types";

/**
 * Round utility functions
 * Common operations and checks for rounds
 */

/**
 * Check if a round is completed
 */
export const isRoundCompleted = (round: Round): boolean => {
  return round?.status === "completed" || !!round?.completedAt;
};

/**
 * Check if a round has stableford scoring enabled
 */
export const isStablefordScoring = (round: Round): boolean => {
  return round.format === "stroke-play" && !!round.settings.stablefordScoring;
};

/**
 * Check if a round has handicaps enabled
 */
export const hasHandicapsEnabled = (round: Round): boolean => {
  return !!round.settings.strokesGiven;
};

/**
 * Check if a round is match play format
 */
export const isMatchPlayRound = (round: Round): boolean => {
  return !!round.isMatchPlay;
};

/**
 * Get the most recent active or completed round from a list
 */
export const getMostRecentRound = (rounds: Round[]): Round | undefined => {
  const activeRound = rounds.find((r) => r.status === "in-progress");
  if (activeRound) return activeRound;

  const completedRounds = rounds
    .filter(isRoundCompleted)
    .sort(
      (a, b) =>
        new Date(b.completedAt || 0).getTime() -
        new Date(a.completedAt || 0).getTime()
    );

  return completedRounds[0];
};

/**
 * Filter rounds to only completed ones
 */
export const getCompletedRounds = (rounds: Round[]): Round[] => {
  return rounds.filter(isRoundCompleted);
};
