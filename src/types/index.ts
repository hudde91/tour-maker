export type TourFormat = "individual" | "team" | "ryder-cup";
export type PlayFormat =
  | "stroke-play"
  | "match-play"
  | "scramble"
  | "best-ball"
  | "alternate-shot"
  | "skins";

export type MatchStatus = "in-progress" | "completed";
export type MatchResult = "team-a" | "team-b" | "tie" | "ongoing";
export type HoleResult = "team-a" | "team-b" | "tie";

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
  matchPlayType?: "singles" | "foursomes" | "four-ball";
  ryderCupSession?:
    | "day1-foursomes"
    | "day1-four-ball"
    | "day2-foursomes"
    | "day2-four-ball"
    | "day3-singles";
}

export interface Round {
  id: string;
  name: string;
  courseName: string;
  format: PlayFormat;
  holes: number;
  holeInfo: HoleInfo[];
  totalPar?: number; // Optional: manually set total par (overrides calculated from holeInfo)

  // Course Details
  teeBoxes?: string;
  slopeRating?: string;
  totalYardage?: string;

  // Schedule
  startTime?: string;

  settings: RoundSettings;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scores: Record<string, PlayerScore>;
  status: "created" | "in-progress" | "completed";
  ryderCup?: RyderCupTournament;
  isMatchPlay?: boolean; // flag to indicate match play vs stroke play
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
  totalScore: number; // gross score
  totalToPar: number; // gross score to par
  handicapStrokes?: number; // handicap strokes applied
  netScore?: number; // net score (totalScore - handicapStrokes)
  netToPar?: number; // net score to par
  isTeamScore?: boolean;
  teamId?: string;
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
  totalScore: number; // gross score
  totalToPar: number; // gross to par
  netScore?: number; // net score (if handicap applied)
  netToPar?: number; // net to par
  handicapStrokes?: number; // total handicap strokes applied
  roundsPlayed: number;
  position: number;
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
}
export interface Leaderboard {
  individual: LeaderboardEntry[];
  team?: TeamLeaderboardEntry[];
}

export interface MatchStatusInfo {
  holesRemaining: number;
  leadingTeam: "team-a" | "team-b" | "tied";
  lead: number; // how many holes up
  status: string; // "2-up", "All Square", "Dormie", etc.
  canWin: boolean; // can the trailing team still win?
  isCompleted: boolean;
  result?: MatchResult;
}

export interface MatchPlayHole {
  holeNumber: number;
  teamAScore: number;
  teamBScore: number;
  result: HoleResult; // who won this hole
  matchStatus: string; // "1-up", "2-down", "All Square", "Dormie", etc.
}

export interface MatchPlayRound {
  id: string;
  roundId: string; // reference to the round
  format: "singles" | "foursomes" | "four-ball";
  teamA: {
    id: string;
    playerIds: string[]; // 1 for singles, 2 for team matches
  };
  teamB: {
    id: string;
    playerIds: string[]; // 1 for singles, 2 for team matches
  };
  holes: MatchPlayHole[];
  status: MatchStatus;
  result: MatchResult;
  points: {
    teamA: number; // 0, 0.5, or 1
    teamB: number; // 0, 0.5, or 1
  };
  completedAt?: string;
}

export interface RyderCupTournament {
  teamAPoints: number;
  teamBPoints: number;
  targetPoints: number; // usually 14.5
  matches: MatchPlayRound[];
  sessions: {
    day1Foursomes: string[]; // match IDs
    day1FourBall: string[]; // match IDs
    day2Foursomes: string[]; // match IDs
    day2FourBall: string[]; // match IDs
    day3Singles: string[]; // match IDs
  };
}
