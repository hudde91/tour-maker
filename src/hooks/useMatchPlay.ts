import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storage } from "../lib/storage";

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
      const createdMatches = storage.addRyderCupSession(
        tourId,
        roundId,
        sessionData as any
      );
      return createdMatches;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

/**
 * Uppdatera ett hål i en match-play match (Ryder Cup).
 */
export const useUpdateMatchHole = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      matchId: string;
      holeNumber: number; // 1-based
      teamAScore: number;
      teamBScore: number;
    }) => {
      if (!storage.updateMatchHole) {
        throw new Error(
          "storage.updateMatchHole saknas. Lägg in storage-patchen."
        );
      }
      storage.updateMatchHole(tourId, roundId, data);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};
