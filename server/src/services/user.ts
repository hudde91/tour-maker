import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Ensures a user row exists in the database for the given Firebase UID.
 * Creates the user on first login using Firebase profile data.
 */
export async function ensureUser(uid: string, email?: string): Promise<typeof users.$inferSelect> {
  const existing = await db.select().from(users).where(eq(users.id, uid)).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Auto-provision on first login
  const [newUser] = await db
    .insert(users)
    .values({
      id: uid,
      playerName: email?.split("@")[0] ?? "Player",
    })
    .returning();

  return newUser;
}
