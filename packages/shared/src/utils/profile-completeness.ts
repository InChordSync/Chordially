import type { CreatorProfileResponse } from "../types/creator.js"
import type { FanProfileResponse } from "../types/fan.js"

export interface ProfileCompletenessResult {
  score: number
  missingFields: string[]
}

interface WeightedField {
  key: string
  weight: number
  filled: boolean
}

function computeFromFields(fields: WeightedField[]): ProfileCompletenessResult {
  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0)
  const earnedWeight = fields
    .filter((f) => f.filled)
    .reduce((sum, f) => sum + f.weight, 0)

  const score = Math.round((earnedWeight / totalWeight) * 100)
  const missingFields = fields.filter((f) => !f.filled).map((f) => f.key)

  return { score, missingFields }
}

export const creatorFieldLabels: Record<string, string> = {
  displayName: "Display name",
  bio: "Bio",
  avatarUrl: "Profile photo",
  genre: "Genre",
  location: "Location",
}

export const fanFieldLabels: Record<string, string> = {
  displayName: "Display name",
  avatarUrl: "Profile photo",
  genrePrefs: "Genre preferences",
}

export function computeCreatorCompleteness(
  profile: CreatorProfileResponse
): ProfileCompletenessResult {
  const fields: WeightedField[] = [
    { key: "displayName", weight: 20, filled: !!profile.displayName },
    { key: "bio", weight: 30, filled: !!profile.bio },
    { key: "avatarUrl", weight: 25, filled: !!profile.avatarUrl },
    { key: "genre", weight: 15, filled: !!profile.genre },
    { key: "location", weight: 10, filled: !!profile.location },
  ]

  return computeFromFields(fields)
}

export function computeFanCompleteness(
  profile: FanProfileResponse
): ProfileCompletenessResult {
  const fields: WeightedField[] = [
    { key: "displayName", weight: 30, filled: !!profile.displayName },
    { key: "avatarUrl", weight: 40, filled: !!profile.avatarUrl },
    { key: "genrePrefs", weight: 30, filled: profile.genrePrefs.length > 0 },
  ]

  return computeFromFields(fields)
}

export interface OnboardingRule {
  key: string
  label: string
  description: string
  fields: string[]
}

export const creatorOnboardingRules: OnboardingRule[] = [
  {
    key: "basic_info",
    label: "Basic Info",
    description: "Add your display name and profile photo",
    fields: ["displayName", "avatarUrl"],
  },
  {
    key: "bio",
    label: "Bio",
    description: "Tell fans about yourself",
    fields: ["bio"],
  },
  {
    key: "genre",
    label: "Genre",
    description: "Select your music genre",
    fields: ["genre"],
  },
  {
    key: "location",
    label: "Location",
    description: "Add your location",
    fields: ["location"],
  },
]

export interface OnboardingProgress {
  rules: Array<OnboardingRule & { completed: boolean }>
  completedRules: number
  totalRules: number
  progressPercent: number
  score: number
}

export function computeCreatorOnboardingProgress(
  profile: CreatorProfileResponse
): OnboardingProgress {
  const rules = creatorOnboardingRules.map((rule) => {
    const completed = rule.fields.every((field) => {
      const value = (profile as Record<string, unknown>)[field]
      return value !== null && value !== undefined && value !== ""
    })
    return { ...rule, completed }
  })

  const completedRules = rules.filter((r) => r.completed).length
  const totalRules = rules.length
  const progressPercent = Math.round((completedRules / totalRules) * 100)
  const { score } = computeCreatorCompleteness(profile)

  return { rules, completedRules, totalRules, progressPercent, score }
}
