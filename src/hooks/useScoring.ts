import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updatePlayerScore,
  updateTeamScore,
  startRound,
  completeRound,
  updateCompetitionWinner,
} from "../lib/firestore";
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
      await updatePlayerScore(tourId, roundId, playerId, scores);
      return { playerId, scores };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
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
      await updateTeamScore(tourId, roundId, teamId, scores);
      return { teamId, scores };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useStartRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundId: string) => {
      await startRound(tourId, roundId);
      return roundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};

export const useCompleteRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundId: string) => {
      await completeRound(tourId, roundId);
      return roundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
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
      competitionType: "closestToPin" | "longestDrive";
      winnerId: string | null;
      distance?: number;
      matchId?: string;
    }) => {
      await updateCompetitionWinner(tourId, roundId, holeNumber, competitionType, winnerId, distance, matchId);
      return { holeNumber, competitionType, winnerId, distance, matchId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      invalidateTourCache(tourId);
    },
  });
};
