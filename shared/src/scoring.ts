import { Player, Team } from "./core";

export interface PlayerScore {
  playerId: string;
  scores: (number | null)[];
  totalScore: number;
  totalToPar: number;
  handicapStrokes?: number;
  netScore?: number;
  netToPar?: number;
  isTeamScore?: boolean;
  teamId?: string;
  stablefordManual?: number;
}

export interface FoursomeScore {
  teamId: string;
  playerIds: string[];
  scores: number[];
  totalScore: number;
  totalToPar: number;
  currentPlayer: "player1" | "player2";
}

export interface LeaderboardEntry {
  player: Player;
  totalScore: number;
  totalToPar: number;
  netScore?: number;
  netToPar?: number;
  handicapStrokes?: number;
  roundsPlayed: number;
  position: number;
  team?: Team;
  isCaptain?: boolean;
  positionChange?: number;
  currentRoundScore?: number;
  currentRoundToPar?: number;
}

export interface TeamLeaderboardEntry {
  team: Team;
  totalScore: number;
  totalToPar: number;
  netScore?: number;
  netToPar?: number;
  totalHandicapStrokes?: number;
  playersWithScores: number;
  totalPlayers: number;
  position: number;
  ryderCupPoints?: number;
}

export interface Leaderboard {
  individual: LeaderboardEntry[];
  team?: TeamLeaderboardEntry[];
}

export interface DetailedPlayerStats {
  playerId: string;
  roundId: string;
  birdieCount: number;
  parCount: number;
  bogeyCount: number;
  doubleBogeyOrWorse: number;
  eagleOrBetter: number;
  bestHole: { holeNumber: number; score: number; toPar: number } | null;
  worstHole: { holeNumber: number; score: number; toPar: number } | null;
  currentStreak: {
    type: "birdie" | "par" | "bogey" | "under-par" | "over-par" | "none";
    length: number;
  };
  front9: RoundSummary;
  back9: RoundSummary;
}

export interface RoundSummary {
  score: number;
  toPar: number;
  birdies: number;
  pars: number;
  bogeys: number;
  holesPlayed: number;
}

export interface HoleWinner {
  holeNumber: number;
  winnerIds: string[];
  score: number;
  toPar: number;
  isTied: boolean;
}
