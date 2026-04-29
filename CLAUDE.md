# tour-maker

Golf-tournament management web app. Hosted as a Firebase web app at `tour-maker-ac932.web.app`. **99% of users open it as an installed PWA on their phone — treat mobile as the primary surface.**

## Stack

- **React 18** + **TypeScript** + **Vite** (dev port `1420`, set in `vite.config.ts`).
- **Firebase**: Auth (Google sign-in only), Firestore (rules in [firestore.rules](firestore.rules)), Hosting. No Cloud Functions.
- **TanStack Query** (`@tanstack/react-query`) for all server state. `useTour` (in [src/hooks/useTours.ts](src/hooks/useTours.ts)) wires `onSnapshot` into the query cache for real-time updates.
- **Tailwind** for styling — utility classes plus a small set of project-defined classes in [src/index.css](src/index.css): `card`, `card-elevated`, `card-spacing`, `input-field`, `form-group`, `form-label`, `form-help`, `section-header`, `btn-primary`, `btn-secondary`, `status-active`, `status-completed`, `safe-area-top`, `safe-area-bottom`. Reuse these — don't invent new visual primitives.
- **react-router-dom v6** for routing ([src/App.tsx](src/App.tsx)).
- **PWA**: `vite-plugin-pwa` (workbox). Manifest + service worker generated at build.
- **lucide-react** icons. `nanoid` for client-side IDs. `react-swipeable` for hole-by-hole gestures.
- **Tauri** (`src-tauri/`) is wired in but the production deployment target is the web/PWA. Don't optimize for Tauri unless asked.

## Workspace layout

- [shared/src/](shared/src/) — types and constants reused across the app (`Tour`, `Player`, `Team`, `Round`, `ScoringConfig`, golf-format definitions, defaults). Imported as `@tour-maker/shared`.
- [src/types/core.ts](src/types/core.ts) re-exports those types as the app's public type surface — import from `../types`, not from `@tour-maker/shared`, in app code.
- [src/lib/firestore.ts](src/lib/firestore.ts) — every Firestore read/write goes through this module. Most multi-field writes use `runTransaction` to keep `participantIds`, `players`, `teams`, and round scores consistent.
- [src/hooks/](src/hooks/) — React Query hooks per concern (`useTours`, `usePlayers`, `useRounds`, `useTeams`, `useScoring`, `useUserProfile`, `useFriends`, `useSavedCourses`, `useUserSearch`, `useGolfCourseSearch`, `useTourRole`).
- [src/lib/storage/](src/lib/storage/) — legacy localStorage helpers + scoring math. Pure functions; the scoring helpers are imported from server-side code paths too. Don't add new persistence here — write to Firestore.
- [src/pages/](src/pages/) — top-level routes. Each page is responsible for its own loading/empty/error states.
- [src/components/](src/components/) — grouped by feature area (`players/`, `teams/`, `rounds/`, `rydercup/`, `matchplay/`, `formats/`, `scoring/`, `tournament/`, `ui/`, `common/`, `pwa/`, `auth/`, `mock/`).
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) — single source of truth for the signed-in user; wraps Firebase Auth.

## Data model (Firestore)

- `tours/{tourId}` — top-level tour doc. Holds `ownerId`, `participantIds: string[]`, `players: Player[]` (embedded array, not a subcollection), `teams: Team[]`, `format`, `scoringConfig`, etc. The tour doc is the unit most rules are written against.
- `tours/{tourId}/rounds/{roundId}` — subcollection. Round-level state including `scores: Record<playerId, PlayerScore>`, `holeInfo`, optional `ryderCup` match data.
- `users/{userId}` — user profile (`playerName`, `handicap`, `settings`, `friends[]`).
- `savedCourses/{courseId}` — courses any signed-in user can read/save.

## Two roles per tour: owner and participant

Every authenticated user looking at a tour is either the **owner** (`tour.ownerId === user.uid`) or a **participant** (`user.uid in tour.participantIds`, but not the owner). This distinction matters because:

- **Firestore rules** only let the owner update the tour doc itself (name, format, players, teams, scoringConfig, archive, delete). Participants can update **rounds** (for scoring) and can self-join.
- **The UI must hide owner-only mutation buttons from participants** — otherwise clicks fail with permission-denied and the user sees no feedback.
- Use `useTourRole(tour)` from [src/hooks/useTourRole.ts](src/hooks/useTourRole.ts) to get `{ isOwner, isParticipant }`. Wrap any Add/Edit/Delete/Archive/Start/Create button in `{isOwner && ...}` (or fall back to a friendly empty state with no action).

