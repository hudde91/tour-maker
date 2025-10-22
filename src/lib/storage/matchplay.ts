import { nanoid } from "nanoid";
import { Round, MatchPlayRound, MatchPlayHole, HoleResult } from "../../types";
import { getTour, saveTour } from "./tours";

/**
 * Match play and Ryder Cup operations
 * Handles match play rounds, scoring, and Ryder Cup tournament logic
 */

/**
 * Extended match play round interface for internal use
 */
interface ExtendedMatchPlayRound extends MatchPlayRound {
  isComplete?: boolean;
  winner?: "team-a" | "team-b" | "halved";
  resultSummary?: string;
  statusText?: string;
  statusCode?: "not-started" | "in-progress" | "dormie" | "complete";
}

/**
 * Extended match play hole interface for internal use
 */
interface ExtendedMatchPlayHole extends MatchPlayHole {
  matchStatus?: string;
}

/**
 * Create a new match play round
 */
export const createMatchPlayRound = (
  tourId: string,
  roundId: string,
  matchData: {
    format: "singles" | "foursomes" | "four-ball";
    teamA: { id: string; playerIds: string[] };
    teamB: { id: string; playerIds: string[] };
  }
): MatchPlayRound => {
  const tour = getTour(tourId);
  const round = tour?.rounds.find((r) => r.id === roundId);
  if (!tour || !round) throw new Error("Tour or round not found");

  const matchId = nanoid();
  const match: MatchPlayRound = {
    id: matchId,
    roundId,
    format: matchData.format,
    teamA: matchData.teamA,
    teamB: matchData.teamB,
    holes: [],
    status: "in-progress",
    result: "ongoing",
    points: { teamA: 0, teamB: 0 },
  };

  // Initialize Ryder Cup data if not exists
  if (!round.ryderCup) {
    round.ryderCup = {
      teamAPoints: 0,
      teamBPoints: 0,
      targetPoints: 14.5,
      matches: [],
      sessions: {
        day1Foursomes: [],
        day1FourBall: [],
        day2Foursomes: [],
        day2FourBall: [],
        day3Singles: [],
      },
    };
  }

  round.ryderCup.matches.push(match);
  saveTour(tour);
  return match;
};

/**
 * Add a Ryder Cup session with pairings
 */
export const addRyderCupSession = (
  tourId: string,
  roundId: string,
  sessionData: {
    sessionType:
      | "day1-foursomes"
      | "day1-four-ball"
      | "day2-foursomes"
      | "day2-four-ball"
      | "day3-singles"
      | "foursomes"
      | "four-ball"
      | "singles";
    pairings: { teamAPlayerIds: string[]; teamBPlayerIds: string[] }[];
  }
): MatchPlayRound[] => {
  const tour = getTour(tourId);
  const round = tour?.rounds.find((r) => r.id === roundId);
  if (!tour || !round) throw new Error("Tour or round not found");
  if (!tour.teams || tour.teams.length < 2) {
    throw new Error("Ryder Cup requires two teams");
  }

  // Ensure ryderCup structure
  if (!round.ryderCup) {
    round.ryderCup = {
      teamAPoints: 0,
      teamBPoints: 0,
      targetPoints: 14.5,
      matches: [],
      sessions: {
        day1Foursomes: [],
        day1FourBall: [],
        day2Foursomes: [],
        day2FourBall: [],
        day3Singles: [],
      },
    };
  } else if (!round.ryderCup.sessions) {
    round.ryderCup.sessions = {
      day1Foursomes: [],
      day1FourBall: [],
      day2Foursomes: [],
      day2FourBall: [],
      day3Singles: [],
    };
  }

  const st = sessionData.sessionType;
  const format: "singles" | "foursomes" | "four-ball" = st.includes(
    "four-ball"
  )
    ? "four-ball"
    : st.includes("foursomes")
    ? "foursomes"
    : "singles";

  const sessionKey =
    st === "day1-foursomes"
      ? "day1Foursomes"
      : st === "day1-four-ball"
      ? "day1FourBall"
      : st === "day2-foursomes"
      ? "day2Foursomes"
      : st === "day2-four-ball"
      ? "day2FourBall"
      : st === "day3-singles"
      ? "day3Singles"
      : null;

  const created: MatchPlayRound[] = [];

  const defaultA = tour.teams[0]!.id;
  const defaultB = tour.teams[1]!.id;

  for (const pairing of sessionData.pairings) {
    const pA0 = tour.players.find((p) => p.id === pairing.teamAPlayerIds[0]);
    const pB0 = tour.players.find((p) => p.id === pairing.teamBPlayerIds[0]);

    // Infer team IDs from players; fallback to the two defined teams
    const teamAId = pA0?.teamId ?? defaultA;
    const teamBId =
      pB0?.teamId ?? (teamAId === defaultA ? defaultB : defaultA);

    const match = createMatchPlayRound(tourId, roundId, {
      format,
      teamA: { id: teamAId, playerIds: pairing.teamAPlayerIds },
      teamB: { id: teamBId, playerIds: pairing.teamBPlayerIds },
    });

    // Track match object + link id into the session list
    round.ryderCup!.matches.push(match);
    if (sessionKey) {
      round.ryderCup!.sessions[sessionKey].push(match.id);
    }
    created.push(match);
  }

  if (round.status !== "completed") {
    round.status = "in-progress";
  }
  saveTour(tour);
  return created;
};

