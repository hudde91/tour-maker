import { useState, useEffect } from "react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal = ({ isOpen, onClose }: HowItWorksModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const steps = [
    {
      icon: "⛳",
      title: "Create a Tournament",
      description:
        "Start by creating a tournament. Choose between Individual, Team, or Ryder Cup formats to match your competition style.",
    },
    {
      icon: "👥",
      title: "Add Players & Teams",
      description:
        "Invite players to your tournament. For team formats, organize players into teams and assign captains to lead the way.",
    },
    {
      icon: "📋",
      title: "Create Rounds",
      description:
        "Add rounds with different play formats like Stroke Play, Match Play, Scramble, and more. Each round can have its own scoring rules.",
    },
    {
      icon: "🎯",
      title: "Score as You Play",
      description:
        "Enter scores hole-by-hole with our intuitive swipeable interface. Scores update in real-time on the leaderboard for all players to see.",
    },
    {
      icon: "🏆",
      title: "Track & Share",
      description:
        "View live leaderboards, share tournament links with friends, and celebrate winners when the tournament completes!",
    },
  ];

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div
        className="rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto overscroll-contain sm:pb-0 border border-white/10"
        style={{ background: "rgba(15, 23, 42, 0.95)" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 border-b border-white/10 px-6 py-4 rounded-t-2xl"
          style={{ background: "rgba(15, 23, 42, 0.98)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              How Tour Maker Works
            </h2>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/50 transition-colors"
              aria-label="Close modal"
            >
              <span className="sr-only">Close</span>
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon & Title */}
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">{currentStepData.icon}</div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {currentStepData.title}
            </h3>
            <p className="text-white/50 text-lg leading-relaxed">
              {currentStepData.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-white/10 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? "text-white/30 cursor-not-allowed"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              Previous
            </button>

            <span className="text-sm text-white/40">
              {currentStep + 1} of {steps.length}
            </span>

            <button onClick={handleNext} className="btn-primary">
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
