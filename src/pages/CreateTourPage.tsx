import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTour } from "../hooks/useTours";
import { TourFormat } from "../types";

export const CreateTourPage = () => {
  const navigate = useNavigate();
  const createTour = useCreateTour();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    format: "individual" as TourFormat,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const tour = await createTour.mutateAsync(formData);
      navigate(`/tour/${tour.id}`);
    } catch (error) {
      console.error("Failed to create tournament:", error);
    }
  };

  const tournamentFormats = [
    {
      value: "individual",
      name: "Individual Championship",
      description:
        "Classic stroke play where each player competes individually",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      popular: true,
    },
    {
      value: "team",
      name: "Team Competition",
      description: "Players form teams and compete for team victories",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      popular: false,
    },
    {
      value: "ryder-cup",
      name: "Ryder Cup Style",
      description: "Premium team format with captains and various match types",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3l14 9-14 9V3z"
          />
        </svg>
      ),
      popular: false,
      premium: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <div className="golf-hero-bg safe-area-top">
        <div className="flex items-center p-6">
          <button onClick={() => navigate(-1)} className="nav-back mr-4">
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Tournament</h1>
            <p className="text-emerald-100 mt-1">
              Set up your professional golf event
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-8">
        <div className="card-elevated max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Tournament Details Section */}
            <div>
              <h2 className="section-header card-spacing">
                Tournament Details
              </h2>

              <div className="space-y-6">
                {/* Tournament Name */}
                <div className="form-group">
                  <label className="form-label">Tournament Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input-field text-lg"
                    placeholder="e.g., Weekend Masters Championship"
                    required
                  />
                  <p className="form-help">
                    Choose a memorable name for your tournament
                  </p>
                </div>

                {/* Tournament Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input-field h-32 resize-none"
                    placeholder="Describe your tournament, rules, prizes, or special notes..."
                  />
                  <p className="form-help">
                    Help players understand what to expect from your tournament
                  </p>
                </div>
              </div>
            </div>

            {/* Tournament Format Section */}
            <div>
              <h2 className="section-header card-spacing">
                Competition Format
              </h2>

              <div className="space-y-4">
                {tournamentFormats.map((format) => (
                  <label
                    key={format.value}
                    className={`relative flex items-start p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      formData.format === format.value
                        ? "border-emerald-500 bg-emerald-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={formData.format === format.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          format: e.target.value as TourFormat,
                        })
                      }
                      className="sr-only"
                    />

                    {/* Selection Indicator */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1 transition-all ${
                        formData.format === format.value
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-300"
                      }`}
                    >
                      {formData.format === format.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg ${
                            formData.format === format.value
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {format.icon}
                        </div>

                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {format.name}
                          </h3>

                          {format.popular && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold border border-blue-200">
                              Popular
                            </span>
                          )}

                          {format.premium && (
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-semibold border border-amber-200">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-600 leading-relaxed">
                        {format.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Format-specific Information */}
              {formData.format === "ryder-cup" && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-amber-100 rounded">
                      <svg
                        className="w-4 h-4 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1">
                        Ryder Cup Format
                      </h4>
                      <p className="text-sm text-amber-800">
                        This premium format includes team captains, strategic
                        player selection, and multiple competition formats
                        within a single tournament.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTour.isPending || !formData.name.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {createTour.isPending
                  ? "Creating Tournament..."
                  : "Create Tournament"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
