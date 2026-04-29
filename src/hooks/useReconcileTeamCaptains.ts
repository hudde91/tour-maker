import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateTeam } from "../lib/firestore";
import type { Tour } from "../types";

/**
 * One-shot consistency fix: if any team has `captainId` but the captainId
 * isn't in `playerIds`, push it. Caused by an earlier `addTeam` bug that set
 * the captain's `teamId` but forgot to add them to the team's `playerIds`,
 * leaving the captain invisible in TeamCard.
 *
 * Owner-only — Firestore rules require ownership to update team data.
 * Idempotent: if no inconsistency, no write.
 */
export function useReconcileTeamCaptains(tour: Tour | null | undefined) {
  const { user } = useAuth();
  const inFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !tour) return;
    if (tour.ownerId !== user.uid) return;
    if (inFlightRef.current === tour.id) return;

    const broken = (tour.teams ?? []).filter(
      (t) => t.captainId && !t.playerIds.includes(t.captainId)
    );
    if (broken.length === 0) return;

    inFlightRef.current = tour.id;
    (async () => {
      try {
        for (const team of broken) {
          await updateTeam(tour.id, {
            ...team,
            playerIds: [...team.playerIds, team.captainId],
          });
        }
      } catch (err) {
        console.error("Failed to reconcile team captains:", err);
      } finally {
        inFlightRef.current = null;
      }
    })();
  }, [user, tour]);
}
