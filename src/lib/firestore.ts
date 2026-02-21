import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Tour,
  Player,
  Team,
  Round,
  PlayerScore,
  HoleInfo,
  TourFormat,
  RyderCupTournament,
  AppSettings,
} from "../types";
import { DEFAULT_APP_SETTINGS } from "@tour-maker/shared";

// --- Collection references ---

const toursCol = () => collection(db, "tours");
const tourDoc = (tourId: string) => doc(db, "tours", tourId);
const roundsCol = (tourId: string) => collection(db, "tours", tourId, "rounds");
const roundDoc = (tourId: string, roundId: string) =>
  doc(db, "tours", tourId, "rounds", roundId);
const userDoc = (userId: string) => doc(db, "users", userId);

// ============================================================
// TOURS
// ============================================================

export async function getTours(ownerId: string): Promise<Tour[]> {
  const q = query(toursCol(), where("ownerId", "==", ownerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const tours: Tour[] = [];
  for (const d of snap.docs) {
    tours.push(await assembleTour(d.id, d.data()));
  }
  return tours;
}

export async function getTour(tourId: string): Promise<Tour | null> {
  const snap = await getDoc(tourDoc(tourId));
  if (!snap.exists()) return null;
  return assembleTour(snap.id, snap.data());
}

/** Subscribe to a tour and its rounds in real-time */
export function subscribeTour(
  tourId: string,
  onData: (tour: Tour) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  // We need to listen to both the tour doc and the rounds subcollection
  let tourData: DocumentData | null = null;
  let roundDocs: DocumentData[] = [];

  const emit = () => {
    if (!tourData) return;
    const tour = assembleTourSync(tourId, tourData, roundDocs);
    onData(tour);
  };

  const unsubTour = onSnapshot(
    tourDoc(tourId),
    (snap) => {
      if (!snap.exists()) return;
      tourData = snap.data();
      emit();
    },
    onError
  );

  const unsubRounds = onSnapshot(
    roundsCol(tourId),
    (snap) => {
      roundDocs = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      emit();
    },
    onError
  );

  return () => {
    unsubTour();
    unsubRounds();
  };
}

export async function createTour(
  ownerId: string,
  data: { name: string; description?: string; format: TourFormat },
  id: string
): Promise<void> {
  await setDoc(tourDoc(id), {
    ownerId,
    name: data.name,
    description: data.description || null,
    format: data.format,
    isActive: true,
    archived: false,
    shareableUrl: `${window.location.origin}/tour/${id}`,
    createdAt: new Date().toISOString(),
    players: [],
    teams: [],
  });
}

export async function updateTourDetails(
  tourId: string,
  updates: Partial<{ name: string; description: string }>
): Promise<void> {
  await updateDoc(tourDoc(tourId), updates);
}

export async function updateTourFormat(tourId: string, format: TourFormat): Promise<void> {
  await updateDoc(tourDoc(tourId), { format });
}

export async function toggleTourArchive(tourId: string, archived: boolean): Promise<void> {
  await updateDoc(tourDoc(tourId), { archived });
}

export async function deleteTour(tourId: string): Promise<void> {
  // Delete all rounds first
  const roundSnap = await getDocs(roundsCol(tourId));
  const deletePromises = roundSnap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
  await deleteDoc(tourDoc(tourId));
}

// ============================================================
// PLAYERS (stored in tour document as an array)
// ============================================================

export async function addPlayer(tourId: string, player: Player): Promise<void> {
  const snap = await getDoc(tourDoc(tourId));
  if (!snap.exists()) return;
  const players: Player[] = snap.data().players || [];
  players.push(player);

  // If the player has a teamId, also update that team's playerIds
  if (player.teamId) {
    const teams: Team[] = snap.data().teams || [];
    const teamIdx = teams.findIndex((t) => t.id === player.teamId);
    if (teamIdx >= 0 && !teams[teamIdx].playerIds.includes(player.id)) {
      teams[teamIdx].playerIds.push(player.id);
      await updateDoc(tourDoc(tourId), { players, teams });
      return;
    }
  }

  await updateDoc(tourDoc(tourId), { players });
}

export async function updatePlayer(tourId: string, player: Player): Promise<void> {
  const snap = await getDoc(tourDoc(tourId));
  if (!snap.exists()) return;
  const players: Player[] = snap.data().players || [];
  const idx = players.findIndex((p) => p.id === player.id);
  if (idx >= 0) {
    players[idx] = player;
    await updateDoc(tourDoc(tourId), { players });
  }
}

export async function removePlayer(tourId: string, playerId: string): Promise<void> {
  const snap = await getDoc(tourDoc(tourId));
  if (!snap.exists()) return;
  const players: Player[] = snap.data().players || [];
  const teams: Team[] = snap.data().teams || [];

  // Remove player from teams
  for (const team of teams) {
    team.playerIds = team.playerIds.filter((id) => id !== playerId);
    if (team.captainId === playerId) team.captainId = "";
  }

  await updateDoc(tourDoc(tourId), {
    players: players.filter((p) => p.id !== playerId),
    teams,
  });
}

// ============================================================
// TEAMS (stored in tour document as an array)
// ============================================================

export async function addTeam(tourId: string, team: Team): Promise<void> {
  const snap = await getDoc(tourDoc(tourId));
  if (!snap.exists()) return;
  const teams: Team[] = snap.data().teams || [];
  teams.push(team);

  // If captain specified, update player's teamId
  if (team.captainId) {
    const players: Player[] = snap.data().players || [];
    const pIdx = players.findIndex((p) => p.id === team.captainId);
    if (pIdx >= 0) {
      players[pIdx].teamId = team.id;
      await updateDoc(tourDoc(tourId), { teams, players });
      return;
    }
  }

  await updateDoc(tourDoc(tourId), { teams });
}

export async function updateTeam(tourId: string, team: Team): Promise<void> {
  const snap = await getDoc(tourDoc(tourId));
  if (!snap.exists()) return;
  const teams: Team[] = snap.data().teams || [];
  const idx = teams.findIndex((t) => t.id === team.id);
  if (idx >= 0) {
    teams[idx] = team;
    await updateDoc(tourDoc(tourId), { teams });
  }
}

export async function removeTeam(tourId: string, teamId: string): Promise<void> {
  const snap = await getDoc(tourDoc(tourId));
  if (!snap.exists()) return;
  const teams: Team[] = snap.data().teams || [];
  const players: Player[] = snap.data().players || [];

  // Unassign players from this team
  for (const p of players) {
    if (p.teamId === teamId) p.teamId = undefined;
  }

  await updateDoc(tourDoc(tourId), {
    teams: teams.filter((t) => t.id !== teamId),
    players,
  });
}

export async function assignPlayerToTeam(
  tourId: string,
  playerId: string,
  teamId: string | null
): Promise<void> {
  const snap = await getDoc(tourDoc(tourId));
  if (!snap.exists()) return;
  const players: Player[] = snap.data().players || [];
  const teams: Team[] = snap.data().teams || [];

  const pIdx = players.findIndex((p) => p.id === playerId);
  if (pIdx < 0) return;

  // Remove from old team
  const oldTeamId = players[pIdx].teamId;
  if (oldTeamId) {
    const oldTeam = teams.find((t) => t.id === oldTeamId);
    if (oldTeam) {
      oldTeam.playerIds = oldTeam.playerIds.filter((id) => id !== playerId);
    }
  }

  // Assign to new team
  players[pIdx].teamId = teamId || undefined;
  if (teamId) {
    const newTeam = teams.find((t) => t.id === teamId);
    if (newTeam && !newTeam.playerIds.includes(playerId)) {
      newTeam.playerIds.push(playerId);
    }
  }

  await updateDoc(tourDoc(tourId), { players, teams });
}

export async function setTeamCaptain(
  tourId: string,
  teamId: string,
  captainId: string
): Promise<void> {
  const snap = await getDoc(tourDoc(tourId));
  if (!snap.exists()) return;
  const teams: Team[] = snap.data().teams || [];
  const idx = teams.findIndex((t) => t.id === teamId);
  if (idx >= 0) {
    teams[idx].captainId = captainId;
    await updateDoc(tourDoc(tourId), { teams });
  }
}

// ============================================================
// ROUNDS (subcollection under tour)
// ============================================================

export async function createRound(tourId: string, round: Round): Promise<void> {
  await setDoc(roundDoc(tourId, round.id), {
    name: round.name,
    courseName: round.courseName,
    format: round.format,
    holes: round.holes,
    holeInfo: round.holeInfo,
    totalPar: round.totalPar ?? null,
    teeBoxes: round.teeBoxes ?? null,
    slopeRating: round.slopeRating ?? null,
    totalYardage: round.totalYardage ?? null,
    startTime: round.startTime ?? null,
    playerIds: round.playerIds ?? [],
    settings: round.settings,
    createdAt: round.createdAt,
    scores: round.scores || {},
    status: round.status,
    ryderCup: round.ryderCup ?? null,
    isMatchPlay: round.isMatchPlay ?? false,
    competitionWinners: round.competitionWinners ?? { closestToPin: {}, longestDrive: {} },
  });
}

export async function updateRound(tourId: string, round: Round): Promise<void> {
  await setDoc(roundDoc(tourId, round.id), {
    name: round.name,
    courseName: round.courseName,
    format: round.format,
    holes: round.holes,
    holeInfo: round.holeInfo,
    totalPar: round.totalPar ?? null,
    teeBoxes: round.teeBoxes ?? null,
    slopeRating: round.slopeRating ?? null,
    totalYardage: round.totalYardage ?? null,
    startTime: round.startTime ?? null,
    playerIds: round.playerIds ?? [],
    settings: round.settings,
    createdAt: round.createdAt,
    startedAt: round.startedAt ?? null,
    completedAt: round.completedAt ?? null,
    scores: round.scores || {},
    status: round.status,
    ryderCup: round.ryderCup ?? null,
    isMatchPlay: round.isMatchPlay ?? false,
    competitionWinners: round.competitionWinners ?? { closestToPin: {}, longestDrive: {} },
  });
}

export async function deleteRound(tourId: string, roundId: string): Promise<void> {
  await deleteDoc(roundDoc(tourId, roundId));
}

export async function startRound(tourId: string, roundId: string): Promise<void> {
  await updateDoc(roundDoc(tourId, roundId), {
    status: "in-progress",
    startedAt: new Date().toISOString(),
  });
}

export async function completeRound(tourId: string, roundId: string): Promise<void> {
  await updateDoc(roundDoc(tourId, roundId), {
    status: "completed",
    completedAt: new Date().toISOString(),
  });
}

export async function updateRoundCourseDetails(
  tourId: string,
  roundId: string,
  updates: Partial<{
    name: string;
    courseName: string;
    teeBoxes: string;
    slopeRating: string;
    totalYardage: string;
  }>
): Promise<void> {
  await updateDoc(roundDoc(tourId, roundId), updates);
}

export async function updateRoundStartTime(
  tourId: string,
  roundId: string,
  startTime: string
): Promise<void> {
  await updateDoc(roundDoc(tourId, roundId), { startTime });
}

// ============================================================
// SCORING (stored inside round documents)
// ============================================================

export async function updatePlayerScore(
  tourId: string,
  roundId: string,
  playerId: string,
  scores: (number | null)[]
): Promise<void> {
  const snap = await getDoc(roundDoc(tourId, roundId));
  if (!snap.exists()) return;

  const roundData = snap.data();
  const holeInfo: HoleInfo[] = roundData.holeInfo || [];
  const allScores: Record<string, PlayerScore> = roundData.scores || {};

  // Calculate totals
  const playedPars = scores.reduce((sum: number, s, i) => {
    if (s !== null && holeInfo[i]) return sum + (holeInfo[i].par || 0);
    return sum;
  }, 0);
  const totalScore = scores.filter((s): s is number => s !== null).reduce((a, b) => a + b, 0);
  const totalToPar = totalScore - playedPars;

  allScores[playerId] = {
    playerId,
    scores,
    totalScore,
    totalToPar,
    ...( allScores[playerId]?.handicapStrokes !== undefined && {
      handicapStrokes: allScores[playerId].handicapStrokes,
      netScore: totalScore - (allScores[playerId].handicapStrokes || 0),
      netToPar: totalToPar - (allScores[playerId].handicapStrokes || 0),
    }),
  };

  await updateDoc(roundDoc(tourId, roundId), { scores: allScores });
}

export async function updateTeamScore(
  tourId: string,
  roundId: string,
  teamId: string,
  scores: number[]
): Promise<void> {
  const snap = await getDoc(roundDoc(tourId, roundId));
  if (!snap.exists()) return;

  const roundData = snap.data();
  const holeInfo: HoleInfo[] = roundData.holeInfo || [];
  const allScores: Record<string, PlayerScore> = roundData.scores || {};

  const playedPars = scores.reduce((sum: number, s, i) => {
    if (s !== null && holeInfo[i]) return sum + (holeInfo[i].par || 0);
    return sum;
  }, 0);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const totalToPar = totalScore - playedPars;

  const syntheticId = `${teamId}_score`;
  allScores[syntheticId] = {
    playerId: syntheticId,
    scores,
    totalScore,
    totalToPar,
    isTeamScore: true,
    teamId,
  };

  await updateDoc(roundDoc(tourId, roundId), { scores: allScores });
}

export async function updateCompetitionWinner(
  tourId: string,
  roundId: string,
  holeNumber: number,
  competitionType: "closestToPin" | "longestDrive",
  winnerId: string | null,
  distance?: number,
  matchId?: string
): Promise<void> {
  const snap = await getDoc(roundDoc(tourId, roundId));
  if (!snap.exists()) return;

  const roundData = snap.data();
  const winners = roundData.competitionWinners || { closestToPin: {}, longestDrive: {} };
  const typeWinners = winners[competitionType] || {};
  const holeKey = String(holeNumber);

  if (winnerId === null) {
    if (matchId) {
      typeWinners[holeKey] = (typeWinners[holeKey] || []).filter(
        (w: { matchId?: string }) => w.matchId !== matchId
      );
    } else {
      typeWinners[holeKey] = (typeWinners[holeKey] || []).filter(
        (w: { matchId?: string }) => w.matchId
      );
    }
  } else {
    const entry = {
      playerId: winnerId,
      ...(distance !== undefined && { distance }),
      ...(matchId && { matchId }),
    };
    if (!typeWinners[holeKey]) {
      typeWinners[holeKey] = [entry];
    } else {
      const filtered = typeWinners[holeKey].filter((w: { matchId?: string }) =>
        matchId ? w.matchId !== matchId : w.matchId
      );
      filtered.push(entry);
      typeWinners[holeKey] = filtered;
    }
  }

  winners[competitionType] = typeWinners;
  await updateDoc(roundDoc(tourId, roundId), { competitionWinners: winners });
}

// ============================================================
// MATCH PLAY & RYDER CUP (stored inside round's ryderCup field)
// ============================================================

export async function addRyderCupSession(
  tourId: string,
  roundId: string,
  sessionData: {
    sessionType: string;
    pairings: { teamAPlayerIds: string[]; teamBPlayerIds: string[] }[];
  },
  teams: Team[],
  matchIds: string[]
): Promise<void> {
  const snap = await getDoc(roundDoc(tourId, roundId));
  if (!snap.exists()) return;

  const roundData = snap.data();
  const ryderCup: RyderCupTournament = roundData.ryderCup || {
    teamAPoints: 0,
    teamBPoints: 0,
    targetPoints: 14.5,
    matches: [],
    sessions: { day1Foursomes: [], day1FourBall: [], day2Foursomes: [], day2FourBall: [], day3Singles: [] },
  };

  const teamA = teams[0];
  const teamB = teams[1];
  const st = sessionData.sessionType;

  let matchFormat: "singles" | "foursomes" | "four-ball";
  let sessionKey: keyof typeof ryderCup.sessions;

  if (st.includes("singles")) {
    matchFormat = "singles";
    sessionKey = "day3Singles";
  } else if (st.includes("foursomes") || st === "foursomes") {
    matchFormat = "foursomes";
    sessionKey = st.includes("day2") ? "day2Foursomes" : "day1Foursomes";
  } else {
    matchFormat = "four-ball";
    sessionKey = st.includes("day2") ? "day2FourBall" : "day1FourBall";
  }

  for (let i = 0; i < sessionData.pairings.length; i++) {
    const pairing = sessionData.pairings[i];
    const matchId = matchIds[i];
    const match = {
      id: matchId,
      roundId,
      format: matchFormat,
      teamA: { id: teamA?.id || "", playerIds: pairing.teamAPlayerIds },
      teamB: { id: teamB?.id || "", playerIds: pairing.teamBPlayerIds },
      holes: [],
      status: "in-progress" as const,
      result: "ongoing" as const,
      points: { teamA: 0, teamB: 0 },
    };
    ryderCup.matches.push(match);
    ryderCup.sessions[sessionKey].push(matchId);
  }

  await updateDoc(roundDoc(tourId, roundId), { ryderCup });
}

export async function updateMatchHole(
  tourId: string,
  roundId: string,
  data: { matchId: string; holeNumber: number; teamAScore: number; teamBScore: number }
): Promise<void> {
  const snap = await getDoc(roundDoc(tourId, roundId));
  if (!snap.exists()) return;

  const roundData = snap.data();
  const ryderCup: RyderCupTournament = roundData.ryderCup;
  if (!ryderCup) return;

  const matchIdx = ryderCup.matches.findIndex((m) => m.id === data.matchId);
  if (matchIdx === -1) return;

  const match = ryderCup.matches[matchIdx];
  const result = data.teamAScore < data.teamBScore ? "team-a" : data.teamBScore < data.teamAScore ? "team-b" : "tie";
  const hole = { holeNumber: data.holeNumber, teamAScore: data.teamAScore, teamBScore: data.teamBScore, result: result as "team-a" | "team-b" | "tie" };

  const holeIdx = match.holes.findIndex((h) => h.holeNumber === data.holeNumber);
  if (holeIdx >= 0) match.holes[holeIdx] = hole;
  else {
    match.holes.push(hole);
    match.holes.sort((a, b) => a.holeNumber - b.holeNumber);
  }

  // Calculate standing
  let teamAUp = 0;
  for (const h of match.holes) {
    if (h.result === "team-a") teamAUp++;
    else if (h.result === "team-b") teamAUp--;
  }
  const totalHoles = roundData.holes || 18;
  const holesRemaining = totalHoles - match.holes.length;

  if (Math.abs(teamAUp) > holesRemaining || holesRemaining === 0) {
    match.status = "completed";
    match.completedAt = new Date().toISOString();
    if (teamAUp > 0) { match.result = "team-a"; match.points = { teamA: 1, teamB: 0 }; }
    else if (teamAUp < 0) { match.result = "team-b"; match.points = { teamA: 0, teamB: 1 }; }
    else { match.result = "tie"; match.points = { teamA: 0.5, teamB: 0.5 }; }
  }

  ryderCup.teamAPoints = ryderCup.matches.reduce((s, m) => s + m.points.teamA, 0);
  ryderCup.teamBPoints = ryderCup.matches.reduce((s, m) => s + m.points.teamB, 0);
  ryderCup.matches[matchIdx] = match;

  await updateDoc(roundDoc(tourId, roundId), { ryderCup });
}

// ============================================================
// USER PROFILES & SETTINGS (stored in users collection)
// ============================================================

export async function getUserProfile(userId: string): Promise<{
  userId: string;
  playerName: string;
  handicap?: number;
  createdAt: string;
  updatedAt: string;
} | null> {
  const snap = await getDoc(userDoc(userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    userId: snap.id,
    playerName: data.playerName,
    handicap: data.handicap ?? undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function saveUserProfile(
  userId: string,
  data: { playerName: string; handicap?: number }
): Promise<void> {
  const snap = await getDoc(userDoc(userId));
  if (snap.exists()) {
    await updateDoc(userDoc(userId), {
      playerName: data.playerName,
      handicap: data.handicap ?? null,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await setDoc(userDoc(userId), {
      playerName: data.playerName,
      handicap: data.handicap ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: DEFAULT_APP_SETTINGS,
    });
  }
}

export async function getAppSettingsFromFirestore(userId: string): Promise<AppSettings> {
  const snap = await getDoc(userDoc(userId));
  if (!snap.exists()) return DEFAULT_APP_SETTINGS;
  return (snap.data().settings as AppSettings) || DEFAULT_APP_SETTINGS;
}

export async function saveAppSettingsToFirestore(
  userId: string,
  settings: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await getAppSettingsFromFirestore(userId);
  const merged = { ...current, ...settings };
  await updateDoc(userDoc(userId), { settings: merged });
  return merged;
}

// ============================================================
// Assembly helpers
// ============================================================

async function assembleTour(tourId: string, data: DocumentData): Promise<Tour> {
  const roundSnap = await getDocs(roundsCol(tourId));
  const rounds = roundSnap.docs.map((d) => docToRound(d.id, d.data()));

  return {
    id: tourId,
    name: data.name,
    description: data.description ?? undefined,
    format: data.format,
    createdAt: data.createdAt,
    shareableUrl: data.shareableUrl || "",
    players: data.players || [],
    teams: data.teams || [],
    rounds,
    isActive: data.isActive ?? true,
    archived: data.archived ?? false,
  };
}

function assembleTourSync(tourId: string, data: DocumentData, roundDocs: DocumentData[]): Tour {
  return {
    id: tourId,
    name: data.name,
    description: data.description ?? undefined,
    format: data.format,
    createdAt: data.createdAt,
    shareableUrl: data.shareableUrl || "",
    players: data.players || [],
    teams: data.teams || [],
    rounds: roundDocs.map((d) => docToRound(d.id, d)),
    isActive: data.isActive ?? true,
    archived: data.archived ?? false,
  };
}

function docToRound(id: string, data: DocumentData): Round {
  return {
    id,
    name: data.name,
    courseName: data.courseName,
    format: data.format,
    holes: data.holes,
    holeInfo: data.holeInfo || [],
    totalPar: data.totalPar ?? undefined,
    teeBoxes: data.teeBoxes ?? undefined,
    slopeRating: data.slopeRating ?? undefined,
    totalYardage: data.totalYardage ?? undefined,
    startTime: data.startTime ?? undefined,
    playerIds: data.playerIds ?? undefined,
    settings: data.settings || { strokesGiven: false },
    createdAt: data.createdAt,
    startedAt: data.startedAt ?? undefined,
    completedAt: data.completedAt ?? undefined,
    scores: data.scores || {},
    status: data.status || "created",
    ryderCup: data.ryderCup ?? undefined,
    isMatchPlay: data.isMatchPlay ?? undefined,
    competitionWinners: data.competitionWinners ?? undefined,
  };
}
