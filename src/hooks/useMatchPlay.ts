import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export const useCreateRyderCupSession = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: {
      sessionType:
        | "day1-foursomes"
        | "day1-four-ball"
        | "day2-foursomes"
        | "day2-four-ball"
        | "day3-singles"
        | "foursomes"
        | "four-ball"
        | "singles";
      pairings: { teamAPlayerIds: string[]; teamBPlayerIds: string[] }[];
    }) => {
      return api.post(
        `/tours/${tourId}/rounds/${roundId}/ryder-cup-sessions`,
        sessionData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateMatchHole = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      matchId: string;
      holeNumber: number;
      teamAScore: number;
      teamBScore: number;
    }) => {
      return api.put(
        `/tours/${tourId}/rounds/${roundId}/matches/${data.matchId}/holes/${data.holeNumber}`,
        {
          teamAScore: data.teamAScore,
          teamBScore: data.teamBScore,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};
