import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTour } from "../hooks/useTours";
import { TourFormat } from "../types";

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: "Competition Format",
    description: "Choose your tournament style",
  },
  {
    id: 2,
    title: "Tournament Name",
    description: "Give your tournament a name",
  },
  {
    id: 3,
    title: "Description",
    description: "Add details (optional)",
  },
];

export const CreateTourPage = () => {
  const navigate = useNavigate();
  const createTour = useCreateTour();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    format: "individual" as TourFormat,
  });

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipDescription = async () => {
    try {
      const tour = await createTour.mutateAsync(formData);
      navigate(`/tour/${tour.id}`);
    } catch (error) {
      console.error("Failed to create tournament:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const tour = await createTour.mutateAsync(formData);
      navigate(`/tour/${tour.id}`);
    } catch (error) {
      console.error("Failed to create tournament:", error);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true; // Format is always selected
      case 2:
        return formData.name.trim().length > 0;
      case 3:
        return true; // Description is optional
      default:
        return false;
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
      {/* Header */}
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
              Step {currentStep} of {WIZARD_STEPS.length}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep > step.id
                        ? "bg-emerald-500 text-white"
                        : currentStep === step.id
                        ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="text-center mt-2 hidden sm:block">
                    <div
                      className={`text-sm font-semibold ${
                        currentStep >= step.id
                          ? "text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all ${
                      currentStep > step.id ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card-elevated">
          {/* Step 1: Competition Format */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Choose Competition Format
                </h2>
                <p className="text-slate-600">
                  Select the tournament style that best fits your event
                </p>
              </div>

              <div className="space-y-4">
                {tournamentFormats.map((format) => (
                  <label
                    key={format.value}
                    className={`relative flex items-start p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      formData.format === format.value
                        ? "border-emerald-500 bg-emerald-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    data-testid={`format-${format.value}`}
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
                      data-testid={`format-${format.value}-radio`}
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
                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-emerald-100 rounded">
                        <svg
                          className="w-4 h-4 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-emerald-900 mb-1">
                          First Time? Try the Setup Wizard!
                        </h4>
                        <p className="text-sm text-emerald-800 mb-3">
                          Our guided wizard will walk you through creating your
                          Ryder Cup tournament with pre-filled templates and
                          helpful tips.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate("/create/ryder-cup-wizard")}
                          className="btn-primary text-sm"
                        >
                          Use Setup Wizard
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
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
                          Advanced Setup
                        </h4>
                        <p className="text-sm text-amber-800">
                          Continue with manual setup if you prefer complete
                          control. This format includes team captains, strategic
                          player selection, and multiple competition formats.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Tournament Name */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Tournament Name
                </h2>
                <p className="text-slate-600">
                  Give your tournament a memorable name
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Tournament Name *</label>
                <input
                  type="text"
                  name="tournamentName"
                  data-testid="tournament-name-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field text-lg"
                  placeholder="e.g., Weekend Masters Championship"
                  autoFocus
                />
                <p className="form-help">
                  This will be the main identifier for your tournament
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Description (Optional) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Tournament Description
                  <span className="text-base font-normal text-slate-500 ml-2">
                    (Optional)
                  </span>
                </h2>
                <p className="text-slate-600">
                  Add details about your tournament, or skip this step
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="tournamentDescription"
                  data-testid="tournament-description-input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field h-40 resize-none"
                  placeholder="Describe your tournament, rules, prizes, or special notes..."
                  autoFocus
                />
                <p className="form-help">
                  You can add or edit this description at any time from the
                  tournament settings
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5"
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
                  <div className="text-sm text-blue-800">
                    <strong>Not sure what to write?</strong> You can skip this
                    step and add a description later. It's completely optional
                    and can be changed at any time.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6 mt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {currentStep === 3 ? (
              <>
                <button
                  type="button"
                  onClick={handleSkipDescription}
                  disabled={createTour.isPending}
                  className="btn-secondary flex-1 disabled:opacity-50"
                >
                  Skip & Create
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createTour.isPending}
                  className="btn-primary flex-1 disabled:opacity-50"
                  data-testid="submit-tournament-button"
                >
                  {createTour.isPending
                    ? "Creating..."
                    : "Create Tournament"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
