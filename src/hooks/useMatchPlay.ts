import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storage } from "../lib/storage";

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
      sessionType:
        | "day1-foursomes"
        | "day1-four-ball"
        | "day2-foursomes"
        | "day2-four-ball"
        | "day3-singles";
      pairings: Array<{
        id: string;
        teamAPlayerIds: string[];
        teamBPlayerIds: string[];
      }>;
    }) => {
      const playersRequired =
        sessionData.sessionType === "day3-singles" ? 1 : 2;

      // Validation: correct count per pairing and no duplicates across the session
      const seen = new Set<string>();
      for (const p of sessionData.pairings) {
        if (
          p.teamAPlayerIds.length !== playersRequired ||
          p.teamBPlayerIds.length !== playersRequired
        ) {
          throw new Error(
            `Each side must have ${playersRequired} player(s) in ${sessionData.sessionType}.`
          );
        }
        for (const pid of [...p.teamAPlayerIds, ...p.teamBPlayerIds]) {
          if (seen.has(pid))
            throw new Error("A player is used more than once in this session.");
          seen.add(pid);
        }
      }

      const tour = storage.getTour(tourId);
      if (!tour) throw new Error("Tour not found");
      const round = tour.rounds.find((r) => r.id === roundId);
      if (!round || !round.ryderCup)
        throw new Error("Ryder Cup round not initialized");

      // Infer team IDs from selected players' teamId (robust; no Round.teams dependency)
      const playerById = new Map(tour.players.map((p) => [p.id, p]));
      const inferTeamId = (playerIds: string[]): string | undefined => {
        for (const pid of playerIds) {
          const tp = playerById.get(pid);
          if (tp?.teamId) return tp.teamId;
        }
        return tour.teams?.[0]?.id; // fallback first team
      };
      const refPair = sessionData.pairings[0];
      const teamAId = inferTeamId(refPair?.teamAPlayerIds || []);
      const teamBId = inferTeamId(refPair?.teamBPlayerIds || []);
      const teamA = tour.teams?.find((t) => t.id === teamAId);
      const teamB = tour.teams?.find((t) => t.id === teamBId);
      if (!teamA || !teamB)
        throw new Error(
          "Could not determine both Ryder Cup teams from selected players."
        );
      const matches = sessionData.pairings.map((pairing) =>
        storage.createMatchPlayRound(tourId, roundId, {
          format:
            sessionData.sessionType === "day3-singles"
              ? "singles"
              : sessionData.sessionType.includes("foursomes")
              ? "foursomes"
              : "four-ball",
          teamA: { id: teamA.id, playerIds: pairing.teamAPlayerIds },
          teamB: { id: teamB.id, playerIds: pairing.teamBPlayerIds },
        })
      );

      storage.addRyderCupSession(
        tourId,
        roundId,
        sessionData.sessionType,
        matches.map((m) => m.id)
      );

      return matches;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};
