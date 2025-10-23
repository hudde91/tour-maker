import { Player, Team } from "./core";

export interface PlayerScore {
  playerId: string;
  scores: (number | null)[]; // score per hole, null = conceded hole in match play
  totalScore: number; // gross score
  totalToPar: number; // gross score to par
  handicapStrokes?: number; // handicap strokes applied
  netScore?: number; // net score (totalScore - handicapStrokes)
  netToPar?: number; // net score to par
  isTeamScore?: boolean;
  teamId?: string;
  stablefordManual?: number;
}

export interface FoursomeScore {
  teamId: string;
  playerIds: string[];
  scores: number[]; // hole scores (combined team score)
  totalScore: number;
  totalToPar: number;
  currentPlayer: "player1" | "player2"; // who hits next (for alternate shot)
}

export interface LeaderboardEntry {
  player: Player;
  totalScore: number; // gross score
  totalToPar: number; // gross to par
  netScore?: number; // net score (if handicap applied)
  netToPar?: number; // net to par
  handicapStrokes?: number; // total handicap strokes applied
  roundsPlayed: number;
  position: number;
  team?: Team; // player's team (if applicable)
  isCaptain?: boolean; // whether player is team captain
  positionChange?: number; // position change from previous round (positive = moved up)
  currentRoundScore?: number; // score from most recent round
  currentRoundToPar?: number; // to par from most recent round
}

export interface TeamLeaderboardEntry {
  team: Team;
  totalScore: number; // gross team score
  totalToPar: number; // gross team to par
  netScore?: number; // net team score (if handicaps applied)
  netToPar?: number; // net team to par
  totalHandicapStrokes?: number; // total team handicap strokes
  playersWithScores: number;
  totalPlayers: number;
  position: number;
  ryderCupPoints?: number;
}

export interface Leaderboard {
  individual: LeaderboardEntry[];
  team?: TeamLeaderboardEntry[];
}

// Player statistics for detailed analysis
export interface DetailedPlayerStats {
  playerId: string;
  roundId: string;
  // Scoring breakdown
  birdieCount: number;
  parCount: number;
  bogeyCount: number;
  doubleBogeyOrWorse: number;
  eagleOrBetter: number;
  // Best/worst holes
  bestHole: { holeNumber: number; score: number; toPar: number } | null;
  worstHole: { holeNumber: number; score: number; toPar: number } | null;
  // Streaks (consecutive pars, birdies, etc.)
  currentStreak: {
    type: "birdie" | "par" | "bogey" | "under-par" | "over-par" | "none";
    length: number;
  };
  // Round summaries
  front9: RoundSummary;
  back9: RoundSummary;
}

// Summary for 9-hole segments
export interface RoundSummary {
  score: number;
  toPar: number;
  birdies: number;
  pars: number;
  bogeys: number;
  holesPlayed: number; // May be less than 9 if round incomplete
}

// Hole winner information (for skins/match play)
export interface HoleWinner {
  holeNumber: number;
  winnerIds: string[]; // multiple winners if tied
  score: number;
  toPar: number;
  isTied: boolean;
}
