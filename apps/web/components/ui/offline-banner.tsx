"use client";

import { useNetworkState } from "../../lib/use-network-state";

export function OfflineBanner() {
  const isOnline = useNetworkState();
  if (isOnline) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: "#7c3aed",
        color: "#fff",
        textAlign: "center",
        padding: "10px 16px",
        fontSize: "0.875rem",
        fontWeight: 600,
      }}
    >
      You're offline. Tip submissions are paused until your connection is restored.
    </div>
  );
}
