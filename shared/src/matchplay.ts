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
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
  createdAt: string;
}

export interface MatchStatusInfo {
  holesRemaining: number;
  leadingTeam: "team-a" | "team-b" | "tied";
  lead: number;
  status: string;
  canWin: boolean;
  isCompleted: boolean;
  result?: MatchResult;
}

export interface MatchPlayHole {
  holeNumber: number;
  teamAScore: number;
  teamBScore: number;
  result: HoleResult;
  matchStatus?: string;
}

export interface MatchPlayRound {
  id: string;
  roundId: string;
  format: "singles" | "foursomes" | "four-ball";
  teamA: {
    id: string;
    playerIds: string[];
  };
  teamB: {
    id: string;
    playerIds: string[];
  };
  holes: MatchPlayHole[];
  status: MatchStatus;
  result: MatchResult;
  points: {
    teamA: number;
    teamB: number;
  };
  completedAt?: string;
}

export interface RyderCupTournament {
  teamAPoints: number;
  teamBPoints: number;
  targetPoints: number;
  matches: MatchPlayRound[];
  sessions: {
    day1Foursomes: string[];
    day1FourBall: string[];
    day2Foursomes: string[];
    day2FourBall: string[];
    day3Singles: string[];
  };
}
