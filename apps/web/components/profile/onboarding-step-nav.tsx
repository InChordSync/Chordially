"use client"

interface OnboardingStepNavProps {
  steps: string[]
  currentStep: number
  onSaveAndContinue: () => void
  onBack: () => void
  saving: boolean
}

/** Step indicator + save-and-continue controls for the onboarding flow. */
export function OnboardingStepNav({
  steps,
  currentStep,
  onSaveAndContinue,
  onBack,
  saving,
}: OnboardingStepNavProps) {
  const isLast = currentStep === steps.length - 1

  return (
    <nav>
      <ol>
        {steps.map((step, index) => (
          <li key={step} aria-current={index === currentStep ? "step" : undefined}>
            {step}
          </li>
        ))}
      </ol>
      <div>
        {currentStep > 0 && (
          <button type="button" onClick={onBack} disabled={saving}>
            Back
          </button>
        )}
        <button type="button" onClick={onSaveAndContinue} disabled={saving}>
          {saving ? "Saving..." : isLast ? "Finish" : "Save & continue"}
        </button>
      </div>
    </nav>
  )
}
