import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { rounds, tours } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { notFound, forbidden } from "../middleware/error";

const app = new Hono();

app.use("/*", authMiddleware);

// POST /tours/:tourId/rounds/:roundId/competition-winners
app.post("/", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const user = c.var.user;
  const body = await c.req.json<{
    holeNumber: number;
    type: "closestToPin" | "longestDrive";
    winnerId: string | null;
    distance?: number;
    matchId?: string;
  }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);

  const winners = (round.competitionWinners as any) || { closestToPin: {}, longestDrive: {} };
  const typeWinners = winners[body.type] || {};
  const holeKey = String(body.holeNumber);

  if (body.winnerId === null) {
    // Remove winner
    if (body.matchId) {
      typeWinners[holeKey] = (typeWinners[holeKey] || []).filter(
        (w: any) => w.matchId !== body.matchId
      );
    } else {
      typeWinners[holeKey] = (typeWinners[holeKey] || []).filter(
        (w: any) => w.matchId
      );
    }
  } else {
    // Add/replace winner
    const entry = {
      playerId: body.winnerId,
      ...(body.distance !== undefined && { distance: body.distance }),
      ...(body.matchId && { matchId: body.matchId }),
    };

    if (!typeWinners[holeKey]) {
      typeWinners[holeKey] = [entry];
    } else {
      // Replace existing entry for same match (or non-match)
      const filtered = typeWinners[holeKey].filter((w: any) =>
        body.matchId ? w.matchId !== body.matchId : w.matchId
      );
      filtered.push(entry);
      typeWinners[holeKey] = filtered;
    }
  }

  winners[body.type] = typeWinners;

  await db
    .update(rounds)
    .set({ competitionWinners: winners })
    .where(eq(rounds.id, roundId));

  return c.json({
    holeNumber: body.holeNumber,
    type: body.type,
    winners: typeWinners[holeKey] || [],
  }, 201);
});

export default app;
