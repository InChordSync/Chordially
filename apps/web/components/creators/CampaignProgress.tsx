"use client";
import React from "react";

interface CampaignProgressProps {
  title: string;
  goal: number;
  current: number;
  deadline: string;
}

export function CampaignProgress({ title, goal, current, deadline }: CampaignProgressProps) {
  const percent = Math.min(100, Math.round((current / goal) * 100));
  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;

  return (
    <div>
      <h3>{title}</h3>
      <div style={{ background: "#eee", borderRadius: 4, height: 12, overflow: "hidden" }}>
        <div
          style={{
            width: `${percent}%`,
            background: percent >= 100 ? "#22c55e" : "#6366f1",
            height: "100%",
          }}
        />
      </div>
      <p>{current} / {goal} XLM ({percent}%)</p>
      <p style={{ color: isExpired ? "#ef4444" : "#6b7280" }}>
        {isExpired ? "Campaign ended" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
      </p>
    </div>
  );
}
