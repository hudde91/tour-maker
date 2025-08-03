import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { storage } from "../lib/storage";
import { Team } from "../types";

export const useCreateTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamData: {
      name: string;
      color: string;
      captainId?: string;
    }) => {
      const team: Team = {
        id: nanoid(),
        name: teamData.name.trim(),
        captainId: teamData.captainId || "",
        playerIds: teamData.captainId ? [teamData.captainId] : [],
        color: teamData.color,
      };

      storage.addTeamToTour(tourId, team);

      // If captain is selected, assign them to the team
      if (teamData.captainId) {
        storage.assignPlayerToTeam(tourId, teamData.captainId, team.id);
      }

      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useUpdateTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: Team) => {
      storage.updateTeamInTour(tourId, team);
      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useDeleteTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      storage.removeTeamFromTour(tourId, teamId);
      return teamId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useAssignPlayerToTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerId,
      teamId,
    }: {
      playerId: string;
      teamId: string | null;
    }) => {
      if (teamId) {
        storage.assignPlayerToTeam(tourId, playerId, teamId);
      } else {
        storage.removePlayerFromTeam(tourId, playerId);
      }
      return { playerId, teamId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};

export const useSetTeamCaptain = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      captainId,
    }: {
      teamId: string;
      captainId: string;
    }) => {
      storage.setTeamCaptain(tourId, teamId, captainId);
      return { teamId, captainId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
    },
  });
};
