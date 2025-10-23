import { Team } from "../../types";
import { getTour, saveTour } from "./tours";

/**
 * Team storage operations
 * Handles team management and player assignments
 */

/**
 * Add a team to a tour
 */
export const addTeamToTour = (tourId: string, team: Team): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  if (!tour.teams) tour.teams = [];
  tour.teams.push(team);
  saveTour(tour);
};

/**
 * Update a team in a tour
 */
export const updateTeamInTour = (tourId: string, updatedTeam: Team): void => {
  const tour = getTour(tourId);
  if (!tour || !tour.teams) return;

  const teamIndex = tour.teams.findIndex((t) => t.id === updatedTeam.id);
  if (teamIndex >= 0) {
    tour.teams[teamIndex] = updatedTeam;
  }
  saveTour(tour);
};

/**
 * Remove a team from a tour
 */
export const removeTeamFromTour = (tourId: string, teamId: string): void => {
  const tour = getTour(tourId);
  if (!tour || !tour.teams) return;

  // Remove team
  tour.teams = tour.teams.filter((t) => t.id !== teamId);

  // Remove team assignment from all players
  tour.players.forEach((player) => {
    if (player.teamId === teamId) {
      player.teamId = undefined;
    }
  });

  saveTour(tour);
};

/**
 * Assign a player to a team
 */
export const assignPlayerToTeam = (
  tourId: string,
  playerId: string,
  teamId: string
): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  // Update player's team assignment
  const player = tour.players.find((p) => p.id === playerId);
  if (player) {
    // Remove from old team first
    if (player.teamId && tour.teams) {
      const oldTeam = tour.teams.find((t) => t.id === player.teamId);
      if (oldTeam) {
        oldTeam.playerIds = oldTeam.playerIds.filter(
          (pid) => pid !== playerId
        );
      }
    }

    // Assign to new team
    player.teamId = teamId;
    if (tour.teams) {
      const newTeam = tour.teams.find((t) => t.id === teamId);
      if (newTeam && !newTeam.playerIds.includes(playerId)) {
        newTeam.playerIds.push(playerId);
      }
    }
  }

  saveTour(tour);
};

/**
 * Remove a player from their current team
 */
export const removePlayerFromTeam = (tourId: string, playerId: string): void => {
  const tour = getTour(tourId);
  if (!tour) return;

  const player = tour.players.find((p) => p.id === playerId);
  if (player && player.teamId && tour.teams) {
    const team = tour.teams.find((t) => t.id === player.teamId);
    if (team) {
      team.playerIds = team.playerIds.filter((pid) => pid !== playerId);
      // If this was the captain, clear captain
      if (team.captainId === playerId) {
        team.captainId = "";
      }
    }
    player.teamId = undefined;
  }

  saveTour(tour);
};

/**
 * Set a team captain
 */
export const setTeamCaptain = (tourId: string, teamId: string, captainId: string): void => {
  const tour = getTour(tourId);
  if (!tour || !tour.teams) return;

  const team = tour.teams.find((t) => t.id === teamId);
  if (team) {
    team.captainId = captainId;
    // Make sure captain is on the team
    if (!team.playerIds.includes(captainId)) {
      team.playerIds.push(captainId);
      // Update player's team assignment
      const player = tour.players.find((p) => p.id === captainId);
      if (player) {
        player.teamId = teamId;
      }
    }
  }

  saveTour(tour);
};

/**
 * Reorder players within a team
 */
export const reorderTeamPlayers = (
  tourId: string,
  teamId: string,
  playerIds: string[]
): void => {
  const tour = getTour(tourId);
  if (!tour || !tour.teams) return;

  const team = tour.teams.find((t) => t.id === teamId);
  if (team) {
    // Validate that all playerIds belong to the team
    const validPlayerIds = playerIds.filter((pid) =>
      team.playerIds.includes(pid)
    );
    team.playerIds = validPlayerIds;
  }

  saveTour(tour);
};
