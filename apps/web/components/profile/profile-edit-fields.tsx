"use client"

interface ProfileEditFieldsProps {
  bio: string
  genre: string
  location: string
  onChange: (fields: { bio: string; genre: string; location: string }) => void
}

/**
 * The core bio/genre/location fields shared by the web profile edit page
 * and onboarding flow, kept separate from form submission so both can
 * reuse the same inputs.
 */
export function ProfileEditFields({
  bio,
  genre,
  location,
  onChange,
}: ProfileEditFieldsProps) {
  const update = (field: "bio" | "genre" | "location", value: string) =>
    onChange({ bio, genre, location, [field]: value })

  return (
    <fieldset>
      <label>
        Bio
        <textarea value={bio} onChange={(e) => update("bio", e.target.value)} maxLength={300} />
        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{bio.length}/300 characters</span>
      </label>
      <label>
        Genre
        <input value={genre} onChange={(e) => update("genre", e.target.value)} maxLength={50} />
      </label>
      <label>
        Location
        <input value={location} onChange={(e) => update("location", e.target.value)} maxLength={100} />
      </label>
    </fieldset>
  )
}
