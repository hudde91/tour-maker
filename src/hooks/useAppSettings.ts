import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppSettings,
  saveAppSettings,
  updateAppSetting,
  resetAppSettings,
  applyTheme,
} from "../lib/storage/settings";
import { AppSettings } from "../types/settings";

export const useAppSettings = () => {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: getAppSettings,
    staleTime: Infinity, // Settings don't change unless we mutate them
  });
};

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: AppSettings) => {
      saveAppSettings(settings);
      applyTheme(settings.theme);
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};

export const useUpdateAppSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async <K extends keyof AppSettings>(data: {
      key: K;
      value: AppSettings[K];
    }) => {
      const settings = updateAppSetting(data.key, data.value);
      if (data.key === "theme") {
        applyTheme(settings.theme);
      }
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};

export const useResetAppSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const settings = resetAppSettings();
      applyTheme(settings.theme);
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};
