import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTour } from "../hooks/useTours";
import { useCreateRound } from "../hooks/useRounds";
import { PlayFormat, RoundSettings, GOLF_FORMATS } from "../types";
import { storage } from "../lib/storage";
import { PageHeader } from "../components/ui/PageHeader";

export const CreateRoundPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const { data: tour, isLoading } = useTour(tourId!);
  const createRound = useCreateRound(tourId!);

  const [formData, setFormData] = useState({
    name: "",
    courseName: "",
    format: "stroke-play" as PlayFormat,
    holes: 18,
    teeBoxes: "Championship Tees",
    slopeRating: "113",
    totalYardage: "",
    holeInfo: storage.generateDefaultHoles(18),
    useManualPar: false,
    manualTotalPar: "",
    settings: {
      strokesGiven: true,
      matchPlayFormat: "singles" as const,
      skinsValue: 1,
      teamScoring: "best-ball" as const,
    } as RoundSettings,
    startTime: "",
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleHoleCountChange = (holes: number) => {
    const newHoleInfo = storage.generateDefaultHoles(holes);
    setFormData({
      ...formData,
      holes,
      holeInfo: newHoleInfo,
      manualTotalPar: formData.useManualPar ? (holes * 4).toString() : "",
    });
  };

  const handleParChange = (holeNumber: number, par: number) => {
    const updatedHoles = formData.holeInfo.map((hole) =>
      hole.number === holeNumber ? { ...hole, par } : hole
    );
    setFormData({ ...formData, holeInfo: updatedHoles });
  };

  const handleYardageChange = (holeNumber: number, yardage: number) => {
    const updatedHoles = formData.holeInfo.map((hole) =>
      hole.number === holeNumber ? { ...hole, yardage } : hole
    );
    setFormData({ ...formData, holeInfo: updatedHoles });
  };

  const handleHandicapChange = (holeNumber: number, handicap: number) => {
    const updatedHoles = formData.holeInfo.map((hole) =>
      hole.number === holeNumber ? { ...hole, handicap } : hole
    );
    setFormData({ ...formData, holeInfo: updatedHoles });
    // Clear validation errors when user makes changes
    setValidationErrors([]);
  };

  const validateHandicaps = () => {
    const errors: string[] = [];
    const handicaps = formData.holeInfo
      .map((hole) => hole.handicap)
      .filter((hcp) => hcp !== undefined && hcp > 0);

    // Check for duplicates
    const duplicates = handicaps.filter(
      (hcp, index) => handicaps.indexOf(hcp) !== index
    );
    const uniqueDuplicates = [...new Set(duplicates)];

    if (uniqueDuplicates.length > 0) {
      errors.push(
        `Duplicate handicap values found: ${uniqueDuplicates.join(
          ", "
        )}. Each hole must have a unique handicap from 1-18.`
      );
    }

    // Check for invalid ranges
    const invalidHandicaps = handicaps.filter((hcp) => hcp! < 1 || hcp! > 18);
    if (invalidHandicaps.length > 0) {
      errors.push(
        `Invalid handicap values: ${invalidHandicaps.join(
          ", "
        )}. Handicaps must be between 1 and 18.`
      );
    }

    return errors;
  };

  const getDuplicateHandicaps = () => {
    const handicaps = formData.holeInfo
      .map((hole) => hole.handicap)
      .filter((hcp) => hcp !== undefined && hcp > 0);

    const duplicates = handicaps.filter(
      (hcp, index) => handicaps.indexOf(hcp) !== index
    );
    return new Set(duplicates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.courseName.trim()) return;

    // Validate handicaps
    const handicapErrors = validateHandicaps();
    if (handicapErrors.length > 0) {
      setValidationErrors(handicapErrors);
      return;
    }

    try {
      const totalPar =
        formData.useManualPar && formData.manualTotalPar
          ? parseInt(formData.manualTotalPar)
          : undefined;

      const newRound = await createRound.mutateAsync({
        ...formData,
        totalPar,
      });

      navigate(`/tour/${tourId}/round/${newRound.id}`);
    } catch (error) {
      console.error("Failed to create round:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 font-medium">Loading tournament...</div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 safe-area-top p-6">
        <div className="card text-center py-12">
          <h3 className="text-xl font-semibold text-slate-700 mb-3">
            Tournament Not Found
          </h3>
          <button onClick={() => navigate("/")} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const formatInfo = GOLF_FORMATS[formData.format];
  const totalPar =
    formData.useManualPar && formData.manualTotalPar
      ? parseInt(formData.manualTotalPar) || 0
      : formData.holeInfo.reduce((sum, hole) => sum + hole.par, 0);

  const totalYardage = formData.holeInfo.reduce(
    (sum, hole) => sum + (hole.yardage || 0),
    0
  );

  const breadcrumbs = tour
    ? [
        { label: "Home", path: "/", icon: "🏠" },
        { label: tour.name, path: `/tour/${tourId}`, icon: "⛳" },
        { label: "Rounds", path: `/tour/${tourId}/rounds`, icon: "📋" },
        { label: "Create Round", icon: "➕" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 safe-area-top">
      <PageHeader
        title="Create New Round"
        subtitle={tour?.name}
        breadcrumbs={breadcrumbs}
        backPath={`/tour/${tourId}/rounds`}
      />

      <div className="px-4 -mt-4 pb-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {validationErrors.length > 0 && (
            <div className="card-elevated border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 12.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">
                    Please fix the following issues:
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-red-800">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Round Information */}
          <div className="card-elevated">
            <h2 className="section-header card-spacing">Round Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Round Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Saturday Championship Round"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="form-label">Game Format *</label>

                {/* Standard Formats */}
                <div className="card-spacing">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Standard Formats
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(GOLF_FORMATS)
                      .filter(([key, format]) => !format.ryderCup)
                      .map(([key, format]) => (
                        <label
                          key={key}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.format === key
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
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
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{format.icon}</span>
                              <span className="font-medium text-slate-900">
                                {format.name}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">
                              {format.description}
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Ryder Cup Formats - Only show for Ryder Cup tournaments */}
                {tour.format === "ryder-cup" && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🏆</span>
                      <h4 className="text-sm font-medium text-slate-700">
                        Ryder Cup Formats
                      </h4>
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                        Premium
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(GOLF_FORMATS)
                        .filter(([key, format]) => format.ryderCup)
                        .map(([key, format]) => (
                          <label
                            key={key}
                            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.format === key
                                ? "border-amber-500 bg-amber-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
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
                              className="sr-only"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{format.icon}</span>
                                <span className="font-medium text-slate-900">
                                  {format.name}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                {format.description}
                              </p>
                              {format.playersPerTeam && (
                                <p className="text-xs text-amber-700 mt-1 font-medium">
                                  {format.playersPerTeam} player
                                  {format.playersPerTeam > 1 ? "s" : ""} per
                                  team
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Course Information */}
          <div className="card-elevated">
            <h2 className="section-header card-spacing">Course Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Course Name *</label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) =>
                    setFormData({ ...formData, courseName: e.target.value })
                  }
                  className="input-field"
                  placeholder="Pine Valley Golf Club"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Number of Holes</label>
                <div className="flex gap-3">
                  {[9, 18].map((holeCount) => (
                    <button
                      key={holeCount}
                      type="button"
                      onClick={() => handleHoleCountChange(holeCount)}
                      className={`flex-1 p-3 border-2 rounded-lg font-medium transition-all ${
                        formData.holes === holeCount
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {holeCount} Holes
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Slope Rating</label>
                <input
                  type="number"
                  value={formData.slopeRating}
                  onChange={(e) =>
                    setFormData({ ...formData, slopeRating: e.target.value })
                  }
                  className="input-field"
                  placeholder="113"
                  min="55"
                  max="155"
                />
                <p className="form-help">
                  Course difficulty rating (55-155, 113 is average)
                </p>
              </div>
            </div>
          </div>

          {/* Course Layout - Detailed Hole Information */}
          <div className="card-elevated">
            <div className="flex justify-between items-center card-spacing">
              <h2 className="section-header">Course Layout</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-600">Total Par: {totalPar}</span>
                <span className="text-slate-600">
                  Total Yardage: {totalYardage}
                </span>
              </div>
            </div>

            {/* Manual Total Par Option */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 card-spacing">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Par Setup</h3>
                  <p className="text-sm text-slate-600">
                    Set course par manually or configure individual holes
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">
                    Manual Total Par:
                  </span>
                  <button
                    type="button"
                    aria-label={
                      formData.useManualPar
                        ? "Disable manual total par"
                        : "Enable manual total par"
                    }
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
                    Recommended: {formData.holes * 4}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 font-medium text-slate-700">
                          Hole
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700">
                          Par
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700">
                          Yardage
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700">
                          HCP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.holeInfo.map((hole) => (
                        <tr
                          key={hole.number}
                          className="border-b border-slate-100"
                        >
                          <td className="py-2 px-3 font-medium">
                            {hole.number}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={hole.par}
                              onChange={(e) =>
                                handleParChange(
                                  hole.number,
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-16 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                            >
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={hole.yardage || ""}
                              onChange={(e) =>
                                handleYardageChange(
                                  hole.number,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                              placeholder="350"
                              min="50"
                              max="700"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={hole.handicap || ""}
                              onChange={(e) =>
                                handleHandicapChange(
                                  hole.number,
                                  parseInt(e.target.value) || hole.number
                                )
                              }
                              className={`w-16 px-2 py-1 border rounded focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 ${
                                getDuplicateHandicaps().has(hole.handicap) ||
                                (hole.handicap &&
                                  (hole.handicap < 1 || hole.handicap > 18))
                                  ? "border-red-300 bg-red-50"
                                  : "border-slate-300"
                              }`}
                              min="1"
                              max="18"
                              placeholder={hole.number.toString()}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Tournament Settings */}
          <div className="card-elevated">
            <h2 className="section-header card-spacing">Tournament Settings</h2>

            <div className="space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-slate-900">
                      Apply Handicap Strokes
                    </div>
                    <div className="text-sm text-slate-600">
                      Give strokes based on player handicaps and course slope
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
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(`/tour/${tourId}`)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createRound.isPending ||
                !formData.name.trim() ||
                !formData.courseName.trim()
              }
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {createRound.isPending ? "Creating Round..." : "Create Round"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
