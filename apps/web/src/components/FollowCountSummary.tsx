import React from "react"

export interface FollowCountSummaryProps {
  followersCount: number
  followingCount: number
  compact?: boolean
  onClickFollowers?: () => void
  onClickFollowing?: () => void
}

export function FollowCountSummary({
  followersCount,
  followingCount,
  compact = false,
  onClickFollowers,
  onClickFollowing,
}: FollowCountSummaryProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`
    return num.toLocaleString()
  }

  return (
    <div
      data-testid="follow-count-summary"
      className={`flex items-center gap-4 text-sm font-medium ${
        compact ? "text-xs space-x-2" : "text-slate-300"
      }`}
    >
      <button
        type="button"
        data-testid="followers-stat-btn"
        onClick={onClickFollowers}
        className="hover:underline focus:outline-none flex items-center gap-1"
      >
        <span className="font-bold text-white" data-testid="followers-count-val">
          {formatNumber(followersCount)}
        </span>
        <span className="text-slate-400">followers</span>
      </button>

      <span className="text-slate-600">•</span>

      <button
        type="button"
        data-testid="following-stat-btn"
        onClick={onClickFollowing}
        className="hover:underline focus:outline-none flex items-center gap-1"
      >
        <span className="font-bold text-white" data-testid="following-count-val">
          {formatNumber(followingCount)}
        </span>
        <span className="text-slate-400">following</span>
      </button>
    </div>
  )
}
