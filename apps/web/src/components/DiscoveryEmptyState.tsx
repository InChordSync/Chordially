import React from "react"

export interface DiscoveryEmptyStateProps {
  query?: string
  activeGenre?: string
  onResetFilters?: () => void
  onSuggestionClick?: (suggestion: string) => void
}

export function DiscoveryEmptyState({
  query = "",
  activeGenre = "",
  onResetFilters,
  onSuggestionClick,
}: DiscoveryEmptyStateProps) {
  const suggestions = ["Pop", "Indie Rock", "Electronic", "Acoustic", "Jazz"]

  return (
    <div className="discovery-empty-state p-8 text-center bg-slate-800/50 rounded-xl border border-slate-700/60 max-w-md mx-auto my-6" data-testid="discovery-empty-state">
      <div className="text-4xl mb-3">🔍</div>
      <h3 className="text-lg font-bold text-white mb-1">No creators found</h3>
      <p className="text-sm text-slate-400 mb-4">
        {query ? `We couldn't find matches for "${query}"` : "No creators match your current filter settings."}
      </p>

      <div className="bg-slate-900/60 p-4 rounded-lg text-left text-xs text-slate-300 space-y-2 mb-4">
        <p className="font-semibold text-slate-200">Refining your search:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li>Check spelling or try broader terms</li>
          <li>Clear active genre or location filters</li>
          <li>Browse trending creators across all genres</li>
        </ul>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2">Try popular genres:</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                data-testid={`suggestion-chip-${suggestion}`}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {onResetFilters && (
        <button
          type="button"
          data-testid="reset-filters-btn"
          onClick={onResetFilters}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors"
        >
          Reset All Filters
        </button>
      )}
    </div>
  )
}
