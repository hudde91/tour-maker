import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { invalidateTourCache } from "../lib/cache";

export const useUpdateScore = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      scores,
    }: {
      playerId: string;
      scores: (number | null)[];
    }) => {
      await api.post(`/tours/${tourId}/rounds/${roundId}/scores/${playerId}`, { scores });
      return { playerId, scores };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useUpdateTeamScore = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      scores,
    }: {
      teamId: string;
      scores: number[];
    }) => {
      await api.post(`/tours/${tourId}/rounds/${roundId}/team-scores/${teamId}`, { scores });
      return { teamId, scores };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useStartRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundId: string) => {
      await api.post(`/tours/${tourId}/rounds/${roundId}/start`);
      return roundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useCompleteRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundId: string) => {
      await api.post(`/tours/${tourId}/rounds/${roundId}/complete`);
      return roundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useUpdateCompetitionWinner = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      holeNumber,
      competitionType,
      winnerId,
      distance,
      matchId,
    }: {
      holeNumber: number;
      competitionType: 'closestToPin' | 'longestDrive';
      winnerId: string | null;
      distance?: number;
      matchId?: string;
    }) => {
      await api.post(`/tours/${tourId}/rounds/${roundId}/competition-winners`, {
        holeNumber,
        type: competitionType,
        winnerId,
        distance,
        matchId,
      });
      return { holeNumber, competitionType, winnerId, distance, matchId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};
