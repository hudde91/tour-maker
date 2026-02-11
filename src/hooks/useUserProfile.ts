import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { UserProfile } from "../types/core";

export const useUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;
      try {
        const user = await api.get<{
          userId: string;
          playerName: string;
          handicap?: number;
          createdAt: string;
          updatedAt: string;
        }>("/users/me");
        return {
          userId: user.userId,
          playerId: user.userId,
          playerName: user.playerName,
          handicap: user.handicap,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      } catch {
        return null;
      }
    },
    enabled: !!userId,
  });
};

export const useHasUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ["hasUserProfile", userId],
    queryFn: async () => {
      if (!userId) return false;
      try {
        await api.get("/users/me");
        return true;
      } catch {
        return false;
      }
    },
    enabled: !!userId,
  });
};

export const useSaveUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      playerName: string;
      handicap?: number;
    }) => {
      const result = await api.put<{
        userId: string;
        playerName: string;
        handicap?: number;
        createdAt: string;
        updatedAt: string;
      }>("/users/me", {
        playerName: data.playerName,
        handicap: data.handicap,
      });

      const profile: UserProfile = {
        userId: result.userId,
        playerId: result.userId,
        playerName: result.playerName,
        handicap: result.handicap,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
      return profile;
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", profile.userId] });
      queryClient.invalidateQueries({ queryKey: ["hasUserProfile", profile.userId] });
    },
  });
};

export const useDeleteUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Note: delete user endpoint can be added later if needed
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      queryClient.invalidateQueries({ queryKey: ["hasUserProfile", userId] });
    },
  });
};
