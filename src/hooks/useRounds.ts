import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Round, HoleInfo, PlayFormat, RoundSettings } from "../types";
import {
  createRound,
  updateRound,
  deleteRound,
  updateRoundCourseDetails,
  updateRoundStartTime,
} from "../lib/firestore";
import { nanoid } from "nanoid";

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

      const round: Round = {
        id: nanoid(),
        name: roundData.name,
        courseName: roundData.courseName,
        format: roundData.format,
        holes: roundData.holes,
        holeInfo: roundData.holeInfo,
        totalPar: roundData.totalPar,
        teeBoxes: roundData.teeBoxes,
        slopeRating: roundData.slopeRating,
        totalYardage: roundData.totalYardage,
        startTime: roundData.startTime,
        playerIds: roundData.playerIds,
        settings: roundData.settings,
        createdAt: new Date().toISOString(),
        scores: {},
        status: "created",
      };

      await createRound(tourId, round);
      return round;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};

export const useUpdateRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (round: Round) => {
      await updateRound(tourId, round);
      return round;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};

export const useDeleteRound = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roundId: string) => {
      await deleteRound(tourId, roundId);
      return roundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
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
      await updateRoundCourseDetails(tourId, data.roundId, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};

export const useUpdateRoundStartTime = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { roundId: string; startTime: string }) => {
      await updateRoundStartTime(tourId, data.roundId, data.startTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};
