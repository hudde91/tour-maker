import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { teams, tours, players } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { notFound, forbidden, badRequest } from "../middleware/error";

const app = new Hono();

app.use("/*", authMiddleware);

// POST /tours/:tourId/teams - Create team
app.post("/", async (c) => {
  const tourId = c.req.param("tourId");
  const user = c.var.user;
  const body = await c.req.json<{ name: string; color: string; captainId?: string; playerIds?: string[] }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  if (!body.name?.trim()) throw badRequest("Team name is required");
  if (!body.color) throw badRequest("Team color is required");

  const id = nanoid();
  const playerOrder = body.captainId ? [body.captainId] : [];

  const [team] = await db
    .insert(teams)
    .values({
      id,
      tourId,
      name: body.name.trim(),
      color: body.color,
      captainId: body.captainId || null,
      playerOrder,
    })
    .returning();

  // Assign captain to team if specified
  if (body.captainId) {
    await db.update(players).set({ teamId: id }).where(eq(players.id, body.captainId));
  }

  return c.json(
    {
      id: team.id,
      name: team.name,
      color: team.color,
      captainId: team.captainId ?? "",
      playerIds: (team.playerOrder as string[]) || [],
    },
    201
  );
});

// PUT /tours/:tourId/teams/:teamId - Update team
app.put("/:teamId", async (c) => {
  const tourId = c.req.param("tourId");
  const teamId = c.req.param("teamId");
  const user = c.var.user;
  const body = await c.req.json<{ name?: string; color?: string }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [existing] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.tourId, tourId)))
    .limit(1);
  if (!existing) throw notFound("Team", teamId);

  const [updated] = await db
    .update(teams)
    .set({
      ...(body.name && { name: body.name.trim() }),
      ...(body.color && { color: body.color }),
    })
    .where(eq(teams.id, teamId))
    .returning();

  return c.json({
    id: updated.id,
    name: updated.name,
    color: updated.color,
    captainId: updated.captainId ?? "",
    playerIds: (updated.playerOrder as string[]) || [],
  });
});

// DELETE /tours/:tourId/teams/:teamId - Delete team
app.delete("/:teamId", async (c) => {
  const tourId = c.req.param("tourId");
  const teamId = c.req.param("teamId");
  const user = c.var.user;

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  // Unassign all players from this team
  await db.update(players).set({ teamId: null }).where(eq(players.teamId, teamId));
  await db.delete(teams).where(eq(teams.id, teamId));

  return c.body(null, 204);
});

// POST /tours/:tourId/teams/:teamId/players/:playerId - Assign player to team
app.post("/:teamId/players/:playerId", async (c) => {
  const tourId = c.req.param("tourId");
  const teamId = c.req.param("teamId");
  const playerId = c.req.param("playerId");
  const user = c.var.user;

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  // Remove player from current team's order if any
  const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (!player) throw notFound("Player", playerId);

  if (player.teamId && player.teamId !== teamId) {
    const [oldTeam] = await db.select().from(teams).where(eq(teams.id, player.teamId)).limit(1);
    if (oldTeam) {
      const oldOrder = (oldTeam.playerOrder as string[]) || [];
      await db.update(teams).set({ playerOrder: oldOrder.filter((id) => id !== playerId) }).where(eq(teams.id, player.teamId));
    }
  }

  // Add to new team
  await db.update(players).set({ teamId }).where(eq(players.id, playerId));

  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (team) {
    const currentOrder = (team.playerOrder as string[]) || [];
    if (!currentOrder.includes(playerId)) {
      await db.update(teams).set({ playerOrder: [...currentOrder, playerId] }).where(eq(teams.id, teamId));
    }
  }

  return c.json({ playerId, teamId });
});

// DELETE /tours/:tourId/teams/:teamId/players/:playerId - Remove player from team
app.delete("/:teamId/players/:playerId", async (c) => {
  const tourId = c.req.param("tourId");
  const teamId = c.req.param("teamId");
  const playerId = c.req.param("playerId");
  const user = c.var.user;

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  await db.update(players).set({ teamId: null }).where(eq(players.id, playerId));

  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (team) {
    const currentOrder = (team.playerOrder as string[]) || [];
    await db.update(teams).set({ playerOrder: currentOrder.filter((id) => id !== playerId) }).where(eq(teams.id, teamId));
  }

  return c.body(null, 204);
});

// PATCH /tours/:tourId/teams/:teamId/captain - Set captain
app.patch("/:teamId/captain", async (c) => {
  const tourId = c.req.param("tourId");
  const teamId = c.req.param("teamId");
  const user = c.var.user;
  const body = await c.req.json<{ captainId: string }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [updated] = await db
    .update(teams)
    .set({ captainId: body.captainId })
    .where(eq(teams.id, teamId))
    .returning();

  return c.json({
    id: updated.id,
    name: updated.name,
    color: updated.color,
    captainId: updated.captainId ?? "",
    playerIds: (updated.playerOrder as string[]) || [],
  });
});

// PATCH /tours/:tourId/teams/:teamId/players/order - Reorder players
app.patch("/:teamId/players/order", async (c) => {
  const tourId = c.req.param("tourId");
  const teamId = c.req.param("teamId");
  const user = c.var.user;
  const body = await c.req.json<{ playerIds: string[] }>();

  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) throw notFound("Tournament", tourId);
  if (tour.ownerId !== user.uid) throw forbidden();

  const [updated] = await db
    .update(teams)
    .set({ playerOrder: body.playerIds })
    .where(eq(teams.id, teamId))
    .returning();

  return c.json({
    id: updated.id,
    name: updated.name,
    color: updated.color,
    captainId: updated.captainId ?? "",
    playerIds: (updated.playerOrder as string[]) || [],
  });
});

export default app;
