export type ThemeMode = "light" | "dark" | "auto";
export type ScoringDisplay = "gross" | "net" | "both";
export type MeasurementUnit = "yards" | "meters";
export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
export type TimeFormat = "12h" | "24h";

export interface AppSettings {
  theme: ThemeMode;
  defaultHandicap: number;
  preferredScoringDisplay: ScoringDisplay;
  measurementUnit: MeasurementUnit;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  showTips: boolean;
  compactMode: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "light",
  defaultHandicap: 0,
  preferredScoringDisplay: "gross",
  measurementUnit: "yards",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  showTips: true,
  compactMode: false,
};
