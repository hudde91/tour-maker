import { Round } from "../../types";
import { getTour, saveTour } from "./tours";

/**
 * Round storage operations
 * Handles round lifecycle and scoring operations
 */

/**
 * Save or update a round in a tour
 */
export const saveRound = (tourId: string, round: Round): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  const existingRoundIndex = tour.rounds.findIndex((r) => r.id === round.id);
  if (existingRoundIndex >= 0) {
    tour.rounds[existingRoundIndex] = round;
  } else {
    tour.rounds.push(round);
  }

  saveTour(tour);
};

/**
 * Get total par for a round
 */
export const getTotalPar = (round: Round): number => {
  return (
    round.totalPar || round.holeInfo.reduce((sum, hole) => sum + hole.par, 0)
  );
};

/**
 * Start a round (change status from created to in-progress)
 */
export const startRound = (tourId: string, roundId: string): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  const round = tour.rounds.find((r) => r.id === roundId);
  if (round && round.status === "created") {
    round.status = "in-progress";
    round.startedAt = new Date().toISOString();

    // Check if this is a team scoring format (scramble)
    const isTeamScoring =
      round.format === "scramble" ||
      (round.format === "best-ball" &&
        round.settings.teamScoring === "scramble");

    if (isTeamScoring && tour.teams) {
      // Initialize empty scores for all teams
      tour.teams.forEach((team) => {
        const teamScoreKey = `team_${team.id}`;
        if (!round.scores[teamScoreKey]) {
          round.scores[teamScoreKey] = {
            playerId: teamScoreKey,
            scores: new Array(round.holes).fill(0),
            totalScore: 0,
            totalToPar: 0,
            isTeamScore: true,
            teamId: team.id,
          };
        }
      });
    } else {
      // Initialize empty scores for all players (individual format)
      tour.players.forEach((player) => {
        if (!round.scores[player.id]) {
          round.scores[player.id] = {
            playerId: player.id,
            scores: new Array(round.holes).fill(0),
            totalScore: 0,
            totalToPar: 0,
          };
        }
      });
    }
  }

  saveTour(tour);
};

/**
 * Complete a round (change status from in-progress to completed)
 */
export const completeRound = (tourId: string, roundId: string): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  const round = tour.rounds.find((r) => r.id === roundId);
  if (round && round.status === "in-progress") {
    round.status = "completed";
    round.completedAt = new Date().toISOString();
  }

  saveTour(tour);
};

/**
 * Delete a round from a tour
 */
export const deleteRound = (tourId: string, roundId: string): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  tour.rounds = tour.rounds.filter((r) => r.id !== roundId);
  saveTour(tour);
};

/**
 * Check if round uses team scoring (scramble format)
 */
export const isTeamScoringFormat = (round: Round): boolean => {
  return (
    round.format === "scramble" ||
    (round.format === "best-ball" &&
      round.settings.teamScoring === "scramble")
  );
};

/**
 * Get team score for a round
 */
export const getTeamScore = (tourId: string, roundId: string, teamId: string) => {
  const tour = getTour(tourId);
  if (!tour) return null;

  const round = tour.rounds.find((r) => r.id === roundId);
  if (!round) return null;

  const teamScoreKey = `team_${teamId}`;
  return round.scores[teamScoreKey] || null;
};

/**
 * Update team score for scramble format
 */
export const updateTeamScore = (
  tourId: string,
  roundId: string,
  teamId: string,
  scores: number[]
): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  const round = tour.rounds.find((r) => r.id === roundId);
  if (!round) return;

  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const totalPar = getTotalPar(round);
  const totalToPar = totalScore - totalPar;

  // For scramble, we store the team score under a special key
  const teamScoreKey = `team_${teamId}`;

  round.scores[teamScoreKey] = {
    playerId: teamScoreKey,
    scores,
    totalScore,
    totalToPar,
    isTeamScore: true,
    teamId,
  };

  saveTour(tour);
};
