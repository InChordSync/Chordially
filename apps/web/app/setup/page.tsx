"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import type { CreatorProfileResponse } from "@chordially/shared"
import { computeCreatorCompleteness } from "@chordially/shared"
import { CompletenessScore } from "../../components/setup/CompletenessScore"
import { SetupChecklist } from "../../components/setup/SetupChecklist"
import { useAuth } from "../../lib/auth-context"
import { getMe } from "../../lib/user-client"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; profile: CreatorProfileResponse }

export default function SetupPage() {
  const { token } = useAuth()
  const [state, setState] = useState<LoadState>({ status: "loading" })

  const load = useCallback(async () => {
    if (!token) return
    try {
      const me = await getMe(token)
      const profile = me.user.creatorProfile
      if (!profile) {
        setState({ status: "error", message: "Creator profile not found" })
        return
      }
      setState({ status: "ok", profile })
    } catch {
      setState({ status: "error", message: "Failed to load profile" })
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  if (!token) {
    return (
      <main>
        <p>Please log in to view your setup progress.</p>
      </main>
    )
  }

  if (state.status === "loading") {
    return (
      <main>
        <p>Loading…</p>
      </main>
    )
  }

  if (state.status === "error") {
    return (
      <main>
        <p role="alert">{state.message}</p>
      </main>
    )
  }

  const { profile } = state
  const { score, missingFields } = computeCreatorCompleteness(profile)

  const checklistItems = [
    {
      key: "avatarUrl",
      label: "Upload Profile Photo",
      completed: !missingFields.includes("avatarUrl"),
      actionUrl: "/onboarding",
      actionLabel: "Upload Photo",
    },
    {
      key: "bio",
      label: "Write Your Bio",
      completed: !missingFields.includes("bio"),
      actionUrl: "/profile/edit",
      actionLabel: "Write Bio",
    },
    {
      key: "genre",
      label: "Set Your Genre",
      completed: !missingFields.includes("genre"),
      actionUrl: "/profile/edit",
      actionLabel: "Set Genre",
    },
    {
      key: "location",
      label: "Add Your Location",
      completed: !missingFields.includes("location"),
      actionUrl: "/profile/edit",
      actionLabel: "Add Location",
    },
    {
      key: "media",
      label: "Add Media to Your Gallery",
      completed: false,
      actionUrl: "/profile/media",
      actionLabel: "Add Media",
    },
  ]

  const allComplete = checklistItems.every((i) => i.completed)

  return (
    <main>
      <h1>Creator Setup</h1>

      <div style={{ marginBottom: "2rem" }}>
        <CompletenessScore score={score} />
      </div>

      <SetupChecklist items={checklistItems} />

      {allComplete && (
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Link
            href={`/creators/${profile.slug}`}
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              background: "#1a7f37",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Go to Profile
          </Link>
        </div>
      )}
    </main>
  )
}
