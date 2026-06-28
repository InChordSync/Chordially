"use client"

interface ChecklistItem {
  key: string
  label: string
  completed: boolean
  actionUrl: string
  actionLabel: string
}

interface SetupChecklistProps {
  items: ChecklistItem[]
}

export function SetupChecklist({ items }: SetupChecklistProps) {
  const completedCount = items.filter((i) => i.completed).length

  return (
    <div>
      <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
        {completedCount} of {items.length} steps completed
      </p>
      <div
        style={{
          height: 8,
          background: "#e0e0e0",
          borderRadius: 4,
          marginBottom: "1.5rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(completedCount / items.length) * 100}%`,
            background: "#1a7f37",
            borderRadius: 4,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              background: item.completed ? "#f6fff6" : "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  background: item.completed ? "#1a7f37" : "#e0e0e0",
                  color: item.completed ? "#fff" : "#888",
                }}
              >
                {item.completed ? "✓" : ""}
              </span>
              <span
                style={{
                  fontWeight: item.completed ? 600 : 400,
                  color: item.completed ? "#1a7f37" : "#333",
                }}
              >
                {item.label}
              </span>
            </div>
            {!item.completed && (
              <a
                href={item.actionUrl}
                style={{
                  fontSize: "0.875rem",
                  color: "#1a7f37",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {item.actionLabel}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
