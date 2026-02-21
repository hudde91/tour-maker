import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addRyderCupSession, updateMatchHole, getTour } from "../lib/firestore";
import { nanoid } from "nanoid";

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
      const tour = await getTour(tourId);
      if (!tour) throw new Error("Tour not found");

      const matchIds = sessionData.pairings.map(() => nanoid());
      await addRyderCupSession(tourId, roundId, sessionData, tour.teams || [], matchIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
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
      await updateMatchHole(tourId, roundId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};
