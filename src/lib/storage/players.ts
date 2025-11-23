import { Player } from "../../types";
import { getTour, saveTour } from "./tours";
import { getTotalPar } from "./rounds";
import { formatUtils } from "../../types/formats";

/**
 * Player storage operations
 * Handles player management and scoring
 */

/**
 * Helper function to calculate strokes for a specific hole using proper golf handicap system
 */
export const calculateStrokesForHole = (
  playerHandicap: number,
  holeHandicap: number
): number => {
  if (!playerHandicap || !holeHandicap) return 0;

  // Calculate base strokes (how many full rounds of 18 holes)
  const baseStrokes = Math.floor(playerHandicap / 18);

  // Calculate remaining handicap strokes to distribute
  const remainingStrokes = playerHandicap % 18;

  // Player gets base strokes on every hole, plus 1 extra stroke
  // if this hole's handicap <= remaining strokes
  return baseStrokes + (holeHandicap <= remainingStrokes ? 1 : 0);
};

/**
 * Add a player to a tour
 */
export const addPlayerToTour = (tourId: string, player: Player): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  tour.players.push(player);
  saveTour(tour);
};

/**
 * Update player score in a round
 */
export const updatePlayerScore = (
  tourId: string,
  roundId: string,
  playerId: string,
  scores: (number | null)[]
): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  const round = tour.rounds.find((r) => r.id === roundId);
  const player = tour.players.find((p) => p.id === playerId);
  if (!round || !player) return;

  // Calculate total score
  const totalScore = scores.reduce<number>((sum, score) => {
    return sum + (score || 0);
  }, 0);

  const totalPar = getTotalPar(round);
  const totalToPar = totalScore - totalPar;

  // Calculate handicap strokes properly - hole by hole using golf handicap system
  let handicapStrokes = 0;
  if (round.settings.strokesGiven && player.handicap) {
    round.holeInfo.forEach((hole) => {
      if (hole.handicap && player.handicap !== undefined) {
        handicapStrokes += calculateStrokesForHole(
          player.handicap,
          hole.handicap
        );
      }
    });
  }

  // Calculate net scores
  const netScore =
    handicapStrokes > 0 ? totalScore - handicapStrokes : undefined;
  const netToPar = netScore ? netScore - totalPar : undefined;

  round.scores[playerId] = {
    playerId,
    scores,
    totalScore,
    totalToPar,
    handicapStrokes: handicapStrokes > 0 ? handicapStrokes : undefined,
    netScore,
    netToPar,
  };

  saveTour(tour);
};

/**
 * Remove a player from a tour
 */
export const removePlayerFromTour = (tourId: string, playerId: string): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  tour.players = tour.players.filter((p) => p.id !== playerId);

  // Also remove from any teams
  if (tour.teams) {
    tour.teams.forEach((team) => {
      team.playerIds = team.playerIds.filter((pid) => pid !== playerId);
    });
  }

  saveTour(tour);
};

/**
 * Update player information in a tour
 */
export const updatePlayerInTour = (tourId: string, updatedPlayer: Player): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  const playerIndex = tour.players.findIndex(
    (p) => p.id === updatedPlayer.id
  );
  if (playerIndex >= 0) {
    tour.players[playerIndex] = updatedPlayer;
  }

  saveTour(tour);
};

/**
 * Claim a player by device ID
 */
export const claimPlayer = (
  tourId: string,
  playerId: string,
  deviceId: string
): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  const player = tour.players.find((p) => p.id === playerId);
  if (!player) return;

  // Check if device has already claimed a different player
  const alreadyClaimedPlayer = tour.players.find(
    (p) => p.claimedBy === deviceId && p.id !== playerId
  );
  if (alreadyClaimedPlayer) {
    throw new Error(
      `You have already claimed ${alreadyClaimedPlayer.name}. Each user can only claim one player.`
    );
  }

  // Don't allow claiming if already claimed by another device
  if (player.claimedBy && player.claimedBy !== deviceId) {
    throw new Error("This player has already been claimed by another device");
  }

  player.claimedBy = deviceId;
  saveTour(tour);
};

/**
 * Claim a player by player code
 */
export const claimPlayerByCode = (
  tourId: string,
  playerCode: string,
  deviceId: string
): Player | null => {
  const tour = getTour(tourId);
  if (!tour) return null;

  const player = tour.players.find((p) => p.playerCode === playerCode);
  if (!player) return null;

  // Check if device has already claimed a different player
  const alreadyClaimedPlayer = tour.players.find(
    (p) => p.claimedBy === deviceId && p.id !== player.id
  );
  if (alreadyClaimedPlayer) {
    throw new Error(
      `You have already claimed ${alreadyClaimedPlayer.name}. Each user can only claim one player.`
    );
  }

  player.claimedBy = deviceId;
  saveTour(tour);

  return player;
};

/**
 * Unclaim a player (remove claim)
 */
export const unclaimPlayer = (tourId: string, playerId: string): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  const player = tour.players.find((p) => p.id === playerId);
  if (!player) return;

  delete player.claimedBy;
  saveTour(tour);
};
