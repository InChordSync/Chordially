import type { CreatorResponse } from "../types/creator.types.js"

export type OnboardingStep =
  | "display-name"
  | "bio"
  | "avatar"
  | "genre"
  | "location"
  | "complete"

const STEP_ORDER: { step: OnboardingStep; isDone: (p: CreatorResponse) => boolean }[] = [
  { step: "display-name", isDone: (p) => Boolean(p.displayName) },
  { step: "bio", isDone: (p) => Boolean(p.bio) },
  { step: "avatar", isDone: (p) => Boolean(p.avatarUrl) },
  { step: "genre", isDone: (p) => Boolean(p.genre) },
  { step: "location", isDone: (p) => Boolean(p.location) },
]

/**
 * Resolves which onboarding step an interrupted session should resume at,
 * by walking the steps in order and stopping at the first incomplete one.
 */
export function resolveResumeStep(profile: CreatorResponse): OnboardingStep {
  const next = STEP_ORDER.find((entry) => !entry.isDone(profile))
  return next ? next.step : "complete"
}
