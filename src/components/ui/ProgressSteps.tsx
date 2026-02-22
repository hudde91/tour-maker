interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

// TODO: This is not used, implement where needed
export const ProgressSteps = ({
  steps,
  currentStep,
  onStepClick,
  className = "",
}: ProgressStepsProps) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/70">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-white/40">
            {steps[currentStep].label}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Desktop: Full Steps */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = onStepClick && index <= currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => isClickable && onStepClick(index)}
                    disabled={!isClickable}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      transition-all duration-200
                      ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-200"
                          : "bg-white/10 text-white/40"
                      }
                      ${
                        isClickable
                          ? "cursor-pointer hover:scale-110"
                          : "cursor-default"
                      }
                    `}
                  >
                    {isCompleted ? (
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>

                  <div className="mt-2 text-center max-w-[120px]">
                    <div
                      className={`text-sm font-medium ${
                        isCurrent
                          ? "text-emerald-400"
                          : isCompleted
                          ? "text-white/70"
                          : "text-white/40"
                      }`}
                    >
                      {step.label}
                    </div>
                    {step.description && (
                      <div className="text-xs text-white/40 mt-1">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-all duration-300 ${
                      index < currentStep ? "bg-emerald-600" : "bg-white/10"
                    }`}
                    style={{ marginTop: "-40px" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
