"use client"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function StepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
}: StepIndicatorProps) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <p style={{ fontWeight: 600, marginBottom: "0.75rem" }}>
        Step {currentStep + 1} of {totalSteps}
      </p>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        {stepLabels.map((label, index) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "0.875rem",
                background:
                  index <= currentStep ? "#1a7f37" : "#e0e0e0",
                color: index <= currentStep ? "#fff" : "#666",
              }}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                color: index === currentStep ? "#000" : "#888",
                fontWeight: index === currentStep ? 600 : 400,
              }}
            >
              {label}
            </span>
            {index < totalSteps - 1 && (
              <div
                style={{
                  width: 24,
                  height: 2,
                  background: index < currentStep ? "#1a7f37" : "#e0e0e0",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
