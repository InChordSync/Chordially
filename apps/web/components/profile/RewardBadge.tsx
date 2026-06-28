import React from "react";

interface RewardBadgeProps {
  name: string;
  icon: string;
  unlocked: boolean;
  tier?: "bronze" | "silver" | "gold";
}

const tierColors: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
};

export function RewardBadge({ name, icon, unlocked, tier = "bronze" }: RewardBadgeProps) {
  return (
    <div
      style={{
        opacity: unlocked ? 1 : 0.4,
        border: `2px solid ${tierColors[tier]}`,
        borderRadius: 8,
        padding: "8px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontWeight: 600, color: unlocked ? tierColors[tier] : "#999" }}>
        {name}
      </span>
    </div>
  );
}
