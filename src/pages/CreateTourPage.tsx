import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useCreateTour } from "../hooks/useTours";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { TourFormat, Player } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { PlayerProfileSetup } from "../components/profile/PlayerProfileSetup";
import { PlayerSelectionStep } from "../components/players/PlayerSelectionStep";

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
    title: "Add players",
    description: "Add players to your tournament",
  },
];

const RYDER_CUP_ADVANCED_STEPS: WizardStep[] = [
  {
    id: 1,
    title: "Competition Format",
    description: "Choose your tournament style",
  },
  {
    id: 2,
    title: "Setup Type",
    description: "Choose your setup preference",
  },
  {
    id: 3,
    title: "Tournament Name",
    description: "Give your tournament a name",
  },
  {
    id: 4,
    title: "Add players",
    description: "Add players to your tournament",
  },
];

export const CreateTourPage = () => {
  useDocumentTitle("Create Tournament");
  const navigate = useNavigate();
  const createTour = useCreateTour();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { data: userProfile, refetch: refetchProfile } = useUserProfile(user?.uid || null);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    format: "individual" as TourFormat,
  });
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [isRyderCupAdvanced, setIsRyderCupAdvanced] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
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

  // Get wizard steps based on format
  const wizardSteps =
    formData.format === "ryder-cup" && isRyderCupAdvanced
      ? RYDER_CUP_ADVANCED_STEPS
      : formData.format === "ryder-cup"
      ? RYDER_CUP_ADVANCED_STEPS.slice(0, 2) // Only show first 2 steps initially for Ryder Cup
      : WIZARD_STEPS;

  // Check if user needs to set up profile when reaching player selection step
  useEffect(() => {
    const isPlayerStep =
      (currentStep === 3 && (formData.format !== "ryder-cup" || !isRyderCupAdvanced)) ||
      (currentStep === 4 && formData.format === "ryder-cup" && isRyderCupAdvanced);

    if (isPlayerStep && user && !userProfile) {
      setShowProfileSetup(true);
    }
  }, [currentStep, user, userProfile, formData.format, isRyderCupAdvanced]);

  const handleNext = () => {
    if (currentStep < wizardSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Prepare the player list
      let players = [...selectedPlayers];

      // If user is logged in and has a profile, add them as a player automatically
      if (user && userProfile) {
        const userAlreadyAdded = players.some(
          (p) => p.userId === user.uid || p.name.toLowerCase() === userProfile.playerName.toLowerCase()
        );

        if (!userAlreadyAdded) {
          const currentUserPlayer: Player = {
            id: userProfile.playerId,
            name: userProfile.playerName,
            handicap: userProfile.handicap,
            userId: user.uid,
          };
          players = [currentUserPlayer, ...players]; // Add current user at the beginning
        }
      }

      const tourData = {
        ...formData,
        players,
      };
      const tour = await createTour.mutateAsync(tourData);
      navigate(`/tour/${tour.id}`);
    } catch (error) {
      console.error("Failed to create tournament:", error);
    }
  };

  const handleAddPlayer = (player: Player) => {
    if (!selectedPlayers.find((p) => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return true; // Format is always selected
      case 2:
        if (formData.format === "ryder-cup") {
          return true; // Setup type selection is always valid
        }
        return formData.name.trim().length > 0; // Name required for other formats
      case 3:
        if (formData.format === "ryder-cup" && isRyderCupAdvanced) {
          return formData.name.trim().length > 0; // Name required for Ryder Cup advanced
        }
        return selectedPlayers.length > 0; // At least one player required for other formats
      case 4:
        return selectedPlayers.length > 0; // At least one player required for Ryder Cup advanced
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
      popular: false,
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
                Create Tournament
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="card-elevated p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ border: "1px solid rgba(16, 185, 129, 0.2)" }}>
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
              className="flex items-center justify-center gap-3 w-full rounded-xl px-6 py-4 text-lg font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.7), rgba(37, 99, 235, 0.8))",
                border: "1px solid rgba(96, 165, 250, 0.3)",
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.2), 0 8px 24px rgba(0, 0, 0, 0.3)",
              }}
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
          <button onClick={handleBack} className="nav-back mr-4">
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
              {wizardSteps[currentStep - 1]?.title || "Create Tournament"}
            </h1>
            <p className="text-emerald-100 mt-1">
              Step {currentStep} of {wizardSteps.length}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div>
          {/* Step 1: Competition Format */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                {tournamentFormats.map((format) => (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        format: format.value as TourFormat,
                      });
                      handleNext();
                    }}
                    className="relative flex items-start p-6 border-2 rounded-xl transition-all hover:shadow-md border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-left w-full"
                    data-testid={`format-${format.value}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-white/5 text-white/50">
                          {format.icon}
                        </div>

                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {format.name}
                          </h3>

                          {format.popular && (
                            <span className="bg-blue-500/15 text-blue-400 text-xs px-2 py-1 rounded-full font-semibold border border-blue-500/30">
                              Popular
                            </span>
                          )}

                          {format.premium && (
                            <span className="bg-amber-500/15 text-amber-400 text-xs px-2 py-1 rounded-full font-semibold border border-amber-500/30">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-white/50 leading-relaxed">
                        {format.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Ryder Cup Setup Type OR Tournament Name */}
          {currentStep === 2 && formData.format === "ryder-cup" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => navigate("/create/ryder-cup-wizard")}
                  className="relative flex items-start p-6 border-2 rounded-xl transition-all hover:shadow-md border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-left w-full"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          Setup Wizard
                        </h3>
                        <span className="bg-blue-500/15 text-blue-400 text-xs px-2 py-1 rounded-full font-semibold border border-blue-500/30">
                          Recommended
                        </span>
                      </div>
                    </div>
                    <p className="text-white/50 leading-relaxed">
                      Guided step-by-step wizard with pre-filled templates and helpful tips. Perfect for first-time Ryder Cup setup.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRyderCupAdvanced(true);
                    handleNext();
                  }}
                  className="relative flex items-start p-6 border-2 rounded-xl transition-all hover:shadow-md border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-left w-full"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-white/5 text-white/50">
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        Advanced Setup
                      </h3>
                    </div>
                    <p className="text-white/50 leading-relaxed">
                      Manual setup with complete control over team captains, player selection, and competition formats. For experienced users.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Tournament Name (for Ryder Cup Advanced) */}
          {currentStep === 3 && formData.format === "ryder-cup" && isRyderCupAdvanced && (
            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  name="tournamentName"
                  data-testid="tournament-name-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field text-lg"
                  placeholder="e.g., Weekend Ryder Cup"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  name="tournamentDescription"
                  data-testid="tournament-description-input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="input-field h-32 resize-none"
                  placeholder="Describe your tournament, rules, prizes, or special notes..."
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Add players
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Tournament Name (for non-Ryder Cup formats) */}
          {currentStep === 2 && formData.format !== "ryder-cup" && (
            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Name *</label>
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
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  name="tournamentDescription"
                  data-testid="tournament-description-input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="input-field h-32 resize-none"
                  placeholder="Describe your tournament, rules, prizes, or special notes..."
                />
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Add players
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Add Players (for Ryder Cup Advanced) */}
          {currentStep === 4 && formData.format === "ryder-cup" && isRyderCupAdvanced && (
            <PlayerSelectionStep
              selectedPlayers={selectedPlayers}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onSubmit={handleSubmit}
              submitLabel="Create Tournament"
              isSubmitting={createTour.isPending}
              isValid={isStepValid()}
            />
          )}

          {/* Step 3: Add Players (for non-Ryder Cup formats) */}
          {currentStep === 3 && (formData.format !== "ryder-cup" || !isRyderCupAdvanced) && (
            <PlayerSelectionStep
              selectedPlayers={selectedPlayers}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onSubmit={handleSubmit}
              submitLabel="Create Tournament"
              isSubmitting={createTour.isPending}
              isValid={isStepValid()}
            />
          )}
        </div>
      </div>

      {/* Player Profile Setup Modal */}
      {user && showProfileSetup && (
        <PlayerProfileSetup
          userId={user.uid}
          userName={user.displayName || ""}
          isOpen={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
          onComplete={async () => {
            await refetchProfile();
            setShowProfileSetup(false);
          }}
        />
      )}
    </div>
  );
};
