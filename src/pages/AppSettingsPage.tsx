import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  useAppSettings,
  useUpdateAppSettings,
  useResetAppSettings,
} from "@/hooks/useAppSettings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Settings,
  Sun,
  Moon,
  RotateCw,
  Undo2,
  Check,
} from "lucide-react";
import {
  AppSettings,
  ThemeMode,
  ScoringDisplay,
  MeasurementUnit,
  DateFormat,
  TimeFormat,
} from "@/types/settings";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export const AppSettingsPage = () => {
  useDocumentTitle("Settings");
  const { data: appSettings, isLoading } = useAppSettings();
  const updateSettings = useUpdateAppSettings();
  const resetSettings = useResetAppSettings();
  const { showToast, ToastComponent } = useToast();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (appSettings) {
      setLocalSettings(appSettings);
    }
  }, [appSettings]);

  const handleSettingChange = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    if (!localSettings) return;

    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);

    try {
      await updateSettings.mutateAsync(updatedSettings);
      showToast("Settings updated successfully", "success");
    } catch (error) {
      console.error("Failed to update settings:", error);
      showToast("Failed to update settings", "error");
      // Revert on error
      setLocalSettings(localSettings);
    }
  };

  const handleResetSettings = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    try {
      const defaultSettings = await resetSettings.mutateAsync();
      setLocalSettings(defaultSettings);
      showToast("Settings reset to defaults", "success");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      showToast("Failed to reset settings", "error");
    } finally {
      setShowResetConfirm(false);
    }
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  if (isLoading || !localSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Settings className="text-emerald-400" size={32} strokeWidth={2} />
          </div>
          <div className="text-lg font-semibold text-white/70">
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Home", path: "/", icon: <Home size={16} strokeWidth={2} /> },
    { label: "App Settings", icon: <Settings size={16} strokeWidth={2} /> },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader
        title="App Settings"
        subtitle="Customize your preferences"
        breadcrumbs={breadcrumbs}
      />

      <div className="pb-8 w-full max-w-6xl mx-auto space-y-6">
        {/* Theme Settings */}
        <div className="card-elevated">
          <h2 className="section-header mb-4">Appearance</h2>

          <div>
            <label className="text-sm font-semibold text-white/50 block mb-3">
              Theme
            </label>
            <div className="space-y-2">
              {(["light", "dark", "auto"] as ThemeMode[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleSettingChange("theme", theme)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors text-left ${
                    localSettings.theme === theme
                      ? "bg-emerald-500/15 border-2 border-emerald-500/40"
                      : "bg-white/5 hover:bg-white/8 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        localSettings.theme === theme
                          ? "bg-emerald-500/25"
                          : "bg-white/10"
                      }`}
                    >
                      {theme === "light" ? (
                        <Sun
                          size={20}
                          strokeWidth={2}
                          className={
                            localSettings.theme === theme
                              ? "text-emerald-400"
                              : "text-white/50"
                          }
                        />
                      ) : theme === "dark" ? (
                        <Moon
                          size={20}
                          strokeWidth={2}
                          className={
                            localSettings.theme === theme
                              ? "text-emerald-400"
                              : "text-white/50"
                          }
                        />
                      ) : (
                        <RotateCw
                          size={20}
                          strokeWidth={2}
                          className={
                            localSettings.theme === theme
                              ? "text-emerald-400"
                              : "text-white/50"
                          }
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white capitalize">
                        {theme}
                      </div>
                      <div className="text-sm text-white/40">
                        {theme === "light"
                          ? "Always use light mode"
                          : theme === "dark"
                            ? "Always use dark mode"
                            : "Match system preference"}
                      </div>
                    </div>
                  </div>
                  {localSettings.theme === theme && (
                    <Check
                      size={20}
                      strokeWidth={3}
                      className="text-emerald-400"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.compactMode}
                onChange={(e) =>
                  handleSettingChange("compactMode", e.target.checked)
                }
                className="w-5 h-5 rounded border-white/15 text-emerald-400 focus:ring-emerald-500"
              />
              <div>
                <div className="font-semibold text-white">Compact Mode</div>
                <div className="text-sm text-white/40">
                  Reduce spacing for denser layouts
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Golf Preferences */}
        <div className="card-elevated">
          <h2 className="section-header mb-4">Golf Preferences</h2>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-white/50 block mb-2">
                Default Handicap
              </label>
              <input
                type="number"
                min="0"
                max="54"
                value={localSettings.defaultHandicap}
                onChange={(e) =>
                  handleSettingChange(
                    "defaultHandicap",
                    parseInt(e.target.value) || 0,
                  )
                }
                className="input-field"
              />
              <p className="text-xs text-white/40 mt-1">
                Default handicap for new players (0-54)
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-white/50 block mb-3">
                Preferred Scoring Display
              </label>
              <div className="space-y-2">
                {(["gross", "net", "both"] as ScoringDisplay[]).map(
                  (display) => (
                    <button
                      key={display}
                      onClick={() =>
                        handleSettingChange("preferredScoringDisplay", display)
                      }
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                        localSettings.preferredScoringDisplay === display
                          ? "bg-emerald-500/15 border-2 border-emerald-500/40"
                          : "bg-white/5 hover:bg-white/8 border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-white capitalize">
                          {display}
                        </div>
                        <div className="text-sm text-white/40">
                          {display === "gross"
                            ? "Show actual scores"
                            : display === "net"
                              ? "Show adjusted scores with handicap"
                              : "Show both gross and net scores"}
                        </div>
                      </div>
                      {localSettings.preferredScoringDisplay === display && (
                        <Check
                          size={20}
                          strokeWidth={3}
                          className="text-emerald-400"
                        />
                      )}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-white/50 block mb-3">
                Measurement Unit
              </label>
              <div className="space-y-2">
                {(["yards", "meters"] as MeasurementUnit[]).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleSettingChange("measurementUnit", unit)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                      localSettings.measurementUnit === unit
                        ? "bg-emerald-500/15 border-2 border-emerald-500/40"
                        : "bg-white/5 hover:bg-white/8 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-white capitalize">
                        {unit}
                      </div>
                    </div>
                    {localSettings.measurementUnit === unit && (
                      <Check
                        size={20}
                        strokeWidth={3}
                        className="text-emerald-400"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Regional Preferences */}
        <div className="card-elevated">
          <h2 className="section-header mb-4">Regional Preferences</h2>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-white/50 block mb-3">
                Date Format
              </label>
              <div className="space-y-2">
                {(
                  ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as DateFormat[]
                ).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleSettingChange("dateFormat", format)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                      localSettings.dateFormat === format
                        ? "bg-emerald-500/15 border-2 border-emerald-500/40"
                        : "bg-white/5 hover:bg-white/8 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-white">{format}</div>
                      <div className="text-sm text-white/40">
                        {format === "MM/DD/YYYY"
                          ? new Date().toLocaleDateString("en-US")
                          : format === "DD/MM/YYYY"
                            ? new Date().toLocaleDateString("en-GB")
                            : new Date().toISOString().split("T")[0]}
                      </div>
                    </div>
                    {localSettings.dateFormat === format && (
                      <Check
                        size={20}
                        strokeWidth={3}
                        className="text-emerald-400"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-white/50 block mb-3">
                Time Format
              </label>
              <div className="space-y-2">
                {(["12h", "24h"] as TimeFormat[]).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleSettingChange("timeFormat", format)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                      localSettings.timeFormat === format
                        ? "bg-emerald-500/15 border-2 border-emerald-500/40"
                        : "bg-white/5 hover:bg-white/8 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-white">
                        {format === "12h" ? "12-hour" : "24-hour"}
                      </div>
                      <div className="text-sm text-white/40">
                        {format === "12h" ? "3:30 PM" : "15:30"}
                      </div>
                    </div>
                    {localSettings.timeFormat === format && (
                      <Check
                        size={20}
                        strokeWidth={3}
                        className="text-emerald-400"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Other Preferences */}
        <div className="card">
          <h2 className="section-header mb-4">Other Preferences</h2>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.showTips}
                onChange={(e) =>
                  handleSettingChange("showTips", e.target.checked)
                }
                className="w-5 h-5 rounded border-white/15 text-emerald-400 focus:ring-emerald-500"
              />
              <div>
                <div className="font-semibold text-white">Show Tips</div>
                <div className="text-sm text-white/40">
                  Display helpful tips throughout the app
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="card border-amber-500/30">
          <h2 className="section-header text-amber-400/60 mb-4 flex items-center gap-2">
            <RotateCw size={20} strokeWidth={2} />
            Reset Settings
          </h2>

          <button
            onClick={handleResetSettings}
            disabled={resetSettings.isPending}
            className="w-full flex items-center justify-between p-4 bg-amber-500/10 hover:bg-amber-500/15 rounded-lg transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Undo2
                  size={20}
                  strokeWidth={2}
                  className="text-amber-400/60"
                />
              </div>
              <div>
                <div className="font-semibold text-amber-300">
                  Reset to Defaults
                </div>
                <div className="text-sm text-amber-400/60">
                  Restore all settings to their default values
                </div>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-amber-400/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> This will reset all app settings to their
              default values. Your tournaments and data will not be affected.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="card">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 p-3 text-white/50 hover:text-white font-semibold transition-colors"
          >
            <Home size={20} strokeWidth={2} />
            Back to Home
          </Link>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Settings"
        message="Reset all app settings to their default values? Your tournaments and data will not be affected."
        confirmLabel="Reset Settings"
        cancelLabel="Cancel"
        onConfirm={confirmReset}
        onCancel={cancelReset}
        isDestructive={false}
      />

      <ToastComponent />
    </div>
  );
};
