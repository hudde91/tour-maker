import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, saveUserProfile } from "../lib/firestore";
import { UserProfile } from "../types/core";

export const useUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;
      const profile = await getUserProfile(userId);
      if (!profile) return null;
      return {
        userId: profile.userId as string,
        playerId: profile.userId as string,
        playerName: profile.playerName as string,
        handicap: profile.handicap as number | undefined,
        createdAt: profile.createdAt as string,
        updatedAt: profile.updatedAt as string,
      };
    },
    enabled: !!userId,
  });
};

export const useHasUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ["hasUserProfile", userId],
    queryFn: async () => {
      if (!userId) return false;
      const profile = await getUserProfile(userId);
      return !!profile;
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
      await saveUserProfile(data.userId, {
        playerName: data.playerName,
        handicap: data.handicap,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", data.userId] });
      queryClient.invalidateQueries({ queryKey: ["hasUserProfile", data.userId] });
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
