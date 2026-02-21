# Backend Architecture Plan

## Current State

The app is a React/TypeScript SPA that stores all data in **browser localStorage**. Authentication is handled by Firebase (Google Sign-In). The React Query hooks call directly into a `storage` module (`src/lib/storage/`) that reads/writes localStorage. There is no server, no shared state between devices, and no persistence beyond the browser.

---

## Repository Structure: Monorepo

Keep the backend in the **same repository** as the frontend, in a `server/` directory.

```
tour-maker/
├── src/                  # Frontend (existing React app)
├── server/               # Backend (new)
│   ├── src/
│   │   ├── routes/       # Route handlers grouped by resource
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── db/           # Database client, migrations, seeds
│   │   ├── services/     # Business logic (scoring, leaderboards)
│   │   └── types/        # Shared TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── shared/               # Types shared between frontend and backend
│   └── types/
├── package.json          # Root workspace
└── ...
```

**Why monorepo:**
- The frontend types (`Tour`, `Player`, `Round`, etc.) can be shared directly with the backend via a `shared/` package instead of maintaining two copies.
- One PR can contain both the API endpoint and the React hook that calls it, making changes atomic.
- Deployment is simpler in the early stage -- both pieces live together.
- The app is small enough that a separate repo adds overhead without benefit.

Use **npm workspaces** (or pnpm) to manage the three packages: `client` (existing frontend), `server` (new), and `shared` (types).

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Runtime** | Node.js | Same language as the frontend; shared types |
| **Framework** | **Hono** | Lightweight, fast, runs on Vercel/Cloudflare/Node. Built-in middleware for auth, CORS, validation. Much lighter than Express. |
| **Database** | **PostgreSQL** (hosted on Supabase or Neon) | Relational data (tours have players, rounds, teams) maps naturally to SQL. Supports JSON columns for flexible fields like `holeInfo[]` and `scores`. Free tiers available on both Supabase and Neon. |
| **ORM** | **Drizzle ORM** | Type-safe SQL, lightweight, great TypeScript integration, generates migrations. Much simpler than Prisma for this use case. |
| **Auth** | **Firebase Admin SDK** | You already use Firebase Auth on the client. The backend verifies Firebase JWT tokens server-side using the Admin SDK. No new auth system needed. |
| **Hosting** | **Vercel** (serverless functions) or **Railway/Fly.io** (long-running server) | You already deploy the frontend on Vercel. The backend can be deployed as Vercel serverless functions initially, or as a standalone server on Railway if you need WebSockets. |
| **Real-time** (later) | **Supabase Realtime** or **WebSockets on Railway** | Not needed for v1. Add when live scoring across devices becomes a priority. |

---

## Database Schema

Six core tables, plus a settings table. This maps directly to your existing TypeScript types.

```sql
-- Users (linked to Firebase Auth)
CREATE TABLE users (
  id            TEXT PRIMARY KEY,          -- Firebase UID
  player_name   TEXT NOT NULL,
  handicap      REAL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Tournaments
CREATE TABLE tours (
  id            TEXT PRIMARY KEY,
  owner_id      TEXT NOT NULL REFERENCES users(id),
  name          TEXT NOT NULL,
  description   TEXT,
  format        TEXT NOT NULL CHECK (format IN ('individual', 'team', 'ryder-cup')),
  is_active     BOOLEAN DEFAULT true,
  archived      BOOLEAN DEFAULT false,
  shareable_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Players (scoped to a tour)
CREATE TABLE players (
  id            TEXT PRIMARY KEY,
  tour_id       TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  user_id       TEXT REFERENCES users(id),   -- nullable: guest players have no account
  name          TEXT NOT NULL,
  handicap      REAL,
  team_id       TEXT REFERENCES teams(id) ON DELETE SET NULL
);

-- Teams (scoped to a tour)
CREATE TABLE teams (
  id            TEXT PRIMARY KEY,
  tour_id       TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color         TEXT NOT NULL,
  captain_id    TEXT REFERENCES players(id) ON DELETE SET NULL,
  player_order  TEXT[]                       -- ordered player IDs
);

-- Rounds (scoped to a tour)
CREATE TABLE rounds (
  id              TEXT PRIMARY KEY,
  tour_id         TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  course_name     TEXT NOT NULL,
  format          TEXT NOT NULL,
  holes           INTEGER NOT NULL DEFAULT 18,
  hole_info       JSONB NOT NULL,            -- HoleInfo[]
  total_par       INTEGER,
  tee_boxes       TEXT,
  slope_rating    TEXT,
  total_yardage   TEXT,
  start_time      TIMESTAMPTZ,
  settings        JSONB NOT NULL DEFAULT '{}', -- RoundSettings
  status          TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'in-progress', 'completed')),
  player_ids      TEXT[],
  ryder_cup       JSONB,                     -- RyderCupTournament (nullable)
  is_match_play   BOOLEAN DEFAULT false,
  competition_winners JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

-- Scores (one row per player per round)
CREATE TABLE scores (
  id                TEXT PRIMARY KEY,
  round_id          TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id         TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  scores            JSONB NOT NULL,          -- (number | null)[]
  total_score       INTEGER NOT NULL DEFAULT 0,
  total_to_par      INTEGER NOT NULL DEFAULT 0,
  handicap_strokes  INTEGER,
  net_score         INTEGER,
  net_to_par        INTEGER,
  is_team_score     BOOLEAN DEFAULT false,
  team_id           TEXT REFERENCES teams(id) ON DELETE SET NULL,
  UNIQUE (round_id, player_id)
);

-- User settings (one row per user)
CREATE TABLE user_settings (
  user_id                    TEXT PRIMARY KEY REFERENCES users(id),
  theme                      TEXT DEFAULT 'auto',
  default_handicap           INTEGER DEFAULT 18,
  preferred_scoring_display  TEXT DEFAULT 'both',
  measurement_unit           TEXT DEFAULT 'yards',
  date_format                TEXT DEFAULT 'MM/DD/YYYY',
  time_format                TEXT DEFAULT '12h',
  show_tips                  BOOLEAN DEFAULT true,
  compact_mode               BOOLEAN DEFAULT false
);
```

