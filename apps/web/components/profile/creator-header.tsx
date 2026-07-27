interface CreatorHeaderProps {
  displayName: string
  avatarUrl: string | null
  bannerUrl: string | null
  isVerified: boolean
}

/** Public profile page header: banner image with avatar/name overlaid. */
export function CreatorHeader({
  displayName,
  avatarUrl,
  bannerUrl,
  isVerified,
}: CreatorHeaderProps) {
  return (
    <header>
      <div
        style={{
          height: 160,
          background: bannerUrl ? `url(${bannerUrl}) center/cover` : "#e5e5e5",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${displayName}'s avatar`}
            width={72}
            height={72}
            style={{ borderRadius: "50%", marginTop: -36 }}
          />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ccc", marginTop: -36 }} />
        )}
        <h1>
          {displayName}
          {isVerified && <span title="Verified"> ✓</span>}
        </h1>
      </div>
    </header>
  )
}
