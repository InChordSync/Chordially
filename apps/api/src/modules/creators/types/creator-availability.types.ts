import type { CreatorProfile } from "./creator.types.js"

/** A window of time a creator is available for bookings, in UTC. */
export interface AvailabilityWindow {
  dayOfWeek: number // 0 (Sunday) - 6 (Saturday)
  startHourUtc: number
  endHourUtc: number
}

/**
 * Extends the base creator profile with multiple genres and availability
 * windows, without changing the existing single `genre` field's meaning.
 */
export interface CreatorProfileWithAvailability extends CreatorProfile {
  genres: string[]
  availabilityWindows: AvailabilityWindow[]
}

export function withAvailability(
  profile: CreatorProfile,
  genres: string[],
  availabilityWindows: AvailabilityWindow[]
): CreatorProfileWithAvailability {
  return { ...profile, genres, availabilityWindows }
}

export function isAvailableAt(
  profile: CreatorProfileWithAvailability,
  dayOfWeek: number,
  hourUtc: number
): boolean {
  return profile.availabilityWindows.some(
    (w) =>
      w.dayOfWeek === dayOfWeek &&
      hourUtc >= w.startHourUtc &&
      hourUtc < w.endHourUtc
  )
}
