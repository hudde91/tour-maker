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

      settings: RoundSettings;
    }) => {
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

        settings: roundData.settings,
        createdAt: new Date().toISOString(),
        scores: {},
        status: "created",
      };

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
