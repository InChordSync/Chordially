import { onboardingRepository } from "../repositories/onboarding.repository.js"
import { ONBOARDING_STEPS } from "../types/onboarding.types.js"
import { creatorService } from "../../creators/services/creator.service.js"
import { fanService } from "../../fans/services/fan.service.js"
import type { OnboardingStepResponse, OnboardingResponse } from "@chordially/shared"

const CREATOR_STEP_KEYS = [
  "displayName",
  "avatarUrl",
  "bio",
  "genre",
  "location",
  "tags",
  "bannerUrl",
]

const FAN_STEP_KEYS = ["displayName", "avatarUrl", "genrePrefs"]

function getStepKeys(hasCreator: boolean, hasFan: boolean): string[] {
  const keys = new Set<string>()
  if (hasCreator) {
    for (const k of CREATOR_STEP_KEYS) keys.add(k)
  }
  if (hasFan) {
    for (const k of FAN_STEP_KEYS) keys.add(k)
  }
  return Array.from(keys)
}

export const onboardingService = {
  async seedSteps(userId: string): Promise<void> {
    const [creatorProfile, fanProfile] = await Promise.all([
      creatorService.findByUserId(userId),
      fanService.findByUserId(userId),
    ])

    const stepKeys = getStepKeys(!!creatorProfile, !!fanProfile)
    if (stepKeys.length > 0) {
      await onboardingRepository.createSteps(userId, stepKeys)
    }
  },

  async getOnboarding(userId: string): Promise<OnboardingResponse> {
    const [steps, creatorProfile, fanProfile] = await Promise.all([
      onboardingRepository.findByUserId(userId),
      creatorService.findByUserId(userId),
      fanService.findByUserId(userId),
    ])

    if (steps.length === 0) {
      const hasCreator = !!creatorProfile
      const hasFan = !!fanProfile
      const keys = getStepKeys(hasCreator, hasFan)
      if (keys.length > 0) {
        const seeded = await onboardingRepository.createSteps(userId, keys)
        return buildResponse(seeded, creatorProfile, fanProfile)
      }
      return { steps: [], completenessScore: 0 }
    }

    return buildResponse(steps, creatorProfile, fanProfile)
  },

  async getResume(userId: string): Promise<{ currentStep: string }> {
    const result = await this.getOnboarding(userId)
    const firstIncomplete = result.steps.find((s) => !s.completed)
    return { currentStep: firstIncomplete?.stepKey ?? "complete" }
  },

  async markComplete(
    userId: string,
    stepKey: string
  ): Promise<OnboardingStepResponse> {
    await onboardingRepository.markCompleted(userId, stepKey)
    return {
      stepKey,
      label: ONBOARDING_STEPS[stepKey]?.label ?? stepKey,
      completed: true,
    }
  },

  async markCompleted(
    userId: string,
    stepKey: string
  ): Promise<OnboardingStepResponse> {
    return this.markComplete(userId, stepKey)
  },
}

function buildResponse(
  steps: { stepKey: string; completed: boolean }[],
  creatorProfile: { displayName: string | null; bio: string | null; avatarUrl: string | null; genre: string | null; location: string | null; bannerUrl: string | null } | null,
  fanProfile: { displayName: string | null; avatarUrl: string | null; genrePrefs: string[] } | null
): OnboardingResponse {
  const isCreator = !!creatorProfile
  const isFan = !!fanProfile

  const filteredSteps = steps.filter((step) => {
    if (step.stepKey === "bannerUrl" || step.stepKey === "location" || step.stepKey === "tags") {
      return isCreator
    }
    if (step.stepKey === "genrePrefs") {
      return isFan
    }
    return true
  })

  const stepResponses: OnboardingStepResponse[] = filteredSteps.map((step) => ({
    stepKey: step.stepKey,
    label: ONBOARDING_STEPS[step.stepKey]?.label ?? step.stepKey,
    completed: step.completed,
  }))

  const total = filteredSteps.length
  const completed = filteredSteps.filter((s) => s.completed).length
  const completenessScore = total > 0 ? Math.round((completed / total) * 100) : 0

  return { steps: stepResponses, completenessScore }
}
