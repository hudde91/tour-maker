import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { rounds, tours } from "../db/schema";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { notFound, forbidden, badRequest } from "../middleware/error";
import type { MatchPlayRound, RyderCupTournament } from "@tour-maker/shared";

const app = new Hono();

// POST /tours/:tourId/rounds/:roundId/ryder-cup-sessions - Create session
app.post("/", authMiddleware, async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const user = c.var.user;
  const body = await c.req.json<{
    sessionType: string;
    pairings: { teamAPlayerIds: string[]; teamBPlayerIds: string[] }[];
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

  // Determine match format from session type
  let matchFormat: "singles" | "foursomes" | "four-ball";
  let sessionKey: keyof typeof ryderCup.sessions;
  const st = body.sessionType;

  if (st.includes("singles")) {
    matchFormat = "singles";
    sessionKey = "day3Singles";
  } else if (st.includes("foursomes") || st === "foursomes") {
    matchFormat = "foursomes";
    if (st.includes("day2")) sessionKey = "day2Foursomes";
    else sessionKey = "day1Foursomes";
  } else {
    matchFormat = "four-ball";
    if (st.includes("day2")) sessionKey = "day2FourBall";
    else sessionKey = "day1FourBall";
  }

  // Get teams from the tour
  const tourTeams = await db.query.teams.findMany({
    where: (t, { eq: e }) => e(t.tourId, tourId),
  });
  const teamA = tourTeams[0];
  const teamB = tourTeams[1];
  if (!teamA || !teamB) throw badRequest("Ryder Cup requires exactly 2 teams");

  const createdMatches: MatchPlayRound[] = [];

  for (const pairing of body.pairings) {
    const match: MatchPlayRound = {
      id: nanoid(),
      roundId,
      format: matchFormat,
      teamA: { id: teamA.id, playerIds: pairing.teamAPlayerIds },
      teamB: { id: teamB.id, playerIds: pairing.teamBPlayerIds },
      holes: [],
      status: "in-progress",
      result: "ongoing",
      points: { teamA: 0, teamB: 0 },
    };

    ryderCup.matches.push(match);
    ryderCup.sessions[sessionKey].push(match.id);
    createdMatches.push(match);
  }

  await db.update(rounds).set({ ryderCup }).where(eq(rounds.id, roundId));

  return c.json({ session: body.sessionType, matches: createdMatches }, 201);
});

// GET /tours/:tourId/rounds/:roundId/ryder-cup - Get Ryder Cup status
app.get("/", optionalAuthMiddleware, async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);

  const ryderCup = round.ryderCup as RyderCupTournament | null;
  if (!ryderCup) throw notFound("Ryder Cup data");

  return c.json(ryderCup);
});

export default app;
