import { Player, Team } from "./core";

export interface PlayerScore {
  playerId: string;
  scores: number[]; // score per hole
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
