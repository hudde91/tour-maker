import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
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
      return api.post<Player>(`/tours/${tourId}/players`, playerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useRemovePlayer = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerId: string) => {
      await api.delete(`/tours/${tourId}/players/${playerId}`);
      return playerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useUpdatePlayer = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (player: Player) => {
      return api.put<Player>(`/tours/${tourId}/players/${player.id}`, {
        name: player.name,
        handicap: player.handicap,
        teamId: player.teamId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};
