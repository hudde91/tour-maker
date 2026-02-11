import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { rounds, tours, scores } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { notFound, forbidden, badRequest, conflict } from "../middleware/error";
import type { HoleInfo, RoundSettings, RyderCupTournament } from "@tour-maker/shared";

const app = new Hono();

app.use("/*", authMiddleware);

// POST /tours/:tourId/rounds - Create round
app.post("/", async (c) => {
  const tourId = c.req.param("tourId");
  const user = c.var.user;
  const body = await c.req.json<{
    name: string;
    courseName: string;
    format: string;
    holes: number;
    holeInfo: HoleInfo[];
    totalPar?: number;
    teeBoxes?: string;
    slopeRating?: string;
    totalYardage?: string;
    startTime?: string;
    playerIds?: string[];
    settings: RoundSettings;
  }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  if (!body.name?.trim()) throw badRequest("Round name is required");
  if (!body.courseName?.trim()) throw badRequest("Course name is required");
  if (body.playerIds && (body.playerIds.length < 1 || body.playerIds.length > 4)) {
    throw badRequest("A round must have between 1 and 4 players");
  }

  const id = nanoid();

  // Initialize Ryder Cup container if tour is in Ryder Cup mode
  let ryderCup: RyderCupTournament | null = null;
  let isMatchPlay = false;
  if (tour.format === "ryder-cup") {
    ryderCup = {
      teamAPoints: 0,
      teamBPoints: 0,
      targetPoints: 0,
      matches: [],
      sessions: {
        day1Foursomes: [],
        day1FourBall: [],
        day2Foursomes: [],
        day2FourBall: [],
        day3Singles: [],
      },
    };
    isMatchPlay = true;
  }

  const [round] = await db
    .insert(rounds)
    .values({
      id,
      tourId,
      name: body.name.trim(),
      courseName: body.courseName.trim(),
      format: body.format,
      holes: body.holes,
      holeInfo: body.holeInfo,
      totalPar: body.totalPar,
      teeBoxes: body.teeBoxes,
      slopeRating: body.slopeRating,
      totalYardage: body.totalYardage,
      startTime: body.startTime ? new Date(body.startTime) : null,
      playerIds: body.playerIds || [],
      settings: body.settings,
      ryderCup,
      isMatchPlay,
      competitionWinners: { closestToPin: {}, longestDrive: {} },
    })
    .returning();

  return c.json(
    {
      id: round.id,
      name: round.name,
      courseName: round.courseName,
      format: round.format,
      holes: round.holes,
      holeInfo: round.holeInfo,
      totalPar: round.totalPar ?? undefined,
      status: round.status,
      createdAt: round.createdAt.toISOString(),
      scores: {},
      competitionWinners: round.competitionWinners,
    },
    201
  );
});

// GET /tours/:tourId/rounds/:roundId - Get round
app.get("/:roundId", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);

  const roundScores = await db.select().from(scores).where(eq(scores.roundId, roundId));
  const scoresMap: Record<string, any> = {};
  for (const s of roundScores) {
    scoresMap[s.playerId] = {
      playerId: s.playerId,
      scores: s.scores,
      totalScore: s.totalScore,
      totalToPar: s.totalToPar,
      handicapStrokes: s.handicapStrokes ?? undefined,
      netScore: s.netScore ?? undefined,
      netToPar: s.netToPar ?? undefined,
      isTeamScore: s.isTeamScore ?? false,
      teamId: s.teamId ?? undefined,
    };
  }

  return c.json({
    id: round.id,
    name: round.name,
    courseName: round.courseName,
    format: round.format,
    holes: round.holes,
    holeInfo: round.holeInfo,
    totalPar: round.totalPar ?? undefined,
    teeBoxes: round.teeBoxes ?? undefined,
    slopeRating: round.slopeRating ?? undefined,
    totalYardage: round.totalYardage ?? undefined,
    startTime: round.startTime?.toISOString() ?? undefined,
    playerIds: (round.playerIds as string[]) || undefined,
    settings: round.settings,
    createdAt: round.createdAt.toISOString(),
    startedAt: round.startedAt?.toISOString() ?? undefined,
    completedAt: round.completedAt?.toISOString() ?? undefined,
    scores: scoresMap,
    status: round.status,
    ryderCup: round.ryderCup ?? undefined,
    isMatchPlay: round.isMatchPlay ?? undefined,
    competitionWinners: round.competitionWinners ?? undefined,
  });
});

