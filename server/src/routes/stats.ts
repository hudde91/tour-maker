import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { tours, rounds, scores, players } from "../db/schema";
import { optionalAuthMiddleware } from "../middleware/auth";
import { notFound } from "../middleware/error";

const app = new Hono();

app.use("/*", optionalAuthMiddleware);

// GET /tours/:tourId/rounds/:roundId/players/:playerId/stats - Player round stats
app.get("/rounds/:roundId/players/:playerId/stats", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");
  const playerId = c.req.param("playerId");

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);

  const [score] = await db
    .select()
    .from(scores)
    .where(and(eq(scores.roundId, roundId), eq(scores.playerId, playerId)))
    .limit(1);
  if (!score) throw notFound("Score for player", playerId);

  const holeInfo = round.holeInfo as any[];
  const playerScores = score.scores as (number | null)[];

  let birdieCount = 0;
  let parCount = 0;
  let bogeyCount = 0;
  let doubleBogeyOrWorse = 0;
  let eagleOrBetter = 0;
  let bestHole: { holeNumber: number; score: number; toPar: number } | null = null;
  let worstHole: { holeNumber: number; score: number; toPar: number } | null = null;

  const front9 = { score: 0, toPar: 0, birdies: 0, pars: 0, bogeys: 0, holesPlayed: 0 };
  const back9 = { score: 0, toPar: 0, birdies: 0, pars: 0, bogeys: 0, holesPlayed: 0 };

  let streakType: string = "none";
  let streakLength = 0;
  let currentStreakType: string | null = null;
  let currentStreakLength = 0;

  for (let i = 0; i < playerScores.length; i++) {
    const s = playerScores[i];
    if (s === null || !holeInfo[i]) continue;

    const par = holeInfo[i].par || 4;
    const toPar = s - par;
    const segment = i < 9 ? front9 : back9;

    segment.score += s;
    segment.toPar += toPar;
    segment.holesPlayed++;

    if (toPar <= -2) {
      eagleOrBetter++;
    } else if (toPar === -1) {
      birdieCount++;
      segment.birdies++;
    } else if (toPar === 0) {
      parCount++;
      segment.pars++;
    } else if (toPar === 1) {
      bogeyCount++;
      segment.bogeys++;
    } else {
      doubleBogeyOrWorse++;
    }

    if (!bestHole || toPar < bestHole.toPar) {
      bestHole = { holeNumber: i + 1, score: s, toPar };
    }
    if (!worstHole || toPar > worstHole.toPar) {
      worstHole = { holeNumber: i + 1, score: s, toPar };
    }

    // Track streak
    const holeType =
      toPar < 0 ? "under-par" : toPar === 0 ? "par" : "over-par";
    if (holeType === currentStreakType) {
      currentStreakLength++;
    } else {
      currentStreakType = holeType;
      currentStreakLength = 1;
    }
    streakType = currentStreakType;
    streakLength = currentStreakLength;
  }

  return c.json({
    playerId,
    roundId,
    birdieCount,
    parCount,
    bogeyCount,
    doubleBogeyOrWorse,
    eagleOrBetter,
    bestHole,
    worstHole,
    currentStreak: {
      type: streakType as any,
      length: streakLength,
    },
    front9,
    back9,
  });
});

// GET /tours/:tourId/stats - Tournament stats
app.get("/", async (c) => {
  const tourId = c.req.param("tourId");

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);

  const tourPlayers = await db.select().from(players).where(eq(players.tourId, tourId));
  const tourRounds = await db.select().from(rounds).where(eq(rounds.tourId, tourId));

  const allScores: (typeof scores.$inferSelect)[] = [];
  for (const round of tourRounds) {
    const roundScores = await db.select().from(scores).where(eq(scores.roundId, round.id));
    allScores.push(...roundScores);
  }

  const completedRounds = tourRounds.filter((r) => r.status === "completed").length;
  const individualScores = allScores.filter((s) => !s.isTeamScore);

  const totalScores = individualScores.map((s) => s.totalScore);
  const averageScore = totalScores.length > 0 ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 0;

  let lowestRound: { playerId: string; roundId: string; score: number; toPar: number } | null = null;
  for (const s of individualScores) {
    if (!lowestRound || s.totalToPar < lowestRound.toPar) {
      lowestRound = { playerId: s.playerId, roundId: s.roundId, score: s.totalScore, toPar: s.totalToPar };
    }
  }

  return c.json({
    totalRounds: tourRounds.length,
    totalPlayers: tourPlayers.length,
    completedRounds,
    averageScore: Math.round(averageScore * 10) / 10,
    lowestRound,
  });
});

export default app;
