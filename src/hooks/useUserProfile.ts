import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { storage } from "../lib/storage";
import { UserProfile } from "../types/core";

/**
 * Hook to get the user's profile
 */
export const useUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => {
      if (!userId) return null;
      return storage.getUserProfile(userId);
    },
    enabled: !!userId,
  });
};

/**
 * Hook to check if user has a profile
 */
export const useHasUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ["hasUserProfile", userId],
    queryFn: () => {
      if (!userId) return false;
      return storage.hasUserProfile(userId);
    },
    enabled: !!userId,
  });
};

/**
 * Hook to create or update user profile
 */
export const useSaveUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      playerName: string;
      handicap?: number;
    }) => {
      const existingProfile = storage.getUserProfile(data.userId);

      const profile: UserProfile = existingProfile
        ? {
            ...existingProfile,
            playerName: data.playerName.trim(),
            handicap: data.handicap,
            updatedAt: new Date().toISOString(),
          }
        : {
            userId: data.userId,
            playerId: nanoid(),
            playerName: data.playerName.trim(),
            handicap: data.handicap,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

      storage.saveUserProfile(profile);
      return profile;
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", profile.userId] });
      queryClient.invalidateQueries({ queryKey: ["hasUserProfile", profile.userId] });
    },
  });
};

/**
 * Hook to delete user profile
 */
export const useDeleteUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      storage.deleteUserProfile(userId);
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      queryClient.invalidateQueries({ queryKey: ["hasUserProfile", userId] });
    },
  });
};
