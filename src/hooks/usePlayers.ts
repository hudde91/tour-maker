import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { storage } from "../lib/storage";
import { Player } from "../types";
import { invalidateTourCache } from "../lib/cache";

export const useAddPlayer = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerData: {
      name: string;
      handicap?: number;
      teamId?: string;
    }) => {
      const player: Player = {
        id: nanoid(),
        name: playerData.name.trim(),
        handicap: playerData.handicap,
        teamId: playerData.teamId,
      };

      storage.addPlayerToTour(tourId, player);

      // If a team was selected, assign the player to the team
      // This updates the team's playerIds array
      if (playerData.teamId) {
        storage.assignPlayerToTeam(tourId, player.id, playerData.teamId);
      }

      return player;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId); // Invalidate calculation cache
    },
  });
};

export const useRemovePlayer = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerId: string) => {
      storage.removePlayerFromTour(tourId, playerId);
      return playerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId); // Invalidate calculation cache
    },
  });
};

export const useUpdatePlayer = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (player: Player) => {
      storage.updatePlayerInTour(tourId, player);
      return player;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId); // Invalidate calculation cache
    },
  });
};
