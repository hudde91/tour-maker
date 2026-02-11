import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { rounds, tours } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { notFound, forbidden, badRequest } from "../middleware/error";
import type { MatchPlayRound, MatchPlayHole, RyderCupTournament, HoleResult } from "@tour-maker/shared";

const app = new Hono();

app.use("/*", authMiddleware);

// POST /tours/:tourId/rounds/:roundId/matches - Create match
app.post("/", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const user = c.var.user;
  const body = await c.req.json<{
    format: "singles" | "foursomes" | "four-ball";
    teamA: { id: string; playerIds: string[] };
    teamB: { id: string; playerIds: string[] };
  }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);

  const ryderCup = (round.ryderCup as RyderCupTournament) || {
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

  const match: MatchPlayRound = {
    id: nanoid(),
    roundId,
    format: body.format,
    teamA: body.teamA,
    teamB: body.teamB,
    holes: [],
    status: "in-progress",
    result: "ongoing",
    points: { teamA: 0, teamB: 0 },
  };

  ryderCup.matches.push(match);

  await db.update(rounds).set({ ryderCup }).where(eq(rounds.id, roundId));

  return c.json(match, 201);
});

// PUT /tours/:tourId/rounds/:roundId/matches/:matchId/holes/:holeNumber - Update hole result
app.put("/:matchId/holes/:holeNumber", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const matchId = c.req.param("matchId");
  const holeNumber = parseInt(c.req.param("holeNumber"));
  const user = c.var.user;
  const body = await c.req.json<{
    teamAScore: number;
    teamBScore: number;
  }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);

  const ryderCup = round.ryderCup as RyderCupTournament;
  if (!ryderCup) throw badRequest("Round has no Ryder Cup data");

  const matchIndex = ryderCup.matches.findIndex((m) => m.id === matchId);
  if (matchIndex === -1) throw notFound("Match", matchId);

  const match = ryderCup.matches[matchIndex];

  // Determine hole result
  let result: HoleResult;
  if (body.teamAScore < body.teamBScore) {
    result = "team-a";
  } else if (body.teamBScore < body.teamAScore) {
    result = "team-b";
  } else {
    result = "tie";
  }

  const hole: MatchPlayHole = {
    holeNumber,
    teamAScore: body.teamAScore,
    teamBScore: body.teamBScore,
    result,
  };

  // Update or add hole
  const holeIndex = match.holes.findIndex((h) => h.holeNumber === holeNumber);
  if (holeIndex >= 0) {
    match.holes[holeIndex] = hole;
  } else {
    match.holes.push(hole);
    match.holes.sort((a, b) => a.holeNumber - b.holeNumber);
  }

  // Calculate match standing
  let teamAUp = 0;
  for (const h of match.holes) {
    if (h.result === "team-a") teamAUp++;
    else if (h.result === "team-b") teamAUp--;
  }

  const totalHoles = round.holes;
  const holesPlayed = match.holes.length;
  const holesRemaining = totalHoles - holesPlayed;

  // Check if match is decided
  if (Math.abs(teamAUp) > holesRemaining || holesRemaining === 0) {
    match.status = "completed";
    match.completedAt = new Date().toISOString();
    if (teamAUp > 0) {
      match.result = "team-a";
      match.points = { teamA: 1, teamB: 0 };
    } else if (teamAUp < 0) {
      match.result = "team-b";
      match.points = { teamA: 0, teamB: 1 };
    } else {
      match.result = "tie";
      match.points = { teamA: 0.5, teamB: 0.5 };
    }
  }

  // Recalculate team points
  ryderCup.teamAPoints = ryderCup.matches.reduce((sum, m) => sum + m.points.teamA, 0);
  ryderCup.teamBPoints = ryderCup.matches.reduce((sum, m) => sum + m.points.teamB, 0);

  // Add match status text
  const leader = teamAUp > 0 ? "team-a" : teamAUp < 0 ? "team-b" : "tied";
  const lead = Math.abs(teamAUp);
  hole.matchStatus =
    lead === 0
      ? "All Square"
      : lead === holesRemaining && lead > 0
        ? "Dormie"
        : `${lead}-up`;

  ryderCup.matches[matchIndex] = match;
  await db.update(rounds).set({ ryderCup }).where(eq(rounds.id, roundId));

  return c.json({
    matchId,
    holeNumber,
    teamAScore: body.teamAScore,
    teamBScore: body.teamBScore,
    result,
    currentStanding: {
      leader,
      holesUp: lead,
      holesRemaining,
    },
  });
});

export default app;
