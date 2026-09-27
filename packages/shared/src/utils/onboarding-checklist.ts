import type { CreatorProfileResponse } from "../types/creator.js"
import { computeCreatorCompleteness, creatorFieldLabels } from "./profile-completeness.js"

/** A single remaining item in a creator's onboarding checklist. */
export interface OnboardingChecklistItem {
  field: string
  label: string
}

/**
 * Builds the cross-app onboarding checklist (used by both web and mobile)
 * from the same completeness scoring already used for the profile widget,
 * so "what's left" stays consistent everywhere it's shown.
 */
export function buildOnboardingChecklist(
  profile: CreatorProfileResponse
): OnboardingChecklistItem[] {
  const { missingFields } = computeCreatorCompleteness(profile)

  return missingFields.map((field) => ({
    field,
    label: creatorFieldLabels[field] ?? field,
  }))
}

export function isOnboardingComplete(profile: CreatorProfileResponse): boolean {
  return buildOnboardingChecklist(profile).length === 0
}
