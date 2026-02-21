import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { applyTheme } from "../lib/storage/settings";
import { getAppSettingsFromFirestore, saveAppSettingsToFirestore } from "../lib/firestore";
import { AppSettings } from "../types/settings";
import { DEFAULT_APP_SETTINGS } from "@tour-maker/shared";

export const useAppSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["app-settings", user?.uid],
    queryFn: async () => {
      if (!user) return DEFAULT_APP_SETTINGS;
      return getAppSettingsFromFirestore(user.uid);
    },
    staleTime: Infinity,
  });
};

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: AppSettings) => {
      if (!user) throw new Error("Must be logged in");
      const result = await saveAppSettingsToFirestore(user.uid, settings);
      applyTheme(result.theme);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};

export const useUpdateAppSetting = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      key: keyof AppSettings;
      value: AppSettings[keyof AppSettings];
    }) => {
      if (!user) throw new Error("Must be logged in");
      const result = await saveAppSettingsToFirestore(user.uid, { [data.key]: data.value });
      if (data.key === "theme") {
        applyTheme(result.theme);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};

export const useResetAppSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      const result = await saveAppSettingsToFirestore(user.uid, DEFAULT_APP_SETTINGS);
      applyTheme(result.theme);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};
