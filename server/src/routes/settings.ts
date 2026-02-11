import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { userSettings } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { ensureUser } from "../services/user";

const app = new Hono();

app.use("/*", authMiddleware);

// GET /settings - Get app settings
app.get("/", async (c) => {
  const user = c.var.user;
  await ensureUser(user.uid, user.email);

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.uid))
    .limit(1);

  if (!settings) {
    // Return defaults
    return c.json({
      theme: "auto",
      defaultHandicap: 18,
      preferredScoringDisplay: "both",
      measurementUnit: "yards",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      showTips: true,
      compactMode: false,
    });
  }

  return c.json({
    theme: settings.theme,
    defaultHandicap: settings.defaultHandicap,
    preferredScoringDisplay: settings.preferredScoringDisplay,
    measurementUnit: settings.measurementUnit,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    showTips: settings.showTips,
    compactMode: settings.compactMode,
  });
});

// PUT /settings - Update app settings
app.put("/", async (c) => {
  const user = c.var.user;
  await ensureUser(user.uid, user.email);

  const body = await c.req.json();

  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.uid))
    .limit(1);

  const updateFields: Record<string, any> = {};
  if (body.theme !== undefined) updateFields.theme = body.theme;
  if (body.defaultHandicap !== undefined) updateFields.defaultHandicap = body.defaultHandicap;
  if (body.preferredScoringDisplay !== undefined) updateFields.preferredScoringDisplay = body.preferredScoringDisplay;
  if (body.measurementUnit !== undefined) updateFields.measurementUnit = body.measurementUnit;
  if (body.dateFormat !== undefined) updateFields.dateFormat = body.dateFormat;
  if (body.timeFormat !== undefined) updateFields.timeFormat = body.timeFormat;
  if (body.showTips !== undefined) updateFields.showTips = body.showTips;
  if (body.compactMode !== undefined) updateFields.compactMode = body.compactMode;

  if (existing.length > 0) {
    const [updated] = await db
      .update(userSettings)
      .set(updateFields)
      .where(eq(userSettings.userId, user.uid))
      .returning();
    return c.json(updated);
  } else {
    const [created] = await db
      .insert(userSettings)
      .values({ userId: user.uid, ...updateFields })
      .returning();
    return c.json(created);
  }
});

export default app;
