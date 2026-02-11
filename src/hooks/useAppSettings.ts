import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { applyTheme } from "../lib/storage/settings";
import { AppSettings } from "../types/settings";
import { DEFAULT_APP_SETTINGS } from "@tour-maker/shared";

export const useAppSettings = () => {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      try {
        return await api.get<AppSettings>("/settings");
      } catch {
        // Fallback to defaults if not logged in or server unavailable
        return DEFAULT_APP_SETTINGS;
      }
    },
    staleTime: Infinity,
  });
};

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: AppSettings) => {
      const result = await api.put<AppSettings>("/settings", settings);
      applyTheme(settings.theme);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};

export const useUpdateAppSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      key: keyof AppSettings;
      value: AppSettings[keyof AppSettings];
    }) => {
      const result = await api.put<AppSettings>("/settings", { [data.key]: data.value });
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

  return useMutation({
    mutationFn: async () => {
      const result = await api.put<AppSettings>("/settings", DEFAULT_APP_SETTINGS);
      applyTheme(result.theme);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};
