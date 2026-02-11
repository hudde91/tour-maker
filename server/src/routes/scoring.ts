import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { scores, rounds, tours } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { notFound, forbidden } from "../middleware/error";

const app = new Hono();

app.use("/*", authMiddleware);

// POST /tours/:tourId/rounds/:roundId/scores/:playerId - Update player score
app.post("/:playerId", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const playerId = c.req.param("playerId");
  const user = c.var.user;
  const body = await c.req.json<{
    scores: (number | null)[];
    handicapStrokes?: number;
    stablefordManual?: number;
  }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);

  // Calculate totals from scores
  const holeInfo = round.holeInfo as any[];
  const totalPar = round.totalPar ?? holeInfo.reduce((sum: number, h: any) => sum + (h.par || 0), 0);
  const playedScores = body.scores.filter((s): s is number => s !== null);
  const playedPars = body.scores.reduce((sum: number, s, i) => {
    if (s !== null && holeInfo[i]) return sum + (holeInfo[i].par || 0);
    return sum;
  }, 0);

  const totalScore = playedScores.reduce((a, b) => a + b, 0);
  const totalToPar = totalScore - playedPars;
  const handicapStrokes = body.handicapStrokes ?? 0;
  const netScore = totalScore - handicapStrokes;
  const netToPar = totalToPar - handicapStrokes;

  // Upsert score (insert or update)
  const existing = await db
    .select()
    .from(scores)
    .where(and(eq(scores.roundId, roundId), eq(scores.playerId, playerId)))
    .limit(1);

  let result;
  if (existing.length > 0) {
    [result] = await db
      .update(scores)
      .set({
        scores: body.scores,
        totalScore,
        totalToPar,
        handicapStrokes: body.handicapStrokes,
        netScore: body.handicapStrokes ? netScore : null,
        netToPar: body.handicapStrokes ? netToPar : null,
      })
      .where(eq(scores.id, existing[0].id))
      .returning();
  } else {
    [result] = await db
      .insert(scores)
      .values({
        id: nanoid(),
        roundId,
        playerId,
        scores: body.scores,
        totalScore,
        totalToPar,
        handicapStrokes: body.handicapStrokes,
        netScore: body.handicapStrokes ? netScore : null,
        netToPar: body.handicapStrokes ? netToPar : null,
      })
      .returning();
  }

  return c.json({
    playerId: result.playerId,
    scores: result.scores,
    totalScore: result.totalScore,
    totalToPar: result.totalToPar,
    handicapStrokes: result.handicapStrokes ?? undefined,
    netScore: result.netScore ?? undefined,
    netToPar: result.netToPar ?? undefined,
    isTeamScore: false,
  });
});

export default app;