## The join flow

Tour creators share `/tour/:id/join`. The join page ([src/pages/TourJoinPage.tsx](src/pages/TourJoinPage.tsx)) handles four states:

1. **Signed out** → "Sign in with Google" CTA.
2. **Signed in, profile + handicap exist** → auto-joins via `joinTour` (in [src/lib/firestore.ts](src/lib/firestore.ts)) and redirects to `/tour/:id/players`.
3. **Signed in, profile missing** → name + handicap form, saves profile, then joins.
4. **Signed in, profile has no handicap** → handicap-only form, then joins.

Old `/tour/:id` links still work because [TourLayout](src/components/ui/TourLayout.tsx) and [TourGate](src/components/ui/TourGate.tsx) redirect non-participants to `/tour/:id/join`. **Always use `/tour/:id/join` for new share links** — copy via the "Share Tournament" button on `TourSettingsPage`.

The Firestore rule for self-join (in [firestore.rules](firestore.rules)) restricts non-owners to updating only `participantIds` and `players`, and only adds the caller's own uid.

## Mobile/PWA expectations

- **Default to vertical, stacked layouts.** Only widen on `sm:` (640px) or `md:` (768px) breakpoints.
- **Tap targets ≥44px.** `btn-primary`/`btn-secondary` already meet this; don't override their padding to make them smaller.
- **Watch for `BottomNav` collisions.** Pages wrapped in `TourLayout` reserve `pb-20` for the nav. Modals/sheets use `safe-area-bottom`. Use `pb-24` if you add a sticky bottom action.
- **Test at 375×812 (iPhone SE-class)** before declaring a UI change done. Use the Claude Preview MCP tools for screenshots — the dev server runs on port `1420`.
- **Reuse `PageHeader`, `EmptyState`, `BottomNav`, `ConfirmDialog`** rather than rolling new ones. They handle safe-area and breadcrumbs correctly.

## Scripts

- `npm run dev` — Vite dev server (port 1420).
- `npm run typecheck` — `tsc --noEmit`. The repo currently has ~27 pre-existing unused-import / unused-var errors; new code should not add to that count.
- `npm test -- --run` — Vitest (225 tests). E2E via Playwright: `npm run test:e2e`.
- `npm run build` — production bundle (also runs as part of `npm run deploy`).
- `npm run deploy` — `vite build && firebase deploy --only hosting`. **Deploy `firestore:rules` separately** (`firebase deploy --only firestore:rules`) when changing `firestore.rules` — the `deploy` script does not include rules. Push rules **before** hosting if a code change relies on a relaxed rule, or rules **after** hosting if rules are tightening.

## Conventions and gotchas

- **All mutations go through React Query hooks**, not raw Firestore calls in components. The hooks invalidate `["tours"]` / `["tour", tourId]` and call `invalidateTourCache(tourId)` from [src/lib/cache.ts](src/lib/cache.ts).
- **`stripUndefined`** in [src/lib/firestore.ts](src/lib/firestore.ts) — Firestore rejects `undefined` field values. Pass any partial-shape object through this before writing.
- **Owner is in `participantIds` but NOT in `players` by default.** `createTour` initializes `players: []`; the owner has to manually add themselves as a player to appear on scorecards. ProfilePage stats use `tour.players.find(p => p.userId === user.uid)`, so an owner who never adds themselves shows zero stats. (Open question whether to auto-add — see backlog.)
- **Real-time updates** flow through `subscribeTour` in [src/lib/firestore.ts](src/lib/firestore.ts), which `useTour` wires into the React Query cache. Mutations don't need optimistic updates — the snapshot listener pushes the new state.
- **Tour data is hydrated in `assembleTour` / `assembleTourSync`** ([src/lib/firestore.ts](src/lib/firestore.ts)) — these are the only places that turn raw Firestore docs into the `Tour` type. If you add a top-level field to the tour doc, update both.
- **Don't read from localStorage for new features.** [src/lib/storage/](src/lib/storage/) is legacy; the source of truth is Firestore.
