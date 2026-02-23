import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useCreateTour } from "../../hooks/useTours";
import { useAuth } from "../../contexts/AuthContext";
import { TourFormat } from "../../types";

interface SessionTemplate {
  name: string;
  description: string;
  sessions: {
    day: number;
    dayName: string;
    morning: { type: string; name: string; matchCount: number };
    afternoon: { type: string; name: string; matchCount: number };
  }[];
}

const RYDER_CUP_TEMPLATES: SessionTemplate[] = [
  {
    name: "Classic Ryder Cup",
    description: "Traditional 3-day format with 28 total matches",
    sessions: [
      {
        day: 1,
        dayName: "Friday",
        morning: {
          type: "foursomes-match-play",
          name: "Foursomes",
          matchCount: 4,
        },
        afternoon: {
          type: "four-ball-match-play",
          name: "Four-Ball",
          matchCount: 4,
        },
      },
      {
        day: 2,
        dayName: "Saturday",
        morning: {
          type: "foursomes-match-play",
          name: "Foursomes",
          matchCount: 4,
        },
        afternoon: {
          type: "four-ball-match-play",
          name: "Four-Ball",
          matchCount: 4,
        },
      },
      {
        day: 3,
        dayName: "Sunday",
        morning: {
          type: "singles-match-play",
          name: "Singles",
          matchCount: 12,
        },
        afternoon: {
          type: "",
          name: "",
          matchCount: 0,
        },
      },
    ],
  },
  {
    name: "Weekend Ryder Cup",
    description: "Condensed 2-day format with 20 total matches",
    sessions: [
      {
        day: 1,
        dayName: "Saturday",
        morning: {
          type: "foursomes-match-play",
          name: "Foursomes",
          matchCount: 4,
        },
        afternoon: {
          type: "four-ball-match-play",
          name: "Four-Ball",
          matchCount: 4,
        },
      },
      {
        day: 2,
        dayName: "Sunday",
        morning: {
          type: "singles-match-play",
          name: "Singles",
          matchCount: 12,
        },
        afternoon: {
          type: "",
          name: "",
          matchCount: 0,
        },
      },
    ],
  },
  {
    name: "Quick Ryder Cup",
    description: "Single-day format with 12 total matches",
    sessions: [
      {
        day: 1,
        dayName: "Saturday",
        morning: {
          type: "four-ball-match-play",
          name: "Four-Ball",
          matchCount: 4,
        },
        afternoon: {
          type: "singles-match-play",
          name: "Singles",
          matchCount: 8,
        },
      },
    ],
  },
];

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: "Tournament Details",
    description: "Name and describe your Ryder Cup",
  },
  {
    id: 2,
    title: "Choose Format",
    description: "Select a pre-configured template",
  },
  {
    id: 3,
    title: "Team Setup",
    description: "Create your two competing teams",
  },
  {
    id: 4,
    title: "Review",
    description: "Review and create your tournament",
  },
];

