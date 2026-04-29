import { useAuth } from "../contexts/AuthContext";
import type { Tour } from "../types";

/**
 * Resolve the current user's role in a tour.
 *
 * Firestore rules let only the owner mutate the tour document (name, format,
 * players, teams, rounds, scoringConfig). Participants can only update round
 * scores and self-join. The UI uses these flags to hide owner-only actions
 * from participants so they don't get permission-denied errors.
 */
export function useTourRole(tour: Tour | null | undefined) {
  const { user } = useAuth();
  const isOwner = !!user && !!tour && tour.ownerId === user.uid;
  const isParticipant =
    !!user && !!tour && tour.participantIds.includes(user.uid);
  return { isOwner, isParticipant, userId: user?.uid ?? null };
}
