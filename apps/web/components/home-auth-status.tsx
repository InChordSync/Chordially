"use client"

import Link from "next/link"
import { useAuth } from "../lib/auth-context"

export function HomeAuthStatus() {
  const { user, isLoading, logout } = useAuth()

  if (isLoading) {
    return <p aria-live="polite">Checking session…</p>
  }

  if (!user) {
    return (
      <p>
        <Link href="/login">Log in</Link> or{" "}
        <Link href="/register">create an account</Link> to get started.
      </p>
    )
  }

  return (
    <div>
      <p>You are logged in as {user.email}.</p>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </div>
  )
}
