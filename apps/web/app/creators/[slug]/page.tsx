"use client"

import type { CreatorProfileResponse, FollowCountResponse } from "@chordially/shared"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { CreatorHeader } from "../../../components/creators/CreatorHeader"
import { useAuth } from "../../../lib/auth-context"
import { getCreatorBySlug } from "../../../lib/creator-client"
import { apiFetch } from "../../../lib/api-client"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; profile: CreatorProfileResponse; followCount: FollowCountResponse }

export default function CreatorProfilePage() {
  const params = useParams<{ slug: string }>()
  const { token } = useAuth()
  const [state, setState] = useState<LoadState>({ status: "loading" })

  const load = useCallback(async () => {
    try {
      const [profile, followCount] = await Promise.all([
        getCreatorBySlug(params.slug),
        apiFetch<FollowCountResponse>(`/api/creators/${encodeURIComponent(params.slug)}/follow-count`),
      ])
      setState({ status: "ok", profile, followCount })
    } catch {
      setState({ status: "error", message: "Creator not found" })
    }
  }, [params.slug])

  useEffect(() => {
    load()
  }, [load])

  if (state.status === "loading") {
    return <p>Loading…</p>
  }

  if (state.status === "error") {
    return (
      <div>
        <h1>Not Found</h1>
        <p>{state.message}</p>
      </div>
    )
  }

  const { profile, followCount } = state

  return (
    <main style={{ maxWidth: "48rem", padding: 0 }}>
      <CreatorHeader
        profile={profile}
        followerCount={followCount.followers}
        followingCount={followCount.following}
        token={token}
      />
    </main>
  )
}
