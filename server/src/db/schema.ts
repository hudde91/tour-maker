import {
  pgTable,
  text,
  boolean,
  real,
  integer,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

// --- Users (linked to Firebase Auth) ---
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Firebase UID
  playerName: text("player_name").notNull(),
  handicap: real("handicap"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Tournaments ---
export const tours = pgTable("tours", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  format: text("format").notNull(), // 'individual' | 'team' | 'ryder-cup'
  isActive: boolean("is_active").default(true).notNull(),
  archived: boolean("archived").default(false).notNull(),
  shareableUrl: text("shareable_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Teams (scoped to a tour) ---
export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  tourId: text("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  captainId: text("captain_id"), // references players.id, set after players exist
  playerOrder: jsonb("player_order").$type<string[]>().default([]),
});

// --- Players (scoped to a tour) ---
export const players = pgTable("players", {
  id: text("id").primaryKey(),
  tourId: text("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id), // nullable: guest players
  name: text("name").notNull(),
  handicap: real("handicap"),
  teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
});

// --- Rounds (scoped to a tour) ---
export const rounds = pgTable("rounds", {
  id: text("id").primaryKey(),
  tourId: text("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  courseName: text("course_name").notNull(),
  format: text("format").notNull(), // PlayFormat
  holes: integer("holes").notNull().default(18),
  holeInfo: jsonb("hole_info").notNull(), // HoleInfo[]
  totalPar: integer("total_par"),
  teeBoxes: text("tee_boxes"),
  slopeRating: text("slope_rating"),
  totalYardage: text("total_yardage"),
  startTime: timestamp("start_time", { withTimezone: true }),
  settings: jsonb("settings").notNull().default({}), // RoundSettings
  status: text("status").notNull().default("created"), // 'created' | 'in-progress' | 'completed'
  playerIds: jsonb("player_ids").$type<string[]>().default([]),
  ryderCup: jsonb("ryder_cup"), // RyderCupTournament | null
  isMatchPlay: boolean("is_match_play").default(false),
  competitionWinners: jsonb("competition_winners").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// --- Scores (one row per player per round) ---
export const scores = pgTable(
  "scores",
  {
    id: text("id").primaryKey(),
    roundId: text("round_id").notNull().references(() => rounds.id, { onDelete: "cascade" }),
    playerId: text("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
    scores: jsonb("scores").notNull(), // (number | null)[]
    totalScore: integer("total_score").notNull().default(0),
    totalToPar: integer("total_to_par").notNull().default(0),
    handicapStrokes: integer("handicap_strokes"),
    netScore: integer("net_score"),
    netToPar: integer("net_to_par"),
    isTeamScore: boolean("is_team_score").default(false),
    teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
  },
  (t) => [unique().on(t.roundId, t.playerId)]
);

// --- User Settings (one row per user) ---
export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => users.id),
  theme: text("theme").default("auto"),
  defaultHandicap: integer("default_handicap").default(18),
  preferredScoringDisplay: text("preferred_scoring_display").default("both"),
  measurementUnit: text("measurement_unit").default("yards"),
  dateFormat: text("date_format").default("MM/DD/YYYY"),
  timeFormat: text("time_format").default("12h"),
  showTips: boolean("show_tips").default(true),
  compactMode: boolean("compact_mode").default(false),
});