**Key design decisions:**
- `hole_info`, `settings`, `scores`, `ryder_cup`, and `competition_winners` use **JSONB columns** because their structure is complex and queried as a unit, not individually.
- `players.user_id` is **nullable** -- guest players (added by a tour owner) don't need a Firebase account.
- `tours.owner_id` establishes **ownership** -- only the creator can delete a tour; other authenticated users can be given write access later.
- Cascading deletes keep the database consistent when a tour is removed.

---

## API Endpoints

Grouped by resource. All endpoints require `Authorization: Bearer <firebase-jwt>` unless noted.

### Tours

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/tours` | Create a tournament |
| `GET` | `/api/v1/tours` | List user's tournaments (with `?archived=`, `?format=` filters) |
| `GET` | `/api/v1/tours/:tourId` | Get full tournament (with players, teams, rounds) |
| `PUT` | `/api/v1/tours/:tourId` | Update name/description |
| `PATCH` | `/api/v1/tours/:tourId/format` | Change tournament format |
| `PATCH` | `/api/v1/tours/:tourId/archive` | Archive/unarchive |
| `DELETE` | `/api/v1/tours/:tourId` | Delete tournament (owner only) |

### Players

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/tours/:tourId/players` | Add player |
| `GET` | `/api/v1/tours/:tourId/players` | List players (with `?teamId=` filter) |
| `PUT` | `/api/v1/tours/:tourId/players/:playerId` | Update player |
| `DELETE` | `/api/v1/tours/:tourId/players/:playerId` | Remove player |

### Teams

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/tours/:tourId/teams` | Create team |
| `PUT` | `/api/v1/tours/:tourId/teams/:teamId` | Update team |
| `DELETE` | `/api/v1/tours/:tourId/teams/:teamId` | Delete team |
| `POST` | `/api/v1/tours/:tourId/teams/:teamId/players/:playerId` | Assign player to team |
| `DELETE` | `/api/v1/tours/:tourId/teams/:teamId/players/:playerId` | Remove player from team |
| `PATCH` | `/api/v1/tours/:tourId/teams/:teamId/captain` | Set captain |
| `PATCH` | `/api/v1/tours/:tourId/teams/:teamId/players/order` | Reorder players |

### Rounds

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/tours/:tourId/rounds` | Create round |
| `GET` | `/api/v1/tours/:tourId/rounds/:roundId` | Get round |
| `PUT` | `/api/v1/tours/:tourId/rounds/:roundId` | Update round |
| `DELETE` | `/api/v1/tours/:tourId/rounds/:roundId` | Delete round |
| `POST` | `/api/v1/tours/:tourId/rounds/:roundId/start` | Start round |
| `POST` | `/api/v1/tours/:tourId/rounds/:roundId/complete` | Complete round |

### Scoring

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/tours/:tourId/rounds/:roundId/scores/:playerId` | Update player score |
| `POST` | `/api/v1/tours/:tourId/rounds/:roundId/team-scores/:teamId` | Update team score |
| `POST` | `/api/v1/tours/:tourId/rounds/:roundId/competition-winners` | Record closest-to-pin / longest-drive |

### Leaderboards (computed, not stored)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/tours/:tourId/leaderboard` | Tournament leaderboard (`?type=individual\|team\|stableford`) |
| `GET` | `/api/v1/tours/:tourId/rounds/:roundId/leaderboard` | Round leaderboard |
| `GET` | `/api/v1/tours/:tourId/leaderboard/teams` | Team leaderboard |

### Match Play & Ryder Cup

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/tours/:tourId/rounds/:roundId/matches` | Create match |
| `PUT` | `/api/v1/tours/:tourId/rounds/:roundId/matches/:matchId/holes/:holeNumber` | Update hole result |
| `POST` | `/api/v1/tours/:tourId/rounds/:roundId/ryder-cup-sessions` | Create Ryder Cup session |
| `GET` | `/api/v1/tours/:tourId/rounds/:roundId/ryder-cup` | Get Ryder Cup status |

### Statistics

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/tours/:tourId/rounds/:roundId/players/:playerId/stats` | Player round stats |
| `GET` | `/api/v1/tours/:tourId/stats` | Tournament stats |

