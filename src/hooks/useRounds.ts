import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { storage } from "../lib/storage";
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

      // Course Details
      teeBoxes?: string;
      slopeRating?: string;
      totalYardage?: string;

      // Schedule
      startTime?: string;

      // Players in this round (1-4 max)
      playerIds?: string[];

      settings: RoundSettings;
    }) => {
      // Validate player count (1-4 players per round)
      if (roundData.playerIds && (roundData.playerIds.length < 1 || roundData.playerIds.length > 4)) {
        throw new Error('A round must have between 1 and 4 players');
      }

      const round: Round = {
        id: nanoid(),
        name: roundData.name.trim(),
        courseName: roundData.courseName.trim(),
        format: roundData.format,
        holes: roundData.holes,
        holeInfo: roundData.holeInfo,
        totalPar: roundData.totalPar,

        // Course Details
        teeBoxes: roundData.teeBoxes,
        slopeRating: roundData.slopeRating,
        totalYardage: roundData.totalYardage,

        // Schedule
        startTime: roundData.startTime,

        // Players in this round (1-4 max)
        playerIds: roundData.playerIds,

        settings: roundData.settings,
        createdAt: new Date().toISOString(),
        scores: {},
        competitionWinners: {
          closestToPin: {},
          longestDrive: {},
        },
        status: "created",
      };
      // Initialize Ryder Cup container when tour is in Ryder Cup mode
      try {
        const tourCtx = storage.getTour(tourId);
        if (tourCtx?.format === "ryder-cup") {
          round.ryderCup = {
            teamAPoints: 0,
            teamBPoints: 0,
            targetPoints: 0,
            matches: [],
            sessions: {
              day1Foursomes: [],
              day1FourBall: [],
              day2Foursomes: [],
              day2FourBall: [],
              day3Singles: [],
            },
          };
          round.isMatchPlay = true;
        }
      } catch {}

      storage.saveRound(tourId, round);
      return round;
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
      storage.saveRound(tourId, round);
      return round;
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
      storage.deleteRound(tourId, roundId);
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
      const round = storage.updateRoundCourseDetails(
        tourId,
        data.roundId,
        data.updates
      );
      return round;
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
      const round = storage.updateRoundStartTime(
        tourId,
        data.roundId,
        data.startTime
      );
      return round;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};
