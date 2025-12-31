import { UserProfile } from "../../types/core";
import { STORAGE_KEYS } from "./constants";

/**
 * Get all user profiles from localStorage
 */
export const getUserProfiles = (): UserProfile[] => {
  const profiles = localStorage.getItem(STORAGE_KEYS.USER_PROFILES);
  return profiles ? JSON.parse(profiles) : [];
};

/**
 * Get user profile by Firebase user ID
 */
export const getUserProfile = (userId: string): UserProfile | null => {
  const profiles = getUserProfiles();
  return profiles.find((profile) => profile.userId === userId) || null;
};

/**
 * Save or update a user profile
 */
export const saveUserProfile = (profile: UserProfile): void => {
  const profiles = getUserProfiles();
  const existingIndex = profiles.findIndex((p) => p.userId === profile.userId);

  if (existingIndex >= 0) {
    // Update existing profile
    profiles[existingIndex] = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Add new profile
    profiles.push(profile);
  }

  localStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));
};

/**
 * Delete a user profile
 */
export const deleteUserProfile = (userId: string): void => {
  const profiles = getUserProfiles();
  const filtered = profiles.filter((p) => p.userId !== userId);
  localStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(filtered));
};

/**
 * Check if a user has a profile
 */
export const hasUserProfile = (userId: string): boolean => {
  return getUserProfile(userId) !== null;
};