// PUT /tours/:tourId/rounds/:roundId - Update round
app.put("/:roundId", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const user = c.var.user;
  const body = await c.req.json();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const updateFields: Record<string, any> = {};
  if (body.name) updateFields.name = body.name.trim();
  if (body.courseName) updateFields.courseName = body.courseName.trim();
  if (body.format) updateFields.format = body.format;
  if (body.holes) updateFields.holes = body.holes;
  if (body.holeInfo) updateFields.holeInfo = body.holeInfo;
  if (body.totalPar !== undefined) updateFields.totalPar = body.totalPar;
  if (body.teeBoxes !== undefined) updateFields.teeBoxes = body.teeBoxes;
  if (body.slopeRating !== undefined) updateFields.slopeRating = body.slopeRating;
  if (body.totalYardage !== undefined) updateFields.totalYardage = body.totalYardage;
  if (body.settings) updateFields.settings = body.settings;
  if (body.playerIds) updateFields.playerIds = body.playerIds;
  if (body.ryderCup !== undefined) updateFields.ryderCup = body.ryderCup;
  if (body.isMatchPlay !== undefined) updateFields.isMatchPlay = body.isMatchPlay;
  if (body.competitionWinners !== undefined) updateFields.competitionWinners = body.competitionWinners;

  const [updated] = await db
    .update(rounds)
    .set(updateFields)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .returning();

  if (!updated) throw notFound("Round", roundId);

  return c.json(updated);
});

// POST /tours/:tourId/rounds/:roundId/start - Start round
app.post("/:roundId/start", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const user = c.var.user;

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);
  if (round.status !== "created") throw conflict("Round has already been started");

  const [updated] = await db
    .update(rounds)
    .set({ status: "in-progress", startedAt: new Date() })
    .where(eq(rounds.id, roundId))
    .returning();

  return c.json({ id: updated.id, status: updated.status, startedAt: updated.startedAt?.toISOString() });
});

// POST /tours/:tourId/rounds/:roundId/complete - Complete round
app.post("/:roundId/complete", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const user = c.var.user;

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);
  if (round.status === "completed") throw conflict("Round is already completed");

  const [updated] = await db
    .update(rounds)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(rounds.id, roundId))
    .returning();

  return c.json({ id: updated.id, status: updated.status, completedAt: updated.completedAt?.toISOString() });
});

// DELETE /tours/:tourId/rounds/:roundId - Delete round
app.delete("/:roundId", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const user = c.var.user;

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  await db.delete(rounds).where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)));
  return c.body(null, 204);
});

// PATCH /tours/:tourId/rounds/:roundId/course - Update course details
app.patch("/:roundId/course", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const user = c.var.user;
  const body = await c.req.json<{
    name?: string;
    courseName?: string;
    teeBoxes?: string;
    slopeRating?: string;
    totalYardage?: string;
  }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const updateFields: Record<string, any> = {};
  if (body.name) updateFields.name = body.name;
  if (body.courseName) updateFields.courseName = body.courseName;
  if (body.teeBoxes !== undefined) updateFields.teeBoxes = body.teeBoxes;
  if (body.slopeRating !== undefined) updateFields.slopeRating = body.slopeRating;
  if (body.totalYardage !== undefined) updateFields.totalYardage = body.totalYardage;

  const [updated] = await db
    .update(rounds)
    .set(updateFields)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .returning();

  if (!updated) throw notFound("Round", roundId);
  return c.json(updated);
});

// PATCH /tours/:tourId/rounds/:roundId/start-time - Update start time
app.patch("/:roundId/start-time", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const user = c.var.user;
  const body = await c.req.json<{ startTime: string }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [updated] = await db
    .update(rounds)
    .set({ startTime: new Date(body.startTime) })
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .returning();

  if (!updated) throw notFound("Round", roundId);
  return c.json(updated);
});

export default app;
