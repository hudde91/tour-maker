import { useState } from "react";
import { useCreateRound } from "../hooks/useRounds";
import {
  Tour,
  PlayFormat,
  HoleInfo,
  RoundSettings,
  GOLF_FORMATS,
} from "../types";
import { storage } from "../lib/storage";

interface CreateRoundModalProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoundModal = ({
  tour,
  isOpen,
  onClose,
}: CreateRoundModalProps) => {
  const createRound = useCreateRound(tour.id);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Course Setup, 3: Settings

  const [formData, setFormData] = useState({
    name: "",
    courseName: "",
    format: "stroke-play" as PlayFormat,
    holes: 18,
    holeInfo: storage.generateDefaultHoles(18),
    useManualPar: false,
    manualTotalPar: "",
    settings: {
      strokesGiven: true,
      matchPlayFormat: "singles" as const,
      skinsValue: 1,
      teamScoring: "best-ball" as const,
    } as RoundSettings,
  });

  const handleHoleCountChange = (holes: number) => {
    const newHoleInfo = storage.generateDefaultHoles(holes);
    setFormData({
      ...formData,
      holes,
      holeInfo: newHoleInfo,
      // Reset manual par when changing hole count
      manualTotalPar: formData.useManualPar ? (holes * 4).toString() : "",
    });
  };

  const handleParChange = (holeNumber: number, par: number) => {
    const updatedHoles = formData.holeInfo.map((hole) =>
      hole.number === holeNumber ? { ...hole, par } : hole
    );
    setFormData({ ...formData, holeInfo: updatedHoles });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.courseName.trim()) return;

    try {
      const totalPar =
        formData.useManualPar && formData.manualTotalPar
          ? parseInt(formData.manualTotalPar)
          : undefined;

      await createRound.mutateAsync({
        ...formData,
        totalPar, // Include the manual total par
      });

      // Reset form and close modal
      setFormData({
        name: "",
        courseName: "",
        format: "stroke-play",
        holes: 18,
        holeInfo: storage.generateDefaultHoles(18),
        useManualPar: false,
        manualTotalPar: "",
        settings: {
          strokesGiven: true,
          matchPlayFormat: "singles",
          skinsValue: 1,
          teamScoring: "best-ball",
        },
      });
      setStep(1);
      onClose();
    } catch (error) {
      console.error("Failed to create round:", error);
    }
  };

  if (!isOpen) return null;

  const formatInfo = GOLF_FORMATS[formData.format];
  const totalPar =
    formData.useManualPar && formData.manualTotalPar
      ? parseInt(formData.manualTotalPar) || 0
      : formData.holeInfo.reduce((sum, hole) => sum + hole.par, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:w-[480px] sm:rounded-xl rounded-t-xl safe-area-bottom max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Round</h2>
            <p className="text-sm text-gray-500">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Round Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Saturday Morning Round"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) =>
                    setFormData({ ...formData, courseName: e.target.value })
                  }
                  className="input-field"
                  placeholder="Pine Valley Golf Club"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Game Format
                </label>
                <div className="space-y-2">
                  {Object.entries(GOLF_FORMATS).map(([key, format]) => (
                    <label
                      key={key}
                      className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 touch-manipulation"
                    >
                      <input
                        type="radio"
                        name="format"
                        value={key}
                        checked={formData.format === key}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            format: e.target.value as PlayFormat,
                          })
                        }
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{format.icon}</span>
                          <span className="font-medium text-gray-900">
                            {format.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {format.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Course Setup */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Number of Holes
                </label>
                <div className="flex gap-3">
                  {[9, 18].map((holeCount) => (
                    <button
                      key={holeCount}
                      type="button"
                      onClick={() => handleHoleCountChange(holeCount)}
                      className={`flex-1 p-3 border rounded-lg font-medium touch-manipulation ${
                        formData.holes === holeCount
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {holeCount} Holes
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Total Par Option */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Course Par Setup
                    </h3>
                    <p className="text-sm text-slate-600">
                      Choose how to set the total course par
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">Manual Par:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          useManualPar: !formData.useManualPar,
                          manualTotalPar: !formData.useManualPar
                            ? (formData.holes * 4).toString()
                            : "",
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.useManualPar ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.useManualPar
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {formData.useManualPar ? (
                  // Manual Total Par Input
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Total Course Par
                    </label>
                    <input
                      type="number"
                      value={formData.manualTotalPar}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          manualTotalPar: e.target.value,
                        })
                      }
                      className="input-field w-32"
                      placeholder="72"
                      min={formData.holes * 3}
                      max={formData.holes * 6}
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Set the total par for the entire course (recommended:{" "}
                      {formData.holes * 4})
                    </p>
                  </div>
                ) : (
                  // Detailed Hole Setup
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        Individual Hole Setup
                      </label>
                      <span className="text-sm text-gray-500">
                        Total Par: {totalPar}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {formData.holeInfo.map((hole) => (
                        <div
                          key={hole.number}
                          className="bg-white p-3 rounded-lg border border-slate-200"
                        >
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Hole {hole.number}
                          </div>
                          <div className="flex gap-1">
                            {[3, 4, 5].map((par) => (
                              <button
                                key={par}
                                type="button"
                                onClick={() =>
                                  handleParChange(hole.number, par)
                                }
                                className={`flex-1 py-1 px-2 text-sm rounded touch-manipulation ${
                                  hole.par === par
                                    ? "bg-primary-600 text-white"
                                    : "bg-gray-100 border border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                Par {par}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{formatInfo.icon}</span>
                  <span className="font-semibold text-blue-900">
                    {formatInfo.name}
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  {formatInfo.description}
                </p>
              </div>

              {/* General Settings */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Game Settings</h3>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      Apply Handicap Strokes
                    </div>
                    <div className="text-sm text-gray-600">
                      Give strokes based on player handicaps
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.settings.strokesGiven}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          strokesGiven: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>

                {/* Format-specific settings */}
                {formData.format === "match-play" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Match Play Format
                    </label>
                    <select
                      value={formData.settings.matchPlayFormat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            matchPlayFormat: e.target.value as
                              | "singles"
                              | "teams",
                          },
                        })
                      }
                      className="input-field"
                    >
                      <option value="singles">Singles (1 vs 1)</option>
                      <option value="teams">Teams</option>
                    </select>
                  </div>
                )}

                {formData.format === "skins" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skin Value (points)
                    </label>
                    <input
                      type="number"
                      value={formData.settings.skinsValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            skinsValue: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                      className="input-field"
                      min="1"
                      max="10"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary flex-1 touch-manipulation"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 &&
                    (!formData.name.trim() || !formData.courseName.trim())) ||
                  (step === 2 && totalPar === 0)
                }
                className="btn-primary flex-1 disabled:opacity-50 touch-manipulation"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createRound.isPending}
                className="btn-primary flex-1 disabled:opacity-50 touch-manipulation"
              >
                {createRound.isPending ? "Creating..." : "Create Round"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
