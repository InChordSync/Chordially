/** Placeholder shown while a creator profile is loading. */
export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile">
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#eee" }} />
      <div style={{ width: 160, height: 20, background: "#eee", marginTop: 12 }} />
      <div style={{ width: 240, height: 14, background: "#eee", marginTop: 8 }} />
    </div>
  )
}

interface ProfileErrorStateProps {
  message?: string
  onRetry?: () => void
}

/** Shown when a creator profile fails to load. */
export function ProfileErrorState({
  message = "We couldn't load this profile.",
  onRetry,
}: ProfileErrorStateProps) {
  return (
    <div role="alert">
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  )
}
