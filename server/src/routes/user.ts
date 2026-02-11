import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { ensureUser } from "../services/user";
import { notFound } from "../middleware/error";

const app = new Hono();

app.use("/*", authMiddleware);

// GET /users/me - Get current user profile
app.get("/me", async (c) => {
  const authUser = c.var.user;
  const user = await ensureUser(authUser.uid, authUser.email);

  return c.json({
    userId: user.id,
    playerName: user.playerName,
    handicap: user.handicap ?? undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
});

// PUT /users/me - Update profile
app.put("/me", async (c) => {
  const authUser = c.var.user;
  const body = await c.req.json<{ playerName?: string; handicap?: number }>();

  await ensureUser(authUser.uid, authUser.email);

  const [updated] = await db
    .update(users)
    .set({
      ...(body.playerName && { playerName: body.playerName.trim() }),
      ...(body.handicap !== undefined && { handicap: body.handicap }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, authUser.uid))
    .returning();

  return c.json({
    userId: updated.id,
    playerName: updated.playerName,
    handicap: updated.handicap ?? undefined,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export default app;
