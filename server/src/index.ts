import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { errorHandler } from "./middleware/error";

import tourRoutes from "./routes/tours";
import playerRoutes from "./routes/players";
import teamRoutes from "./routes/teams";
import roundRoutes from "./routes/rounds";
import scoringRoutes from "./routes/scoring";
import teamScoringRoutes from "./routes/teamScoring";
import competitionWinnerRoutes from "./routes/competitionWinners";
import matchPlayRoutes from "./routes/matchPlay";
import ryderCupRoutes from "./routes/ryderCup";
import leaderboardRoutes from "./routes/leaderboard";
import statsRoutes from "./routes/stats";
import userRoutes from "./routes/user";
import settingsRoutes from "./routes/settings";

const app = new Hono();

// Global middleware
app.use("/*", cors({ origin: process.env.CORS_ORIGIN || "http://localhost:1420" }));
app.use("/*", logger());
app.onError(errorHandler);

// Health check
app.get("/api/v1/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Mount routes
app.route("/api/v1/tours", tourRoutes);
app.route("/api/v1/tours/:tourId/players", playerRoutes);
app.route("/api/v1/tours/:tourId/teams", teamRoutes);
app.route("/api/v1/tours/:tourId/rounds", roundRoutes);
app.route("/api/v1/tours/:tourId/rounds/:roundId/scores", scoringRoutes);
app.route("/api/v1/tours/:tourId/rounds/:roundId/team-scores", teamScoringRoutes);
app.route("/api/v1/tours/:tourId/rounds/:roundId/competition-winners", competitionWinnerRoutes);
app.route("/api/v1/tours/:tourId/rounds/:roundId/matches", matchPlayRoutes);
app.route("/api/v1/tours/:tourId/rounds/:roundId/ryder-cup-sessions", ryderCupRoutes);
app.route("/api/v1/tours/:tourId/leaderboard", leaderboardRoutes);
app.route("/api/v1/tours/:tourId/stats", statsRoutes);
app.route("/api/v1/users", userRoutes);
app.route("/api/v1/settings", settingsRoutes);

const port = parseInt(process.env.PORT || "3001");

console.log(`Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);

export default app;
