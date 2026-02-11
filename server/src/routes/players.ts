import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { players, tours, teams } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { notFound, forbidden, badRequest } from "../middleware/error";

const app = new Hono();

app.use("/*", authMiddleware);

// POST /tours/:tourId/players - Add player
app.post("/", async (c) => {
  const tourId = c.req.param("tourId");
  const user = c.var.user;
  const body = await c.req.json<{ name: string; handicap?: number; teamId?: string }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  if (!body.name?.trim()) throw badRequest("Player name is required");

  const id = nanoid();
  const [player] = await db
    .insert(players)
    .values({
      id,
      tourId,
      name: body.name.trim(),
      handicap: body.handicap,
      teamId: body.teamId,
    })
    .returning();

  // If a team was specified, add this player to the team's player order
  if (body.teamId) {
    const [team] = await db.select().from(teams).where(eq(teams.id, body.teamId)).limit(1);
    if (team) {
      const currentOrder = (team.playerOrder as string[]) || [];
      await db
        .update(teams)
        .set({ playerOrder: [...currentOrder, id] })
        .where(eq(teams.id, body.teamId));
    }
  }

  return c.json(
    { id: player.id, name: player.name, handicap: player.handicap ?? undefined, teamId: player.teamId ?? undefined },
    201
  );
});

// GET /tours/:tourId/players - List players
app.get("/", async (c) => {
  const tourId = c.req.param("tourId");
  const teamId = c.req.query("teamId");

  const conditions = [eq(players.tourId, tourId)];
  if (teamId) conditions.push(eq(players.teamId, teamId));

  const result = await db
    .select()
    .from(players)
    .where(and(...conditions));

  return c.json({
    players: result.map((p) => ({
      id: p.id,
      name: p.name,
      handicap: p.handicap ?? undefined,
      teamId: p.teamId ?? undefined,
      userId: p.userId ?? undefined,
    })),
  });
});

// PUT /tours/:tourId/players/:playerId - Update player
app.put("/:playerId", async (c) => {
  const tourId = c.req.param("tourId");
  const playerId = c.req.param("playerId");
  const user = c.var.user;
  const body = await c.req.json<{ name?: string; handicap?: number; teamId?: string }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [existing] = await db
    .select()
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.tourId, tourId)))
    .limit(1);
  if (!existing) throw notFound("Player", playerId);

  const [updated] = await db
    .update(players)
    .set({
      ...(body.name && { name: body.name.trim() }),
      ...(body.handicap !== undefined && { handicap: body.handicap }),
      ...(body.teamId !== undefined && { teamId: body.teamId || null }),
    })
    .where(eq(players.id, playerId))
    .returning();

  return c.json({
    id: updated.id,
    name: updated.name,
    handicap: updated.handicap ?? undefined,
    teamId: updated.teamId ?? undefined,
    userId: updated.userId ?? undefined,
  });
});

// DELETE /tours/:tourId/players/:playerId - Remove player
app.delete("/:playerId", async (c) => {
  const tourId = c.req.param("tourId");
  const playerId = c.req.param("playerId");
  const user = c.var.user;

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  // Remove player from any team's player order
  const [player] = await db
    .select()
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.tourId, tourId)))
    .limit(1);

  if (!player) throw notFound("Player", playerId);

  if (player.teamId) {
    const [team] = await db.select().from(teams).where(eq(teams.id, player.teamId)).limit(1);
    if (team) {
      const currentOrder = (team.playerOrder as string[]) || [];
      await db
        .update(teams)
        .set({ playerOrder: currentOrder.filter((id) => id !== playerId) })
        .where(eq(teams.id, player.teamId));
    }
  }

  await db.delete(players).where(eq(players.id, playerId));
  return c.body(null, 204);
});

export default app;
