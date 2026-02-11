import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { scores, rounds, tours } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { notFound, forbidden } from "../middleware/error";

const app = new Hono();

app.use("/*", authMiddleware);

// POST /tours/:tourId/rounds/:roundId/team-scores/:teamId - Update team score
app.post("/:teamId", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const teamId = c.req.param("teamId");
  const user = c.var.user;
  const body = await c.req.json<{ scores: number[] }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);

  const holeInfo = round.holeInfo as any[];
  const totalScore = body.scores.reduce((a, b) => a + b, 0);
  const playedPars = body.scores.reduce((sum: number, s, i) => {
    if (s !== null && holeInfo[i]) return sum + (holeInfo[i].par || 0);
    return sum;
  }, 0);
  const totalToPar = totalScore - playedPars;

  // Use a synthetic player ID for team scores
  const syntheticPlayerId = `${teamId}_score`;

  const existing = await db
    .select()
    .from(scores)
    .where(and(eq(scores.roundId, roundId), eq(scores.playerId, syntheticPlayerId)))
    .limit(1);

  let result;
  if (existing.length > 0) {
    [result] = await db
      .update(scores)
      .set({
        scores: body.scores,
        totalScore,
        totalToPar,
      })
      .where(eq(scores.id, existing[0].id))
      .returning();
  } else {
    [result] = await db
      .insert(scores)
      .values({
        id: nanoid(),
        roundId,
        playerId: syntheticPlayerId,
        scores: body.scores,
        totalScore,
        totalToPar,
        isTeamScore: true,
        teamId,
      })
      .returning();
  }

  return c.json({
    playerId: syntheticPlayerId,
    teamId,
    scores: result.scores,
    totalScore: result.totalScore,
    totalToPar: result.totalToPar,
    isTeamScore: true,
  });
});

export default app;
