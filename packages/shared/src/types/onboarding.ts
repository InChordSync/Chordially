export interface OnboardingStepResponse {
  stepKey: string
  label: string
  completed: boolean
}

export interface OnboardingResponse {
  steps: OnboardingStepResponse[]
  completenessScore: number
}
