import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Player } from "../types";
import { addPlayer, updatePlayer, removePlayer } from "../lib/firestore";
import { invalidateTourCache } from "../lib/cache";
import { nanoid } from "nanoid";

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
        name: playerData.name,
        handicap: playerData.handicap,
        teamId: playerData.teamId,
      };
      await addPlayer(tourId, player);
      return player;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      invalidateTourCache(tourId);
    },
  });
};

export const useRemovePlayer = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerId: string) => {
      await removePlayer(tourId, playerId);
      return playerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      invalidateTourCache(tourId);
    },
  });
};

export const useUpdatePlayer = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (player: Player) => {
      await updatePlayer(tourId, player);
      return player;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      invalidateTourCache(tourId);
    },
  });
};
