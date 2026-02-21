import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Team } from "../types";
import {
  addTeam,
  updateTeam,
  removeTeam,
  assignPlayerToTeam,
  setTeamCaptain,
} from "../lib/firestore";
import { nanoid } from "nanoid";

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
        name: teamData.name,
        color: teamData.color,
        playerIds: [],
        captainId: teamData.captainId || "",
      };
      await addTeam(tourId, team);
      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};

export const useUpdateTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: Team) => {
      await updateTeam(tourId, team);
      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};

export const useDeleteTeam = (tourId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      await removeTeam(tourId, teamId);
      return teamId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
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
      await assignPlayerToTeam(tourId, playerId, teamId);
      return { playerId, teamId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
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
      await setTeamCaptain(tourId, teamId, captainId);
      return { teamId, captainId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    },
  });
};