export const RyderCupSetupWizard = () => {
  const navigate = useNavigate();
  const createTour = useCreateTour();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed:", error);
    } finally {
      setIsSigningIn(false);
    }
  };
  const [wizardData, setWizardData] = useState({
    name: "",
    description: "",
    template: 0,
    teamA: { name: "Team USA", color: "#1e40af" },
    teamB: { name: "Team Europe", color: "#dc2626" },
  });

  const selectedTemplate = RYDER_CUP_TEMPLATES[wizardData.template];

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

  const handleCreateTournament = async () => {
    try {
      // Create tournament
      const tour = await createTour.mutateAsync({
        name: wizardData.name,
        description: wizardData.description,
        format: "ryder-cup" as TourFormat,
      });

      // Navigate to the tour page with setup guidance
      navigate(`/tour/${tour.id}?wizard=true`);
    } catch (error) {
      console.error("Failed to create Ryder Cup tournament:", error);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return wizardData.name.trim().length > 0;
      case 2:
        return true; // Template is always valid
      case 3:
        return (
          wizardData.teamA.name.trim().length > 0 &&
          wizardData.teamB.name.trim().length > 0
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Auth gate: show sign-in prompt when not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen">
        <div className="golf-hero-bg safe-area-top">
          <div className="flex items-center p-6">
            <button onClick={() => navigate(-1)} className="nav-back mr-4">
              <svg
                className="w-5 h-5 text-white/50"
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
              <h1 className="text-2xl font-bold text-white">
                Ryder Cup Setup Wizard
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white/5 rounded-2xl shadow-lg border border-white/10 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LogIn className="text-emerald-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Sign in to create a tournament
            </h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              You need to be signed in to create and manage tournaments.
              Sign in with your Google account to get started.
            </p>
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex items-center justify-center gap-3 w-full rounded-xl bg-blue-500 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              <LogIn size={20} />
              {isSigningIn ? "Signing in..." : "Sign in with Google"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="golf-hero-bg safe-area-top">
        <div className="flex items-center p-6">
          <button onClick={() => navigate(-1)} className="nav-back mr-4">
            <svg
              className="w-5 h-5 text-white/50"
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
            <h1 className="text-2xl font-bold text-white">
              Ryder Cup Setup Wizard
            </h1>
            <p className="text-emerald-100 mt-1">
              Step {currentStep} of {WIZARD_STEPS.length}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/5 border-b border-white/10">
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
                        ? "bg-emerald-500 text-white ring-4 ring-emerald-500/30"
                        : "bg-white/10 text-white/40"
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
                          ? "text-white"
                          : "text-white/40"
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all ${
                      currentStep > step.id ? "bg-emerald-500" : "bg-white/10"
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
          {/* Step 1: Tournament Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Tournament Details
                </h2>
                <p className="text-white/50">
                  Give your Ryder Cup tournament a name and description
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Tournament Name *</label>
                <input
                  type="text"
                  value={wizardData.name}
                  onChange={(e) =>
                    setWizardData({ ...wizardData, name: e.target.value })
                  }
                  className="input-field text-lg"
                  placeholder="e.g., Annual Club Championship Ryder Cup"
                  autoFocus
                />
                <p className="form-help">
                  Choose a memorable name for your tournament
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={wizardData.description}
                  onChange={(e) =>
                    setWizardData({
                      ...wizardData,
                      description: e.target.value,
                    })
                  }
                  className="input-field h-32 resize-none"
                  placeholder="Describe your tournament, rules, prizes, or special notes..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Choose Format */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Choose Your Format
                </h2>
                <p className="text-white/50">
                  Select a pre-configured template or customize later
                </p>
              </div>

              <div className="space-y-4">
                {RYDER_CUP_TEMPLATES.map((template, index) => (
                  <label
                    key={index}
                    className={`relative flex items-start p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                      wizardData.template === index
                        ? "border-emerald-500 bg-emerald-500/15 shadow-md"
                        : "border-white/10 bg-white/5 hover:border-white/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={index}
                      checked={wizardData.template === index}
                      onChange={() =>
                        setWizardData({ ...wizardData, template: index })
                      }
                      className="sr-only"
                    />

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-1 transition-all ${
                        wizardData.template === index
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-white/15"
                      }`}
                    >
                      {wizardData.template === index && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {template.name}
                      </h3>
                      <p className="text-white/50 mb-3">
                        {template.description}
                      </p>

                      {/* Template Preview */}
                      <div className="space-y-2">
                        {template.sessions.map((session) => (
                          <div
                            key={session.day}
                            className="bg-white/5 border border-white/10 rounded-lg p-3"
                          >
                            <div className="font-semibold text-sm text-white/70 mb-2">
                              Day {session.day}: {session.dayName}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {session.morning.matchCount > 0 && (
                                <div className="rounded px-2 py-1">
                                  <div className="text-white/50">Morning</div>
                                  <div className="font-semibold text-white">
                                    {session.morning.matchCount}x{" "}
                                    {session.morning.name}
                                  </div>
                                </div>
                              )}
                              {session.afternoon.matchCount > 0 && (
                                <div className="rounded px-2 py-1">
                                  <div className="text-white/50">
                                    Afternoon
                                  </div>
                                  <div className="font-semibold text-white">
                                    {session.afternoon.matchCount}x{" "}
                                    {session.afternoon.name}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-400 mt-0.5"
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
                  <div className="text-sm text-blue-300">
                    <strong>Tip:</strong> These templates provide a starting
                    point. You can always customize the number of matches and
                    format after creating the tournament.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Team Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Team Setup
                </h2>
                <p className="text-white/50">Name your two competing teams</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A */}
                <div className="border-2 border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full"
                      style={{ backgroundColor: wizardData.teamA.color }}
                    />
                    <h3 className="text-lg font-semibold text-white">
                      Team A
                    </h3>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Team Name *</label>
                    <input
                      type="text"
                      value={wizardData.teamA.name}
                      onChange={(e) =>
                        setWizardData({
                          ...wizardData,
                          teamA: { ...wizardData.teamA, name: e.target.value },
                        })
                      }
                      className="input-field"
                      placeholder="e.g., Team USA"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Team Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        "#1e40af",
                        "#059669",
                        "#dc2626",
                        "#7c3aed",
                        "#ea580c",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setWizardData({
                              ...wizardData,
                              teamA: { ...wizardData.teamA, color },
                            })
                          }
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            wizardData.teamA.color === color
                              ? "border-slate-900 ring-2 ring-offset-2 ring-slate-900"
                              : "border-white/15 hover:border-slate-400"
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color} for Team A`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team B */}
                <div className="border-2 border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full"
                      style={{ backgroundColor: wizardData.teamB.color }}
                    />
                    <h3 className="text-lg font-semibold text-white">
                      Team B
                    </h3>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Team Name *</label>
                    <input
                      type="text"
                      value={wizardData.teamB.name}
                      onChange={(e) =>
                        setWizardData({
                          ...wizardData,
                          teamB: { ...wizardData.teamB, name: e.target.value },
                        })
                      }
                      className="input-field"
                      placeholder="e.g., Team Europe"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Team Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        "#dc2626",
                        "#0891b2",
                        "#d97706",
                        "#ec4899",
                        "#10b981",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setWizardData({
                              ...wizardData,
                              teamB: { ...wizardData.teamB, color },
                            })
                          }
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            wizardData.teamB.color === color
                              ? "border-slate-900 ring-2 ring-offset-2 ring-slate-900"
                              : "border-white/15 hover:border-slate-400"
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color} for Team B`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Review Your Tournament
                </h2>
                <p className="text-white/50">
                  Review your settings before creating the tournament
                </p>
              </div>

              <div className="space-y-4">
                {/* Tournament Info */}
                <div className="rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">
                    Tournament Information
                  </h3>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-white/50">Name:</dt>
                      <dd className="font-semibold text-white">
                        {wizardData.name}
                      </dd>
                    </div>
                    {wizardData.description && (
                      <div>
                        <dt className="text-white/50">Description:</dt>
                        <dd className="text-white mt-1">
                          {wizardData.description}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Format Info */}
                <div className="rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">
                    Format Template
                  </h3>
                  <div className="mb-2">
                    <span className="font-semibold text-emerald-400">
                      {selectedTemplate.name}
                    </span>
                    <span className="text-white/50 text-sm ml-2">
                      ({selectedTemplate.description})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedTemplate.sessions.map((session) => (
                      <div
                        key={session.day}
                        className="bg-white/5 border border-white/10 rounded p-3"
                      >
                        <div className="font-semibold text-sm text-white/70 mb-1">
                          Day {session.day}: {session.dayName}
                        </div>
                        <div className="text-sm text-white/50">
                          {session.morning.matchCount > 0 &&
                            `${session.morning.matchCount}x ${session.morning.name}`}
                          {session.morning.matchCount > 0 &&
                            session.afternoon.matchCount > 0 &&
                            " + "}
                          {session.afternoon.matchCount > 0 &&
                            `${session.afternoon.matchCount}x ${session.afternoon.name}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Teams Info */}
                <div className="rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3">Teams</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: wizardData.teamA.color }}
                      />
                      <span className="font-semibold text-white">
                        {wizardData.teamA.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: wizardData.teamB.color }}
                      />
                      <span className="font-semibold text-white">
                        {wizardData.teamB.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps Info */}
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-emerald-400 mt-0.5"
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
                  <div className="text-sm text-emerald-400">
                    <strong>Next Steps:</strong> After creating the tournament,
                    you'll be able to:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Add players to your tournament</li>
                      <li>Assign players to teams and choose captains</li>
                      <li>Create rounds and matches based on your template</li>
                      <li>Set up captain pairings for each session</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6 mt-6 border-t border-white/10">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {currentStep < WIZARD_STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateTournament}
                disabled={createTour.isPending || !isStepValid()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {createTour.isPending
                  ? "Creating Tournament..."
                  : "Create Tournament"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
