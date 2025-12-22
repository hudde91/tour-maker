import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTour } from "../hooks/useTours";
import { TourFormat, Player } from "../types";
import { getTours } from "../lib/storage/tours";

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
  const navigate = useNavigate();
  const createTour = useCreateTour();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    format: "individual" as TourFormat,
  });
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [previousPlayers, setPreviousPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isRyderCupAdvanced, setIsRyderCupAdvanced] = useState(false);

  // Get wizard steps based on format
  const wizardSteps =
    formData.format === "ryder-cup" && isRyderCupAdvanced
      ? RYDER_CUP_ADVANCED_STEPS
      : formData.format === "ryder-cup"
      ? RYDER_CUP_ADVANCED_STEPS.slice(0, 2) // Only show first 2 steps initially for Ryder Cup
      : WIZARD_STEPS;

  // Load previously played with players
  useEffect(() => {
    const tours = getTours();
    const playerMap = new Map<string, Player>();

    tours.forEach((tour) => {
      tour.players.forEach((player) => {
        // Use player name as key to avoid duplicates
        if (!playerMap.has(player.name.toLowerCase())) {
          playerMap.set(player.name.toLowerCase(), {
            id: crypto.randomUUID(), // Generate new ID for new tournament
            name: player.name,
            handicap: player.handicap,
          });
        }
      });
    });

    setPreviousPlayers(Array.from(playerMap.values()));
  }, []);

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
      const tourData = {
        ...formData,
        players: selectedPlayers,
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

  const handleAddNewPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: newPlayerName.trim(),
      };
      setSelectedPlayers([...selectedPlayers, newPlayer]);
      setNewPlayerName("");
    }
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="golf-hero-bg safe-area-top">
        <div className="flex items-center p-6">
          <button onClick={handleBack} className="nav-back mr-4">
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
                    className="relative flex items-start p-6 border-2 rounded-xl transition-all hover:shadow-md border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 text-left w-full"
                    data-testid={`format-${format.value}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
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
                  className="relative flex items-start p-6 border-2 rounded-xl transition-all hover:shadow-md border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 text-left w-full"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
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
                        <h3 className="text-lg font-semibold text-slate-900">
                          Setup Wizard
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold border border-blue-200">
                          Recommended
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
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
                  className="relative flex items-start p-6 border-2 rounded-xl transition-all hover:shadow-md border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 text-left w-full"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
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
                      <h3 className="text-lg font-semibold text-slate-900">
                        Advanced Setup
                      </h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
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

              <div className="flex gap-4 pt-6 border-t border-slate-200">
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

              <div className="flex gap-4 pt-6 border-t border-slate-200">
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
            <div className="space-y-6">
              {/* Selected Players */}
              {selectedPlayers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Selected Players ({selectedPlayers.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">
                            {player.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Player */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Add New Player
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddNewPlayer();
                      }
                    }}
                    className="input-field flex-1"
                    placeholder="Enter player name"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewPlayer}
                    disabled={!newPlayerName.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Previously Played With */}
              {previousPlayers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Previously Played With
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {previousPlayers
                      .filter(
                        (p) => !selectedPlayers.find((sp) => sp.name === p.name)
                      )
                      .map((player) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => handleAddPlayer(player)}
                          className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-sm">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {player.name}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStepValid() || createTour.isPending}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="submit-tournament-button"
                >
                  {createTour.isPending ? "Creating..." : "Create Tournament"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Add Players (for non-Ryder Cup formats) */}
          {currentStep === 3 && (formData.format !== "ryder-cup" || !isRyderCupAdvanced) && (
            <div className="space-y-6">
              {/* Selected Players */}
              {selectedPlayers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Selected Players ({selectedPlayers.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">
                            {player.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Player */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Add New Player
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddNewPlayer();
                      }
                    }}
                    className="input-field flex-1"
                    placeholder="Enter player name"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewPlayer}
                    disabled={!newPlayerName.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Previously Played With */}
              {previousPlayers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Previously Played With
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {previousPlayers
                      .filter(
                        (p) => !selectedPlayers.find((sp) => sp.name === p.name)
                      )
                      .map((player) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => handleAddPlayer(player)}
                          className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-sm">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {player.name}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStepValid() || createTour.isPending}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="submit-tournament-button"
                >
                  {createTour.isPending ? "Creating..." : "Create Tournament"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
