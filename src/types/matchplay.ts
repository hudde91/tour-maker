export type MatchStatus = "in-progress" | "completed";
export type MatchResult = "team-a" | "team-b" | "tie" | "ongoing";
export type HoleResult = "team-a" | "team-b" | "tie";

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
  matchStatus?: string; // "1-up", "2-down", "All Square", "Dormie", etc. (optional for unplayed holes)
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
