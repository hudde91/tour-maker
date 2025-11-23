import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { storage } from "../lib/storage";
import { Player } from "../types";
import { invalidateTourCache } from "../lib/cache";
import { generatePlayerCode } from "../lib/deviceIdentity";

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
        playerCode: generatePlayerCode(), // Generate unique 6-digit code
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

export const useClaimPlayer = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      deviceId,
    }: {
      playerId: string;
      deviceId: string;
    }) => {
      storage.claimPlayer(tourId, playerId, deviceId);
      return playerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useClaimPlayerByCode = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerCode,
      deviceId,
    }: {
      playerCode: string;
      deviceId: string;
    }) => {
      const player = storage.claimPlayerByCode(tourId, playerCode, deviceId);
      if (!player) {
        throw new Error("Invalid player code");
      }
      return player;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useUnclaimPlayer = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerId: string) => {
      storage.unclaimPlayer(tourId, playerId);
      return playerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};
