"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"

interface SearchInputProps {
  onSearch: (query: string) => void
  onKeyNav: (direction: "up" | "down") => void
  onSelect: () => void
  onEscape: () => void
  isSearching: boolean
}

export function SearchInput({
  onSearch,
  onKeyNav,
  onSelect,
  onEscape,
  isSearching,
}: SearchInputProps) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value)
    }, 300)
    return () => clearTimeout(timer)
  }, [value, onSearch])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      onKeyNav("down")
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      onKeyNav("up")
    } else if (event.key === "Enter") {
      event.preventDefault()
      onSelect()
    } else if (event.key === "Escape") {
      event.preventDefault()
      setValue("")
      onEscape()
    }
  }

  return (
    <div style={wrapperStyle}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search creators..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        style={inputStyle}
        aria-label="Search creators"
        autoComplete="off"
      />
      {isSearching && <span style={spinnerStyle}>Searching…</span>}
    </div>
  )
}

const wrapperStyle: React.CSSProperties = {
  position: "relative",
  marginBottom: 16,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #ccc",
  outline: "none",
  boxSizing: "border-box",
}

const spinnerStyle: React.CSSProperties = {
  position: "absolute",
  right: 16,
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: 14,
  color: "#888",
}