### User & Settings

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/users/me` | Get current user profile |
| `PUT` | `/api/v1/users/me` | Update profile |
| `GET` | `/api/v1/settings` | Get settings |
| `PUT` | `/api/v1/settings` | Update settings |

**Total: ~30 endpoints** across 8 resource groups.

---

## Authentication Flow

```
Client                          Server                         Firebase
  │                               │                               │
  │──── signInWithGoogle() ──────>│                               │
  │                               │                               │
  │<──── Firebase JWT ────────────│                               │
  │                               │                               │
  │──── GET /api/v1/tours ───────>│                               │
  │     Authorization: Bearer JWT │                               │
  │                               │──── verifyIdToken(JWT) ──────>│
  │                               │<──── { uid, email, ... } ─────│
  │                               │                               │
  │                               │  (look up user in DB by uid)  │
  │                               │  (auto-create if first login) │
  │                               │                               │
  │<──── 200 OK { tours: [...] } ─│                               │
```

The server middleware:
1. Extracts the `Authorization: Bearer <token>` header
2. Calls `admin.auth().verifyIdToken(token)` using the Firebase Admin SDK
3. Attaches the decoded user (`uid`, `email`) to the request context
4. If no user row exists in the `users` table, creates one automatically (first-login provisioning)

---

## Migration Strategy: localStorage to Backend

The migration needs to be **incremental** -- don't rewrite the whole frontend at once.

### Phase 1: Backend foundation
- Set up the `server/` workspace, database schema, and auth middleware.
- Implement the Tours CRUD endpoints first (simplest resource).
- Create an API client module (`src/lib/api.ts`) in the frontend that wraps `fetch` with auth headers.

### Phase 2: Swap the storage layer
- The frontend hooks (`useTours`, `useCreateTour`, etc.) already use React Query mutations that call `storage.getTours()`, `storage.saveTour()`, etc.
- Replace the `queryFn` and `mutationFn` in each hook to call the API client instead of `storage.*`.
- Example change in `useTours.ts`:

```typescript
// Before
export const useTours = () => {
  return useQuery({
    queryKey: ["tours"],
    queryFn: storage.getTours,
  });
};

// After
export const useTours = () => {
  return useQuery({
    queryKey: ["tours"],
    queryFn: () => api.get<Tour[]>("/tours"),
  });
};
```

This is a **small, hook-by-hook migration**. Each hook can be switched independently. The UI components don't change at all because they only consume the hooks.

### Phase 3: Move scoring logic server-side
- Leaderboard calculations (`calculateIndividualRoundLeaderboard`, etc.) move to the server.
- The client fetches computed leaderboards via `GET /tours/:tourId/leaderboard` instead of calculating locally.
- This ensures all users see the same leaderboard regardless of client version.

### Phase 4: Real-time (future)
- Add WebSocket or Supabase Realtime subscriptions for live score updates.
- React Query's `refetchInterval` is a simpler stopgap that works without WebSockets.

---

## Authorization Model

| Action | Rule |
|---|---|
| Create tour | Any authenticated user |
| View tour | Owner, or anyone with the shareable URL |
| Edit tour details | Owner only |
| Delete tour | Owner only |
| Add/remove players | Owner only |
| Score a round | Owner, or any player linked to a Firebase account in the tour |
| View leaderboard | Anyone with the shareable URL (no auth required) |

This keeps the public shareable URL working for spectators while protecting write operations.

---

## Project Initialization Steps

1. **Init workspace structure** -- add `"workspaces"` to root `package.json`, create `server/` and `shared/` directories.
2. **Set up server** -- `npm init` in `server/`, install Hono, Drizzle, Firebase Admin, pg driver.
3. **Define Drizzle schema** -- translate the SQL above into `server/src/db/schema.ts`.
4. **Run first migration** -- `drizzle-kit generate` + `drizzle-kit migrate` against a Neon/Supabase Postgres instance.
5. **Implement auth middleware** -- verify Firebase JWTs, auto-provision users.
6. **Build Tours CRUD** -- first complete resource, end-to-end.
7. **Create `src/lib/api.ts`** on the frontend -- a thin fetch wrapper that attaches the Firebase token.
8. **Swap `useTours` hook** -- first hook to move from localStorage to API.
9. **Repeat** for Players, Teams, Rounds, Scoring, Match Play.
10. **Move leaderboard calculations** server-side last (most complex logic).

---

## Hosting & Database Cost Estimates

| Service | Free Tier | Notes |
|---|---|---|
| **Neon Postgres** | 0.5 GB storage, autoscaling | Generous free tier, serverless-friendly |
| **Supabase** | 500 MB DB, 50k monthly active users | Also provides Realtime if needed later |
| **Vercel** | Serverless functions, 100 GB bandwidth | You're already deployed here |
| **Railway** | $5/month after trial | Better for long-running server + WebSockets |

For v1, **Neon + Vercel serverless** is the simplest and cheapest path. Migrate to Railway only if you need WebSockets for real-time scoring.
