import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { tours, rounds, scores, players, teams } from "../db/schema";
import { optionalAuthMiddleware } from "../middleware/auth";
import { notFound } from "../middleware/error";

const app = new Hono();

// Leaderboards are public (viewable via shareable URL)
app.use("/*", optionalAuthMiddleware);

// GET /tours/:tourId/leaderboard - Tournament leaderboard
app.get("/", async (c) => {
  const tourId = c.req.param("tourId");
  const type = c.req.query("type") || "individual";
  const sortBy = c.req.query("sortBy") || "gross";

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);

  const tourPlayers = await db.select().from(players).where(eq(players.tourId, tourId));
  const tourTeams = await db.select().from(teams).where(eq(teams.tourId, tourId));
  const tourRounds = await db.select().from(rounds).where(eq(rounds.tourId, tourId));

  // Fetch all scores across all rounds
  const allScores: (typeof scores.$inferSelect)[] = [];
  for (const round of tourRounds) {
    const roundScores = await db.select().from(scores).where(eq(scores.roundId, round.id));
    allScores.push(...roundScores);
  }

  if (type === "team") {
    return c.json(buildTeamLeaderboard(tourTeams, tourPlayers, allScores));
  }

  return c.json(buildIndividualLeaderboard(tourPlayers, tourTeams, allScores, tourRounds, sortBy));
});

// GET /tours/:tourId/leaderboard/teams - Team leaderboard
app.get("/teams", async (c) => {
  const tourId = c.req.param("tourId");

  const tourPlayers = await db.select().from(players).where(eq(players.tourId, tourId));
  const tourTeams = await db.select().from(teams).where(eq(teams.tourId, tourId));
  const tourRounds = await db.select().from(rounds).where(eq(rounds.tourId, tourId));

  const allScores: (typeof scores.$inferSelect)[] = [];
  for (const round of tourRounds) {
    const roundScores = await db.select().from(scores).where(eq(scores.roundId, round.id));
    allScores.push(...roundScores);
  }

  return c.json(buildTeamLeaderboard(tourTeams, tourPlayers, allScores));
});

// GET /tours/:tourId/rounds/:roundId/leaderboard - Round leaderboard
app.get("/rounds/:roundId", async (c) => {
  const tourId = c.req.param("tourId");
  const roundId = c.req.param("roundId");

  const [round] = await db
    .select()
    .from(rounds)
    .where(and(eq(rounds.id, roundId), eq(rounds.tourId, tourId)))
    .limit(1);
  if (!round) throw notFound("Round", roundId);

  const tourPlayers = await db.select().from(players).where(eq(players.tourId, tourId));
  const tourTeams = await db.select().from(teams).where(eq(teams.tourId, tourId));
  const roundScores = await db.select().from(scores).where(eq(scores.roundId, roundId));

  const entries = tourPlayers
    .map((player) => {
      const score = roundScores.find((s) => s.playerId === player.id);
      if (!score) return null;

      const team = player.teamId ? tourTeams.find((t) => t.id === player.teamId) : undefined;

      return {
        position: 0,
        player: {
          id: player.id,
          name: player.name,
          handicap: player.handicap ?? undefined,
        },
        totalScore: score.totalScore,
        totalToPar: score.totalToPar,
        netScore: score.netScore ?? undefined,
        netToPar: score.netToPar ?? undefined,
        handicapStrokes: score.handicapStrokes ?? undefined,
        roundsPlayed: 1,
        team: team
          ? {
              id: team.id,
              name: team.name,
              captainId: team.captainId ?? "",
              playerIds: (team.playerOrder as string[]) || [],
              color: team.color,
            }
          : undefined,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.totalToPar - b!.totalToPar)
    .map((entry, i) => ({ ...entry!, position: i + 1 }));

  return c.json({
    roundId,
    roundName: round.name,
    type: "individual",
    entries,
  });
});

function buildIndividualLeaderboard(
  tourPlayers: any[],
  tourTeams: any[],
  allScores: any[],
  tourRounds: any[],
  sortBy: string
) {
  const playerScoreMap = new Map<string, { totalScore: number; totalToPar: number; netScore: number; netToPar: number; handicapStrokes: number; roundsPlayed: number }>();

  for (const score of allScores) {
    if (score.isTeamScore) continue;

    const existing = playerScoreMap.get(score.playerId) || {
      totalScore: 0,
      totalToPar: 0,
      netScore: 0,
      netToPar: 0,
      handicapStrokes: 0,
      roundsPlayed: 0,
    };

    existing.totalScore += score.totalScore;
    existing.totalToPar += score.totalToPar;
    existing.netScore += score.netScore || score.totalScore;
    existing.netToPar += score.netToPar || score.totalToPar;
    existing.handicapStrokes += score.handicapStrokes || 0;
    existing.roundsPlayed += 1;

    playerScoreMap.set(score.playerId, existing);
  }

  const entries = tourPlayers
    .map((player) => {
      const stats = playerScoreMap.get(player.id);
      if (!stats) return null;

      const team = player.teamId ? tourTeams.find((t: any) => t.id === player.teamId) : undefined;

      return {
        position: 0,
        player: {
          id: player.id,
          name: player.name,
          handicap: player.handicap ?? undefined,
        },
        totalScore: stats.totalScore,
        totalToPar: stats.totalToPar,
        netScore: stats.netScore,
        netToPar: stats.netToPar,
        handicapStrokes: stats.handicapStrokes,
        roundsPlayed: stats.roundsPlayed,
        team: team
          ? {
              id: team.id,
              name: team.name,
              captainId: team.captainId ?? "",
              playerIds: (team.playerOrder as string[]) || [],
              color: team.color,
            }
          : undefined,
      };
    })
    .filter(Boolean);

  // Sort
  if (sortBy === "net") {
    entries.sort((a, b) => a!.netToPar - b!.netToPar);
  } else {
    entries.sort((a, b) => a!.totalToPar - b!.totalToPar);
  }

  return {
    type: "individual",
    lastUpdated: new Date().toISOString(),
    entries: entries.map((e, i) => ({ ...e!, position: i + 1 })),
  };
}

function buildTeamLeaderboard(tourTeams: any[], tourPlayers: any[], allScores: any[]) {
  const entries = tourTeams.map((team) => {
    const teamPlayers = tourPlayers.filter((p: any) => p.teamId === team.id);
    const teamPlayerIds = new Set(teamPlayers.map((p: any) => p.id));

    let totalScore = 0;
    let totalToPar = 0;
    let netScore = 0;
    let netToPar = 0;
    let totalHandicapStrokes = 0;
    let playersWithScores = 0;

    for (const score of allScores) {
      if (teamPlayerIds.has(score.playerId) && !score.isTeamScore) {
        totalScore += score.totalScore;
        totalToPar += score.totalToPar;
        netScore += score.netScore || score.totalScore;
        netToPar += score.netToPar || score.totalToPar;
        totalHandicapStrokes += score.handicapStrokes || 0;
        playersWithScores++;
      }
    }

    return {
      position: 0,
      team: {
        id: team.id,
        name: team.name,
        captainId: team.captainId ?? "",
        playerIds: (team.playerOrder as string[]) || [],
        color: team.color,
      },
      totalScore,
      totalToPar,
      netScore,
      netToPar,
      totalHandicapStrokes,
      playersWithScores,
      totalPlayers: teamPlayers.length,
    };
  });

  entries.sort((a, b) => a.totalToPar - b.totalToPar);

  return {
    entries: entries.map((e, i) => ({ ...e, position: i + 1 })),
  };
}

export default app;
