import {
  computeCreatorCompleteness,
  creatorFieldLabels,
  type CreatorProfileResponse,
} from "@chordially/shared"

interface ProfileCompletenessWidgetProps {
  profile: CreatorProfileResponse
}

/** Dashboard-shell widget showing profile completeness and what's missing. */
export function ProfileCompletenessWidget({
  profile,
}: ProfileCompletenessWidgetProps) {
  const { score, missingFields } = computeCreatorCompleteness(profile)

  return (
    <div>
      <p>Profile {score}% complete</p>
      {missingFields.length > 0 && (
        <ul>
          {missingFields.map((field) => (
            <li key={field}>{creatorFieldLabels[field] ?? field}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
