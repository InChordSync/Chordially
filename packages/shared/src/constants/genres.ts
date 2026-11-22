export const CREATOR_GENRES = [
  "Hip-Hop",
  "Pop",
  "Electronic",
  "Rock",
  "Jazz",
  "Indie Rock",
  "Acoustic",
] as const

export type CreatorGenre = (typeof CREATOR_GENRES)[number]
