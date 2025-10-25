import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useAppSettings, useUpdateAppSettings, useResetAppSettings } from "@/hooks/useAppSettings";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppSettings, ThemeMode, ScoringDisplay, MeasurementUnit, DateFormat, TimeFormat } from "@/types/settings";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export const AppSettingsPage = () => {
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
    value: AppSettings[K]
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
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">⚙️</span>
          </div>
          <div className="text-lg font-semibold text-slate-700">
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: "Home", path: "/", icon: "🏠" },
    { label: "App Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      <PageHeader
        title="App Settings"
        subtitle="Customize your preferences"
        breadcrumbs={breadcrumbs}
        backPath="/"
      />

      <div className="px-4 -mt-4 pb-8 w-full max-w-6xl mx-auto space-y-6">
        {/* Theme Settings */}
        <div className="card-elevated">
          <h2 className="section-header mb-4">Appearance</h2>

          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-3">
              Theme
            </label>
            <div className="space-y-2">
              {(["light", "dark", "auto"] as ThemeMode[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleSettingChange("theme", theme)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors text-left ${
                    localSettings.theme === theme
                      ? "bg-emerald-100 border-2 border-emerald-500"
                      : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        localSettings.theme === theme
                          ? "bg-emerald-200"
                          : "bg-slate-200"
                      }`}
                    >
                      <span className="text-xl">
                        {theme === "light"
                          ? "☀️"
                          : theme === "dark"
                          ? "🌙"
                          : "🔄"}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 capitalize">
                        {theme}
                      </div>
                      <div className="text-sm text-slate-500">
                        {theme === "light"
                          ? "Always use light mode"
                          : theme === "dark"
                          ? "Always use dark mode"
                          : "Match system preference"}
                      </div>
                    </div>
                  </div>
                  {localSettings.theme === theme && (
                    <span className="text-emerald-600 font-semibold">✓</span>
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
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="font-semibold text-slate-900">Compact Mode</div>
                <div className="text-sm text-slate-500">
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
              <label className="text-sm font-semibold text-slate-600 block mb-2">
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
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Default handicap for new players (0-54)
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-3">
                Preferred Scoring Display
              </label>
              <div className="space-y-2">
                {(["gross", "net", "both"] as ScoringDisplay[]).map((display) => (
                  <button
                    key={display}
                    onClick={() =>
                      handleSettingChange("preferredScoringDisplay", display)
                    }
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                      localSettings.preferredScoringDisplay === display
                        ? "bg-emerald-100 border-2 border-emerald-500"
                        : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-slate-900 capitalize">
                        {display}
                      </div>
                      <div className="text-sm text-slate-500">
                        {display === "gross"
                          ? "Show actual scores"
                          : display === "net"
                          ? "Show adjusted scores with handicap"
                          : "Show both gross and net scores"}
                      </div>
                    </div>
                    {localSettings.preferredScoringDisplay === display && (
                      <span className="text-emerald-600 font-semibold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-3">
                Measurement Unit
              </label>
              <div className="space-y-2">
                {(["yards", "meters"] as MeasurementUnit[]).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleSettingChange("measurementUnit", unit)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                      localSettings.measurementUnit === unit
                        ? "bg-emerald-100 border-2 border-emerald-500"
                        : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-slate-900 capitalize">
                        {unit}
                      </div>
                    </div>
                    {localSettings.measurementUnit === unit && (
                      <span className="text-emerald-600 font-semibold">✓</span>
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
              <label className="text-sm font-semibold text-slate-600 block mb-3">
                Date Format
              </label>
              <div className="space-y-2">
                {(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as DateFormat[]).map(
                  (format) => (
                    <button
                      key={format}
                      onClick={() => handleSettingChange("dateFormat", format)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                        localSettings.dateFormat === format
                          ? "bg-emerald-100 border-2 border-emerald-500"
                          : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-slate-900">
                          {format}
                        </div>
                        <div className="text-sm text-slate-500">
                          {format === "MM/DD/YYYY"
                            ? new Date().toLocaleDateString("en-US")
                            : format === "DD/MM/YYYY"
                            ? new Date().toLocaleDateString("en-GB")
                            : new Date().toISOString().split("T")[0]}
                        </div>
                      </div>
                      {localSettings.dateFormat === format && (
                        <span className="text-emerald-600 font-semibold">✓</span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-3">
                Time Format
              </label>
              <div className="space-y-2">
                {(["12h", "24h"] as TimeFormat[]).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleSettingChange("timeFormat", format)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                      localSettings.timeFormat === format
                        ? "bg-emerald-100 border-2 border-emerald-500"
                        : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-slate-900">
                        {format === "12h" ? "12-hour" : "24-hour"}
                      </div>
                      <div className="text-sm text-slate-500">
                        {format === "12h" ? "3:30 PM" : "15:30"}
                      </div>
                    </div>
                    {localSettings.timeFormat === format && (
                      <span className="text-emerald-600 font-semibold">✓</span>
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
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="font-semibold text-slate-900">Show Tips</div>
                <div className="text-sm text-slate-500">
                  Display helpful tips throughout the app
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="card border-amber-200">
          <h2 className="section-header text-amber-700 mb-4 flex items-center gap-2">
            <span>🔄</span>
            Reset Settings
          </h2>

          <button
            onClick={handleResetSettings}
            disabled={resetSettings.isPending}
            className="w-full flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
                <span className="text-xl">↩️</span>
              </div>
              <div>
                <div className="font-semibold text-amber-900">
                  Reset to Defaults
                </div>
                <div className="text-sm text-amber-700">
                  Restore all settings to their default values
                </div>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-amber-400"
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

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This will reset all app settings to their
              default values. Your tournaments and data will not be affected.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="card bg-slate-50">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 p-3 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
          >
            <span>🏠</span>
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
