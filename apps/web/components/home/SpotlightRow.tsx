import type { DiscoveryCreator } from "@chordially/shared"
import { CreatorSpotlightCard } from "./CreatorSpotlightCard"

interface SpotlightRowProps {
  creators: DiscoveryCreator[]
}

export function SpotlightRow({ creators }: SpotlightRowProps) {
  if (creators.length === 0) {
    return null
  }

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>Featured Creators</h2>
      <div style={scrollRowStyle}>
        {creators.map((creator) => (
          <CreatorSpotlightCard key={creator.id} creator={creator} />
        ))}
      </div>
    </section>
  )
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
}

const headingStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 16,
}

const scrollRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  overflowX: "auto",
  paddingBottom: 8,
  scrollSnapType: "x mandatory",
}
