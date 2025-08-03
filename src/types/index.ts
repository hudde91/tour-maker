export type TourFormat = "individual" | "team" | "ryder-cup";
export type PlayFormat =
  | "stroke-play"
  | "match-play"
  | "scramble"
  | "best-ball"
  | "alternate-shot"
  | "skins";

export interface HoleInfo {
  number: number;
  par: number;
  yardage?: number;
  handicap?: number;
}

export interface RoundSettings {
  strokesGiven: boolean; // Apply handicap strokes
  matchPlayFormat?: "singles" | "teams"; // For match play
  skinsValue?: number; // For skins game
  teamScoring?: "best-ball" | "scramble" | "alternate-shot"; // For team rounds
}

export interface Round {
  id: string;
  name: string;
  courseName: string;
  format: PlayFormat;
  holes: number;
  holeInfo: HoleInfo[];
  totalPar?: number; // Optional: manually set total par (overrides calculated from holeInfo)
  settings: RoundSettings;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scores: Record<string, PlayerScore>;
  status: "created" | "in-progress" | "completed";
}

export const GOLF_FORMATS: Record<
  PlayFormat,
  {
    name: string;
    description: string;
    teamCompatible: boolean;
    icon: string;
  }
> = {
  "stroke-play": {
    name: "Stroke Play",
    description: "Traditional golf - lowest total score wins",
    teamCompatible: true,
    icon: "🏌️‍♂️",
  },
  "match-play": {
    name: "Match Play",
    description: "Head-to-head competition, win holes to win match",
    teamCompatible: true,
    icon: "⚔️",
  },
  scramble: {
    name: "Scramble",
    description: "Team plays from the best shot each time",
    teamCompatible: true,
    icon: "🤝",
  },
  "best-ball": {
    name: "Best Ball",
    description: "Count the best individual score on each hole",
    teamCompatible: true,
    icon: "⭐",
  },
  "alternate-shot": {
    name: "Alternate Shot",
    description: "Partners take turns hitting the same ball",
    teamCompatible: true,
    icon: "🔄",
  },
  skins: {
    name: "Skins",
    description: "Win money/points for winning individual holes",
    teamCompatible: false,
    icon: "💰",
  },
};

export interface Player {
  id: string;
  name: string;
  handicap?: number;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  captainId: string;
  playerIds: string[];
  color: string;
}

export interface PlayerScore {
  playerId: string;
  scores: number[]; // score per hole
  totalScore: number;
  totalToPar: number;
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
}

export interface LeaderboardEntry {
  player: Player;
  totalScore: number;
  totalToPar: number;
  roundsPlayed: number;
  position: number;
}

export interface TeamLeaderboardEntry {
  team: Team;
  totalScore: number;
  totalToPar: number;
  playersWithScores: number;
  totalPlayers: number;
  position: number;
}

export interface Leaderboard {
  individual: LeaderboardEntry[];
  team?: TeamLeaderboardEntry[];
}
