import { discoveryFiltersSchema, type DiscoveryFiltersInput } from "@chordially/shared"
import type { DiscoveryFilters } from "@chordially/shared"

interface DiscoverFiltersProps {
  filters: DiscoveryFilters
  onChange: (filters: DiscoveryFilters) => void
}

const sortOptions = discoveryFiltersSchema.shape.sort._def.values as readonly string[]

export function DiscoverFilters({ filters, onChange }: DiscoverFiltersProps) {
  return (
    <div style={containerStyle}>
      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="genre-filter">
          Genre
        </label>
        <select
          id="genre-filter"
          value={filters.genre ?? ""}
          onChange={(e) => onChange({ ...filters, genre: e.target.value || undefined })}
          style={selectStyle}
        >
          <option value="">All genres</option>
          <option value="rock">Rock</option>
          <option value="pop">Pop</option>
          <option value="jazz">Jazz</option>
          <option value="electronic">Electronic</option>
          <option value="hip-hop">Hip Hop</option>
          <option value="classical">Classical</option>
          <option value="folk">Folk</option>
          <option value="r&b">R&amp;B</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="location-filter">
          Location
        </label>
        <input
          id="location-filter"
          type="text"
          placeholder="City or region"
          value={filters.location ?? ""}
          onChange={(e) => onChange({ ...filters, location: e.target.value || undefined })}
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="sort-filter">
          Sort by
        </label>
        <select
          id="sort-filter"
          value={filters.sort ?? "freshness"}
          onChange={(e) =>
            onChange({
              ...filters,
              sort: e.target.value as "freshness" | "activity" | "followers",
            })
          }
          style={selectStyle}
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "flex-end",
  padding: 16,
  background: "#f9f9f9",
  borderRadius: 8,
  marginBottom: 24,
}

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#555",
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
  minWidth: 160,
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
  minWidth: 160,
}
