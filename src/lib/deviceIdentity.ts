import { nanoid } from 'nanoid';

const DEVICE_ID_KEY = 'tour-maker-device-id';

/**
 * Gets or creates a unique device identifier for this browser.
 * This ID is used to track which players have been claimed by this device.
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = nanoid();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Generates a 6-digit player code for claiming
 */
export function generatePlayerCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Checks if the current device has claimed a specific player
 */
export function isPlayerClaimedByCurrentDevice(player: { claimedBy?: string }): boolean {
  if (!player.claimedBy) return false;
  return player.claimedBy === getDeviceId();
}

/**
 * Checks if a player is unclaimed
 */
export function isPlayerUnclaimed(player: { claimedBy?: string }): boolean {
  return !player.claimedBy;
}

/**
 * Checks if the current device can score for a player
 * In individual format: only for claimed player or unclaimed players
 * In team formats: for anyone on the same team as claimed player
 */
export function canScoreForPlayer(
  player: { claimedBy?: string; teamId?: string },
  allPlayers?: Array<{ id: string; claimedBy?: string; teamId?: string }>,
  isTeamFormat: boolean = false
): boolean {
  // If unclaimed, anyone can score (for backward compatibility with organizers)
  if (isPlayerUnclaimed(player)) {
    return true;
  }

  // If claimed by current device, can always score
  if (isPlayerClaimedByCurrentDevice(player)) {
    return true;
  }

  // In team formats, check if player is on same team as claimed player
  if (isTeamFormat && allPlayers && player.teamId) {
    const myClaimedPlayer = getClaimedPlayer(allPlayers);

    // If I've claimed a player and this player is on my team, I can score for them
    if (myClaimedPlayer && myClaimedPlayer.teamId === player.teamId) {
      return true;
    }
  }

  return false;
}

/**
 * Gets the player claimed by the current device from a list of players
 * Returns null if no player is claimed
 */
export function getClaimedPlayer<T extends { claimedBy?: string }>(players: T[]): T | null {
  const deviceId = getDeviceId();
  return players.find((p) => p.claimedBy === deviceId) || null;
}
