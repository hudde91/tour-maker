import { User } from "firebase/auth";
import { Player, Round, Tour } from "@/types";

/**
 * Check if the current user can score in a round.
 * The user must be authenticated AND be a participant of the round
 * (i.e. their auth UID must match a player's userId in the round).
 * If no round/tour is provided, falls back to just checking authentication.
 */
export function canUserScore(
  user: User | null,
  tour?: Tour,
  round?: Round,
): boolean {
  if (!user) return false;
  if (!tour || !round) return true;

  return isUserRoundParticipant(user, tour, round);
}

/**
 * Check if a user is a participant in a specific round.
 * Maps the user's auth UID to a player via Player.userId,
 * then checks if that player is in round.playerIds.
 */
export function isUserRoundParticipant(
  user: User,
  tour: Tour,
  round: Round,
): boolean {
  const userPlayer = tour.players.find((p) => p.userId === user.uid);
  if (!userPlayer) return false;

  // If round has no playerIds set, all tour players can participate (backward compat)
  if (!round.playerIds || round.playerIds.length === 0) return true;

  return round.playerIds.includes(userPlayer.id);
}

/**
 * Get the players the current user can score for in a round.
 * Returns only the round's players, filtered to those the user is allowed to score.
 */
export function getScoreablePlayers(
  user: User | null,
  tour: Tour,
  round: Round,
): Player[] {
  if (!canUserScore(user, tour, round)) return [];

  const roundPlayers = round.playerIds?.length
    ? tour.players.filter((p) => round.playerIds!.includes(p.id))
    : tour.players;

  return roundPlayers;
}

/**
 * Get user email for backend authorization
 */
export function getUserEmail(user: User | null): string | null {
  return user?.email || null;
}
