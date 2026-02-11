import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Team } from "../types";

export const useCreateTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamData: {
      name: string;
      color: string;
      captainId?: string;
    }) => {
      return api.post<Team>(`/tours/${tourId}/teams`, teamData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: Team) => {
      return api.put<Team>(`/tours/${tourId}/teams/${team.id}`, {
        name: team.name,
        color: team.color,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useDeleteTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      await api.delete(`/tours/${tourId}/teams/${teamId}`);
      return teamId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useAssignPlayerToTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      teamId,
    }: {
      playerId: string;
      teamId: string | null;
    }) => {
      if (teamId) {
        await api.post(`/tours/${tourId}/teams/${teamId}/players/${playerId}`);
      } else {
        await api.put(`/tours/${tourId}/players/${playerId}`, { teamId: null });
      }
      return { playerId, teamId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useSetTeamCaptain = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      captainId,
    }: {
      teamId: string;
      captainId: string;
    }) => {
      await api.patch(`/tours/${tourId}/teams/${teamId}/captain`, { captainId });
      return { teamId, captainId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};
