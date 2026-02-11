import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { tours, players, teams, rounds, scores } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { notFound, forbidden, badRequest } from "../middleware/error";
import { ensureUser } from "../services/user";
import type { TourFormat } from "@tour-maker/shared";

const app = new Hono();

// All tour routes require auth
app.use("/*", authMiddleware);

// POST /tours - Create tournament
app.post("/", async (c) => {
  const user = c.var.user;
  await ensureUser(user.uid, user.email);

  const body = await c.req.json<{ name: string; description?: string; format: TourFormat }>();

  if (!body.name?.trim()) throw badRequest("Tournament name is required");
  if (!["individual", "team", "ryder-cup"].includes(body.format)) {
    throw badRequest("Invalid format", { field: "format", expected: "individual | team | ryder-cup" });
  }

  const id = nanoid();
  const [tour] = await db
    .insert(tours)
    .values({
      id,
      ownerId: user.uid,
      name: body.name.trim(),
      description: body.description,
      format: body.format,
      shareableUrl: `${c.req.header("Origin") || ""}/tour/${id}`,
    })
    .returning();

  return c.json(tour, 201);
});

// GET /tours - List user's tournaments
app.get("/", async (c) => {
  const user = c.var.user;
  const archived = c.req.query("archived");
  const format = c.req.query("format");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  let query = db.select().from(tours).where(eq(tours.ownerId, user.uid)).orderBy(desc(tours.createdAt));

  const allTours = await query.limit(limit).offset(offset);

  // Apply filters in memory (simple enough for personal tournament lists)
  let filtered = allTours;
  if (archived !== undefined) {
    filtered = filtered.filter((t) => t.archived === (archived === "true"));
  }
  if (format) {
    filtered = filtered.filter((t) => t.format === format);
  }

  return c.json({
    tours: filtered,
    total: filtered.length,
    limit,
    offset,
  });
});

// GET /tours/:tourId - Get full tournament with nested data
app.get("/:tourId", async (c) => {
  const tourId = c.req.param("tourId");
  const user = c.var.user;

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);

  // Fetch nested data
  const [tourPlayers, tourTeams, tourRounds] = await Promise.all([
    db.select().from(players).where(eq(players.tourId, tourId)),
    db.select().from(teams).where(eq(teams.tourId, tourId)),
    db.select().from(rounds).where(eq(rounds.tourId, tourId)),
  ]);

  // Fetch scores for each round
  const roundIds = tourRounds.map((r) => r.id);
  const allScores =
    roundIds.length > 0
      ? await db.select().from(scores).where(
          // Fetch all scores for rounds in this tour
          eq(scores.roundId, roundIds[0]) // Will be expanded below
        )
      : [];

  // Actually fetch scores for all rounds
  const scoresByRound: Record<string, typeof allScores> = {};
  for (const round of tourRounds) {
    const roundScores = await db.select().from(scores).where(eq(scores.roundId, round.id));
    scoresByRound[round.id] = roundScores;
  }

  // Assemble the full Tour shape matching the frontend type
  const fullTour = {
    ...tour,
    players: tourPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      handicap: p.handicap ?? undefined,
      teamId: p.teamId ?? undefined,
      userId: p.userId ?? undefined,
    })),
    teams: tourTeams.map((t) => ({
      id: t.id,
      name: t.name,
      captainId: t.captainId ?? "",
      playerIds: (t.playerOrder as string[]) || [],
      color: t.color,
    })),
    rounds: tourRounds.map((r) => {
      const roundScores = scoresByRound[r.id] || [];
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

      return {
        id: r.id,
        name: r.name,
        courseName: r.courseName,
        format: r.format,
        holes: r.holes,
        holeInfo: r.holeInfo,
        totalPar: r.totalPar ?? undefined,
        teeBoxes: r.teeBoxes ?? undefined,
        slopeRating: r.slopeRating ?? undefined,
        totalYardage: r.totalYardage ?? undefined,
        startTime: r.startTime?.toISOString() ?? undefined,
        playerIds: (r.playerIds as string[]) || undefined,
        settings: r.settings,
        createdAt: r.createdAt.toISOString(),
        startedAt: r.startedAt?.toISOString() ?? undefined,
        completedAt: r.completedAt?.toISOString() ?? undefined,
        scores: scoresMap,
        status: r.status as "created" | "in-progress" | "completed",
        ryderCup: r.ryderCup ?? undefined,
        isMatchPlay: r.isMatchPlay ?? undefined,
        competitionWinners: r.competitionWinners ?? undefined,
      };
    }),
  };

  return c.json(fullTour);
});

// PUT /tours/:tourId - Update tournament details
app.put("/:tourId", async (c) => {
  const tourId = c.req.param("tourId");
  const user = c.var.user;
  const body = await c.req.json<{ name?: string; description?: string }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [updated] = await db
    .update(tours)
    .set({
      ...(body.name && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description }),
    })
    .where(eq(tours.id, tourId))
    .returning();

  return c.json(updated);
});

// PATCH /tours/:tourId/format - Change format
app.patch("/:tourId/format", async (c) => {
  const tourId = c.req.param("tourId");
  const user = c.var.user;
  const body = await c.req.json<{ format: TourFormat }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [updated] = await db
    .update(tours)
    .set({ format: body.format })
    .where(eq(tours.id, tourId))
    .returning();

  return c.json(updated);
});

// PATCH /tours/:tourId/archive - Archive/unarchive
app.patch("/:tourId/archive", async (c) => {
  const tourId = c.req.param("tourId");
  const user = c.var.user;
  const body = await c.req.json<{ archived: boolean }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [updated] = await db
    .update(tours)
    .set({ archived: body.archived })
    .where(eq(tours.id, tourId))
    .returning();

  return c.json(updated);
});

// DELETE /tours/:tourId
app.delete("/:tourId", async (c) => {
  const tourId = c.req.param("tourId");
  const user = c.var.user;

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  await db.delete(tours).where(eq(tours.id, tourId));
  return c.body(null, 204);
});

export default app;
