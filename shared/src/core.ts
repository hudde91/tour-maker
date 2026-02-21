import { PlayFormat } from "./formats";
import { PlayerScore } from "./scoring";
import { RyderCupTournament } from "./matchplay";

export type TourFormat = "individual" | "team" | "ryder-cup";

export interface HoleInfo {
  number: number;
  par: number;
  yardage?: number;
  handicap?: number;
  closestToPin?: boolean;
  longestDrive?: boolean;
}

export interface RoundSettings {
  strokesGiven: boolean;
  matchPlayFormat?: "singles" | "teams";
  skinsValue?: number;
  teamScoring?: "best-ball" | "scramble" | "alternate-shot";
  stablefordScoring?: boolean;
  ryderCupSession?:
    | "day1-foursomes"
    | "day1-four-ball"
    | "day2-foursomes"
    | "day2-four-ball"
    | "day3-singles";
  matchPlayType?: "singles" | "foursomes" | "four-ball";
  teamsRequired?: boolean;
}

export interface Round {
  id: string;
  name: string;
  courseName: string;
  format: PlayFormat;
  holes: number;
  holeInfo: HoleInfo[];
  totalPar?: number;
  teeBoxes?: string;
  slopeRating?: string;
  totalYardage?: string;
  startTime?: string;
  playerIds?: string[];
  settings: RoundSettings;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scores: Record<string, PlayerScore>;
  status: "created" | "in-progress" | "completed";
  ryderCup?: RyderCupTournament;
  isMatchPlay?: boolean;
  competitionWinners?: {
    closestToPin: Record<
      number,
      Array<{ playerId: string; distance?: number; matchId?: string }>
    >;
    longestDrive: Record<
      number,
      Array<{ playerId: string; distance?: number; matchId?: string }>
    >;
  };
}

export interface Player {
  id: string;
  name: string;
  handicap?: number;
  teamId?: string;
  userId?: string;
}

export interface UserProfile {
  userId: string;
  playerId: string;
  playerName: string;
  handicap?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  captainId: string;
  playerIds: string[];
  color: string;
}

export interface Tour {
  id: string;
  name: string;
  description?: string;
  format: TourFormat;
  createdAt: string;
  shareableUrl: string;
  players: Player[];
  teams?: Team[];
  rounds: Round[];
  isActive: boolean;
  archived?: boolean;
}
