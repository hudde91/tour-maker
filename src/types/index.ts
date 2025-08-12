export type TourFormat = "individual" | "team" | "ryder-cup";
export type PlayFormat =
  | "stroke-play"
  | "match-play"
  | "scramble"
  | "best-ball"
  | "alternate-shot"
  | "skins"
  | "foursomes-match-play"
  | "four-ball-match-play"
  | "singles-match-play";

export type MatchStatus = "in-progress" | "completed";
export type MatchResult = "team-a" | "team-b" | "tie" | "ongoing";
export type HoleResult = "team-a" | "team-b" | "tie";

export interface HoleInfo {
  number: number;
  par: number;
  yardage?: number;
  handicap?: number;
}

export type RyderCupSession =
  | "day1-foursomes"
  | "day1-four-ball"
  | "day2-foursomes"
  | "day2-four-ball"
  | "day3-singles";

export interface RyderCupPairing {
  id: string;
  sessionType: RyderCupSession;
  teamAPlayerIds: string[]; // 1 for singles, 2 for team matches
  teamBPlayerIds: string[]; // 1 for singles, 2 for team matches
  createdAt: string;
}

export interface FoursomeScore {
  teamId: string;
  playerIds: string[];
  scores: number[]; // hole scores (combined team score)
  totalScore: number;
  totalToPar: number;
  currentPlayer: "player1" | "player2"; // who hits next (for alternate shot)
}

export interface RoundSettings {
  strokesGiven: boolean;
  matchPlayFormat?: "singles" | "teams";
  skinsValue?: number;
  teamScoring?: "best-ball" | "scramble" | "alternate-shot";

  // Ryder Cup settings
  ryderCupSession?: RyderCupSession;
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
    matchPlay?: boolean;
    ryderCup?: boolean;
    playersPerTeam?: number;
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
    matchPlay: true,
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
  "foursomes-match-play": {
    name: "Foursomes",
    description:
      "Alternate shot match play - partners take turns, match play scoring",
    teamCompatible: true,
    icon: "🔄",
    matchPlay: true,
    ryderCup: true,
    playersPerTeam: 2,
  },
  "four-ball-match-play": {
    name: "Four-Ball",
    description:
      "Best ball match play - individual scores, best ball vs best ball",
    teamCompatible: true,
    icon: "⭐",
    matchPlay: true,
    ryderCup: true,
    playersPerTeam: 2,
  },
  "singles-match-play": {
    name: "Singles",
    description: "Individual match play - head to head competition",
    teamCompatible: false,
    icon: "👤",
    matchPlay: true,
    ryderCup: true,
    playersPerTeam: 1,
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

export const formatUtils = {
  isMatchPlay: (format: PlayFormat): boolean => {
    return GOLF_FORMATS[format].matchPlay === true;
  },

  isRyderCupFormat: (format: PlayFormat): boolean => {
    return GOLF_FORMATS[format].ryderCup === true;
  },

  getPlayersPerTeam: (format: PlayFormat): number => {
    return GOLF_FORMATS[format].playersPerTeam || 1;
  },

  requiresTeams: (format: PlayFormat): boolean => {
    const playersPerTeam = formatUtils.getPlayersPerTeam(format);
    return playersPerTeam > 1 || format.includes("team");
  },

  getSessionFromFormat: (format: PlayFormat): RyderCupSession | null => {
    switch (format) {
      case "foursomes-match-play":
        return "day1-foursomes"; // default, can be overridden
      case "four-ball-match-play":
        return "day1-four-ball"; // default, can be overridden
      case "singles-match-play":
        return "day3-singles";
      default:
        return null;
    }
  },
};
