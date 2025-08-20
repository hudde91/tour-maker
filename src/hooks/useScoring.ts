import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storage } from "../lib/storage";

export const useUpdateScore = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      scores,
    }: {
      playerId: string;
      scores: number[];
    }) => {
      storage.updatePlayerScore(tourId, roundId, playerId, scores);
      return { playerId, scores };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
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
      storage.updateTeamScore(tourId, roundId, teamId, scores);
      return { teamId, scores };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateTeamTotalScore = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      totalScore,
    }: {
      teamId: string;
      totalScore: number;
    }) => {
      storage.updateTeamTotalScore(tourId, roundId, teamId, totalScore);
      return { teamId, totalScore };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useStartRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundId: string) => {
      storage.startRound(tourId, roundId);
      return roundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useCompleteRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundId: string) => {
      storage.completeRound(tourId, roundId);
      return roundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateTotalScore = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      totalScore,
      stablefordPoints,
    }: {
      playerId: string;
      totalScore: number;
      stablefordPoints?: number;
    }) => {
      storage.updatePlayerTotalScore(
        tourId,
        roundId,
        playerId,
        totalScore,
        stablefordPoints
      );
      return { playerId, totalScore, stablefordPoints };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateTotalScoreWithHandicap = (
  tourId: string,
  roundId: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      totalScore,
      handicapStrokes,
      stablefordPoints,
    }: {
      playerId: string;
      totalScore: number;
      handicapStrokes?: number;
      stablefordPoints?: number;
    }) => {
      storage.updatePlayerTotalScoreWithHandicap(
        tourId,
        roundId,
        playerId,
        totalScore,
        handicapStrokes,
        stablefordPoints
      );
      return { playerId, totalScore, handicapStrokes, stablefordPoints };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};