/**
 * Get player's total score from Ryder Cup matches
 */
export const getPlayerScoreFromRyderCup = (round: Round, playerId: string): number => {
  if (!round.ryderCup || !round.ryderCup.matches) return 0;

  let totalScore = 0;
  let holesPlayed = 0;

  // Find all matches where this player participated
  for (const match of round.ryderCup.matches) {
    const isInTeamA = match.teamA?.playerIds?.includes(playerId);
    const isInTeamB = match.teamB?.playerIds?.includes(playerId);

    if (!isInTeamA && !isInTeamB) continue;

    // Sum up the player's scores from all played holes in this match
    if (match.holes && Array.isArray(match.holes)) {
      for (const hole of match.holes) {
        // Only count holes that have been played (both scores > 0)
        if (hole.teamAScore > 0 && hole.teamBScore > 0) {
          const score = isInTeamA ? hole.teamAScore : hole.teamBScore;
          totalScore += score;
          holesPlayed++;
        }
      }
    }
  }

  return totalScore;
};

/**
 * Check if player has scores in Ryder Cup matches
 */
export const hasRyderCupScores = (round: Round, playerId: string): boolean => {
  if (!round.ryderCup || !round.ryderCup.matches) return false;

  for (const match of round.ryderCup.matches) {
    const isInTeamA = match.teamA?.playerIds?.includes(playerId);
    const isInTeamB = match.teamB?.playerIds?.includes(playerId);

    if (!isInTeamA && !isInTeamB) continue;

    // Check if any holes have been played in this match
    if (match.holes && Array.isArray(match.holes)) {
      for (const hole of match.holes) {
        if (hole.teamAScore > 0 && hole.teamBScore > 0) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Update one match-play hole and recalculate status/points
 */
export const updateMatchHole = (
  tourId: string,
  roundId: string,
  data: {
    matchId: string;
    holeNumber: number;
    teamAScore: number;
    teamBScore: number;
  }
) => {
  const tour = getTour(tourId);
  const round = tour?.rounds.find((r) => r.id === roundId);
  if (!tour || !round) throw new Error("Tour or round not found");
  if (!round.ryderCup) throw new Error("Ryder Cup data not initialized");

  const match = round.ryderCup.matches.find(
    (m) => m.id === data.matchId
  ) as ExtendedMatchPlayRound | undefined;
  if (!match) throw new Error("Match not found");

  // Get team names for status messages
  const teamAObj = tour.teams?.find((t) => t.id === match.teamA.id);
  const teamBObj = tour.teams?.find((t) => t.id === match.teamB.id);
  const teamAName = teamAObj?.name || "Team A";
  const teamBName = teamBObj?.name || "Team B";

  const totalHoles = round.holes || 18;
  const isValid = (n: number): boolean =>
    typeof n === "number" && Number.isFinite(n) && n > 0;

  // Ensure holes array matches shape, but do NOT default ties for unplayed holes
  if (!match.holes || !Array.isArray(match.holes)) {
    match.holes = Array.from({ length: totalHoles }, (_, i) => ({
      holeNumber: i + 1,
      teamAScore: 0,
      teamBScore: 0,
      result: "tie" as HoleResult,
      matchStatus: "",
    }));
  } else if (match.holes.length < totalHoles) {
    for (let i = match.holes.length; i < totalHoles; i++) {
      match.holes[i] = {
        holeNumber: i + 1,
        teamAScore: 0,
        teamBScore: 0,
        result: "tie" as HoleResult,
        matchStatus: "",
      };
    }
  }

  // Apply the hole update
  const idx = Math.max(
    0,
    Math.min(totalHoles - 1, (data.holeNumber || 1) - 1)
  );
  const hole = match.holes[idx] as ExtendedMatchPlayHole;
  hole.holeNumber = data.holeNumber;
  hole.teamAScore = data.teamAScore;
  hole.teamBScore = data.teamBScore;

  // Set result only if both sides have valid scores
  if (isValid(hole.teamAScore) && isValid(hole.teamBScore)) {
    hole.result =
      data.teamAScore === data.teamBScore
        ? "tie"
        : data.teamAScore < data.teamBScore
        ? "team-a"
        : "team-b";
  }

  // Re-derive results for all played holes (finite + >0 only)
  let aWins = 0;
  let bWins = 0;
  let holesPlayed = 0;
  for (let i = 0; i < totalHoles; i++) {
    const h = match.holes[i] as ExtendedMatchPlayHole;
    if (!(isValid(h.teamAScore) && isValid(h.teamBScore))) {
      continue;
    }
    holesPlayed++;
    const res: HoleResult =
      h.teamAScore === h.teamBScore
        ? "tie"
        : h.teamAScore < h.teamBScore
        ? "team-a"
        : "team-b";
    h.result = res;

    if (res === "team-a") aWins++;
    else if (res === "team-b") bWins++;
  }

  const lead = aWins - bWins;
  const holesRemaining = totalHoles - holesPlayed;
  const leadAbs = Math.abs(lead);
  const phraseCurrent = (lv: number) =>
    lv === 0
      ? "All square"
      : lv > 0
      ? `${teamAName} ${lv} up`
      : `${teamBName} ${-lv} up`;
  const isDormie = lead !== 0 && leadAbs === holesRemaining;

  // Compute match-level outcome/state
  let teamAPoints = 0;
  let teamBPoints = 0;
  let isComplete = false;
  let statusText: string;
  let statusCode: "not-started" | "in-progress" | "dormie" | "complete";

  if (holesPlayed === 0) {
    statusText = "Not started";
    statusCode = "not-started";
  } else if (leadAbs > holesRemaining) {
    const x = leadAbs;
    const y = holesRemaining;
    if (lead > 0) {
      statusText = `${teamAName} wins ${x}&${y}`;
      teamAPoints = 1;
    } else {
      statusText = `${teamBName} wins ${x}&${y}`;
      teamBPoints = 1;
    }
    isComplete = true;
    statusCode = "complete";
  } else if (holesRemaining === 0) {
    if (lead === 0) {
      statusText = "Halved";
      teamAPoints = 0.5;
      teamBPoints = 0.5;
    } else if (lead > 0) {
      statusText = `${teamAName} wins 1 up`;
      teamAPoints = 1;
    } else {
      statusText = `${teamBName} wins 1 up`;
      teamBPoints = 1;
    }
    isComplete = true;
    statusCode = "complete";
  } else if (isDormie) {
    statusText = `Dormie — ${phraseCurrent(lead)}`;
    statusCode = "dormie";
  } else {
    statusText = phraseCurrent(lead);
    statusCode = "in-progress";
  }

  if (isValid(hole.teamAScore) && isValid(hole.teamBScore)) {
    hole.matchStatus = statusText;
  }

  // Persist match-level status/points
  match.isComplete = isComplete;
  match.status = isComplete ? "completed" : "in-progress";
  match.winner =
    isComplete && teamAPoints !== teamBPoints
      ? lead > 0
        ? "team-a"
        : "team-b"
      : lead === 0 && isComplete
      ? "halved"
      : undefined;
  match.resultSummary = isComplete ? statusText : undefined;
  match.statusText = statusText;
  match.statusCode = statusCode;
  match.points = isComplete
    ? { teamA: teamAPoints, teamB: teamBPoints }
    : { teamA: 0, teamB: 0 };

  // Re-sum Ryder Cup team totals
  let sumA = 0;
  let sumB = 0;
  for (const m of round.ryderCup.matches as ExtendedMatchPlayRound[]) {
    sumA += m.points?.teamA || 0;
    sumB += m.points?.teamB || 0;
  }
  round.ryderCup.teamAPoints = sumA;
  round.ryderCup.teamBPoints = sumB;

  saveTour(tour);
};
