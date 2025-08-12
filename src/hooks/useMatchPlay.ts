import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storage } from "../lib/storage";
import { MatchPlayRound } from "../types";

export const useCreateMatch = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchData: {
      format: "singles" | "foursomes" | "four-ball";
      teamA: { id: string; playerIds: string[] };
      teamB: { id: string; playerIds: string[] };
    }) => {
      const match = storage.createMatchPlayRound(tourId, roundId, matchData);
      return match;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateMatchHole = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      holeNumber,
      teamAScore,
      teamBScore,
    }: {
      matchId: string;
      holeNumber: number;
      teamAScore: number;
      teamBScore: number;
    }) => {
      storage.updateMatchPlayHole(
        tourId,
        roundId,
        matchId,
        holeNumber,
        teamAScore,
        teamBScore
      );
      return { matchId, holeNumber, teamAScore, teamBScore };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useMatchPlayLeaderboard = (tourId: string, roundId?: string) => {
  const tour = storage.getTour(tourId);
  if (!tour) return { teamA: 0, teamB: 0, matches: [] };

  return storage.getMatchPlayLeaderboard(tourId, roundId);
};

// Hook to create all matches for a Ryder Cup session
export const useCreateRyderCupSession = (tourId: string, roundId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: {
      sessionType: "foursomes" | "four-ball" | "singles";
      pairings: Array<{
        teamAPlayerIds: string[];
        teamBPlayerIds: string[];
      }>;
    }) => {
      const tour = storage.getTour(tourId);
      if (!tour || tour.teams?.length !== 2) {
        throw new Error("Need exactly 2 teams for Ryder Cup");
      }

      const teamA = tour.teams[0];
      const teamB = tour.teams[1];
      const matches: MatchPlayRound[] = [];

      // Create matches for each pairing
      sessionData.pairings.forEach((pairing, index) => {
        const match = storage.createMatchPlayRound(tourId, roundId, {
          format: sessionData.sessionType,
          teamA: { id: teamA.id, playerIds: pairing.teamAPlayerIds },
          teamB: { id: teamB.id, playerIds: pairing.teamBPlayerIds },
        });
        matches.push(match);
      });

      return matches;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};
