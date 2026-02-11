import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Round, HoleInfo, PlayFormat, RoundSettings } from "../types";

export const useCreateRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundData: {
      name: string;
      courseName: string;
      format: PlayFormat;
      holes: number;
      holeInfo: HoleInfo[];
      totalPar?: number;
      teeBoxes?: string;
      slopeRating?: string;
      totalYardage?: string;
      startTime?: string;
      playerIds?: string[];
      settings: RoundSettings;
    }) => {
      if (roundData.playerIds && (roundData.playerIds.length < 1 || roundData.playerIds.length > 4)) {
        throw new Error("A round must have between 1 and 4 players");
      }

      return api.post<Round>(`/tours/${tourId}/rounds`, roundData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (round: Round) => {
      return api.put<Round>(`/tours/${tourId}/rounds/${round.id}`, round);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useDeleteRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundId: string) => {
      await api.delete(`/tours/${tourId}/rounds/${roundId}`);
      return roundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateRoundCourseDetails = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      roundId: string;
      updates: {
        name?: string;
        courseName?: string;
        teeBoxes?: string;
        slopeRating?: string;
        totalYardage?: string;
      };
    }) => {
      return api.patch<Round>(
        `/tours/${tourId}/rounds/${data.roundId}/course`,
        data.updates
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateRoundStartTime = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { roundId: string; startTime: string }) => {
      return api.patch<Round>(
        `/tours/${tourId}/rounds/${data.roundId}/start-time`,
        { startTime: data.startTime }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};
