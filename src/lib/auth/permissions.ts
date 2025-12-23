import { User } from "firebase/auth";

/**
 * Check if the current user can score for any players
 * For now, any authenticated user can score
 * TODO: Implement proper authorization from backend
 * (check if user email is authorized for specific players/tournaments)
 */
export function canUserScore(user: User | null): boolean {
  return user !== null;
}

/**
 * Get user email for backend authorization
 */
export function getUserEmail(user: User | null): string | null {
  return user?.email || null;
}
