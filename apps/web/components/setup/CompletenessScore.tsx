"use client"

interface CompletenessScoreProps {
  score: number
}

export function CompletenessScore({ score }: CompletenessScoreProps) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color = score >= 80 ? "#1a7f37" : score >= 50 ? "#f5a623" : "#b00020"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        padding: "2rem",
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        background: "#fafafa",
      }}
    >
      <svg width={120} height={120}>
        <circle
          cx={60}
          cy={60}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={8}
        />
        <circle
          cx={60}
          cy={60}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text
          x={60}
          y={60}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={24}
          fontWeight={700}
          fill={color}
        >
          {score}%
        </text>
      </svg>
      <p style={{ margin: 0, fontWeight: 600, color }}>
        Profile Completeness
      </p>
    </div>
  )
}
