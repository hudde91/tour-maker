/**
 * Storage Module
 *
 * This module provides a clean, modular interface for managing golf tournament data
 * in localStorage. The original monolithic storage.ts file (1306 lines) has been
 * refactored into focused, single-responsibility modules for better maintainability.
 *
 * Module Structure:
 * - tours: Tour CRUD operations
 * - rounds: Round lifecycle and scoring
 * - players: Player management and scoring
 * - teams: Team management and assignments
 * - scoring: Leaderboard calculations and scoring logic
 * - matchplay: Match play and Ryder Cup operations
 * - utils: Utility functions
 * - constants: Shared constants
 *
 * Usage:
 * import { storage } from './lib/storage';
 *
 * const tour = storage.getTour(tourId);
 * storage.updatePlayerScore(tourId, roundId, playerId, scores);
 */

// Tours
export {
  getTours,
  getTour,
  saveTour,
  deleteTour,
  updateTourDetails,
  toggleTourArchive,
  updateTourFormat,
} from "./tours";

// Rounds
export {
  saveRound,
  getTotalPar,
  startRound,
  completeRound,
  deleteRound,
  isTeamScoringFormat,
  getTeamScore,
  updateTeamScore,
  updateCompetitionWinner,
  updateRoundCourseDetails,
  updateRoundStartTime,
} from "./rounds";

// Players
export {
  calculateStrokesForHole,
  addPlayerToTour,
  updatePlayerScore,
  removePlayerFromTour,
  updatePlayerInTour,
  claimPlayer,
  claimPlayerByCode,
  unclaimPlayer,
} from "./players";

// Teams
export {
  addTeamToTour,
  updateTeamInTour,
  removeTeamFromTour,
  assignPlayerToTeam,
  removePlayerFromTeam,
  setTeamCaptain,
  reorderTeamPlayers,
} from "./teams";

// Scoring
export {
  calculateBestBallRoundLeaderboard,
  calculateScrambleRoundLeaderboard,
  calculateIndividualRoundLeaderboard,
  calculateTournamentTeamLeaderboard,
  sortAndPositionTeams,
  calculateTeamLeaderboard,
  allocateHandicapStrokesPerHole,
  calculateStablefordForPlayer,
  calculateTournamentStableford,
  calculateMatchesWon,
} from "./scoring";

// Match Play
export {
  createMatchPlayRound,
  addRyderCupSession,
  getPlayerScoreFromRyderCup,
  hasRyderCupScores,
  updateMatchHole,
} from "./matchplay";

// Utils
export {
  generateDefaultHoles,
} from "./utils";

// Constants
export { STORAGE_KEYS } from "./constants";

/**
 * Legacy storage object for backward compatibility
 * This maintains the same API as the original storage.ts file
 * but delegates to the new modular structure.
 */
import * as tours from "./tours";
import * as rounds from "./rounds";
import * as players from "./players";
import * as teams from "./teams";
import * as scoring from "./scoring";
import * as matchplay from "./matchplay";
import * as utils from "./utils";

export const storage = {
  // Tours
  getTours: tours.getTours,
  getTour: tours.getTour,
  saveTour: tours.saveTour,
  deleteTour: tours.deleteTour,
  updateTourDetails: tours.updateTourDetails,
  toggleTourArchive: tours.toggleTourArchive,
  updateTourFormat: tours.updateTourFormat,

  // Rounds
  saveRound: rounds.saveRound,
  getTotalPar: rounds.getTotalPar,
  startRound: rounds.startRound,
  completeRound: rounds.completeRound,
  deleteRound: rounds.deleteRound,
  isTeamScoringFormat: rounds.isTeamScoringFormat,
  getTeamScore: rounds.getTeamScore,
  updateTeamScore: rounds.updateTeamScore,
  updateRoundCourseDetails: rounds.updateRoundCourseDetails,
  updateRoundStartTime: rounds.updateRoundStartTime,

  // Players
  calculateStrokesForHole: players.calculateStrokesForHole,
  addPlayerToTour: players.addPlayerToTour,
  updatePlayerScore: players.updatePlayerScore,
  removePlayerFromTour: players.removePlayerFromTour,
  updatePlayerInTour: players.updatePlayerInTour,
  claimPlayer: players.claimPlayer,
  claimPlayerByCode: players.claimPlayerByCode,
  unclaimPlayer: players.unclaimPlayer,

  // Teams
  addTeamToTour: teams.addTeamToTour,
  updateTeamInTour: teams.updateTeamInTour,
  removeTeamFromTour: teams.removeTeamFromTour,
  assignPlayerToTeam: teams.assignPlayerToTeam,
  removePlayerFromTeam: teams.removePlayerFromTeam,
  setTeamCaptain: teams.setTeamCaptain,
  reorderTeamPlayers: teams.reorderTeamPlayers,

  // Scoring
  calculateBestBallRoundLeaderboard: scoring.calculateBestBallRoundLeaderboard,
  calculateScrambleRoundLeaderboard: scoring.calculateScrambleRoundLeaderboard,
  calculateIndividualRoundLeaderboard: scoring.calculateIndividualRoundLeaderboard,
  calculateTournamentTeamLeaderboard: scoring.calculateTournamentTeamLeaderboard,
  sortAndPositionTeams: scoring.sortAndPositionTeams,
  calculateTeamLeaderboard: scoring.calculateTeamLeaderboard,
  _allocateHandicapStrokesPerHole: scoring.allocateHandicapStrokesPerHole,
  calculateStablefordForPlayer: scoring.calculateStablefordForPlayer,
  calculateTournamentStableford: scoring.calculateTournamentStableford,
  calculateMatchesWon: scoring.calculateMatchesWon,

  // Match Play
  createMatchPlayRound: matchplay.createMatchPlayRound,
  addRyderCupSession: matchplay.addRyderCupSession,
  getPlayerScoreFromRyderCup: matchplay.getPlayerScoreFromRyderCup,
  hasRyderCupScores: matchplay.hasRyderCupScores,
  updateMatchHole: matchplay.updateMatchHole,

  // Utils
  generateDefaultHoles: utils.generateDefaultHoles,
};
