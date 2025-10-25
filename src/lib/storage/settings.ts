import { AppSettings, DEFAULT_APP_SETTINGS } from "../../types/settings";

const SETTINGS_KEY = "app-settings";

/**
 * Get app settings from localStorage
 */
export function getAppSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return DEFAULT_APP_SETTINGS;
    }

    const settings = JSON.parse(stored) as AppSettings;
    // Merge with defaults to ensure new settings are populated
    return { ...DEFAULT_APP_SETTINGS, ...settings };
  } catch (error) {
    console.error("Failed to load app settings:", error);
    return DEFAULT_APP_SETTINGS;
  }
}

/**
 * Save app settings to localStorage
 */
export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save app settings:", error);
    throw new Error("Failed to save settings");
  }
}

/**
 * Update specific app setting
 */
export function updateAppSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): AppSettings {
  const settings = getAppSettings();
  settings[key] = value;
  saveAppSettings(settings);
  return settings;
}

/**
 * Reset app settings to defaults
 */
export function resetAppSettings(): AppSettings {
  saveAppSettings(DEFAULT_APP_SETTINGS);
  return DEFAULT_APP_SETTINGS;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: AppSettings["theme"]): void {
  const root = document.documentElement;

  if (theme === "auto") {
    // Use system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

/**
 * Initialize app settings on app load
 */
export function initializeAppSettings(): AppSettings {
  const settings = getAppSettings();
  applyTheme(settings.theme);
  return settings;
}
