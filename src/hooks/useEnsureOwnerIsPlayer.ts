import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ensureOwnerIsPlayer, getUserProfile } from "../lib/firestore";
import type { Tour } from "../types";

/**
 * Backfill: when the owner views a tour they're not yet a Player in, add them.
 * Tours created before owner-as-player auto-add (or via paths that didn't go
 * through `useCreateTour`) are missing the owner from `tour.players`, which
 * breaks scoring and stats lookups.
 *
 * Idempotent on the server (`ensureOwnerIsPlayer` checks before writing) and
 * guarded here against firing more than once per tour while a write is
 * in-flight. The realtime listener will then push the updated `players` array.
 */
export function useEnsureOwnerIsPlayer(tour: Tour | null | undefined) {
  const { user } = useAuth();
  const inFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !tour) return;
    if (tour.ownerId !== user.uid) return;
    if (tour.players.some((p) => p.userId === user.uid)) return;
    if (inFlightRef.current === tour.id) return;

    inFlightRef.current = tour.id;
    (async () => {
      try {
        const profile = await getUserProfile(user.uid);
        await ensureOwnerIsPlayer(tour.id, {
          userId: user.uid,
          playerName:
            profile?.playerName || user.displayName || "Owner",
          handicap: profile?.handicap,
        });
      } catch (err) {
        console.error("Failed to backfill owner as player:", err);
      } finally {
        inFlightRef.current = null;
      }
    })();
  }, [user, tour]);
}
