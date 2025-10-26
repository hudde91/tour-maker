import { ReactNode } from "react";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  children: ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmit?: () => void;
  isNextDisabled?: boolean;
  isSubmitDisabled?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
}

export const StepWizard = ({
  steps,
  currentStep,
  children,
  onNext,
  onPrevious,
  onSubmit,
  isNextDisabled = false,
  isSubmitDisabled = false,
  isSubmitting = false,
  nextLabel = "Next",
  submitLabel = "Create Round",
}: StepWizardProps) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="relative">
        {/* Mobile: Simple progress bar */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-slate-600">
              {steps[currentStep].title}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop: Full step indicators */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isCompleted ? (
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
                        index + 1
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-sm font-medium ${
                          isActive ? "text-emerald-600" : "text-slate-700"
                        }`}
                      >
                        {step.title}
                      </div>
                      {step.description && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {step.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 mb-8 transition-all ${
                        index < currentStep ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{children}</div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-6 border-t border-slate-200">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrevious}
            className="btn-secondary flex-1 md:flex-initial"
          >
            Previous
          </button>
        )}
        {!isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {nextLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitDisabled || isSubmitting}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
};
