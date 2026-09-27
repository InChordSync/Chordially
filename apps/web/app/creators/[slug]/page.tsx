"use client"

import type { CreatorProfileResponse } from "@chordially/shared"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { CreatorHeader } from "../../../components/profile/creator-header"
import { getCreatorBySlug } from "../../../lib/creator-client"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; profile: CreatorProfileResponse }

export default function CreatorProfilePage() {
  const params = useParams<{ slug: string }>()
  const [state, setState] = useState<LoadState>({ status: "loading" })

  const load = useCallback(async () => {
    try {
      const profile = await getCreatorBySlug(params.slug)
      setState({ status: "ok", profile })
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

  const { profile } = state

  return (
    <main>
      <CreatorHeader
        displayName={profile.displayName}
        avatarUrl={profile.avatarUrl}
        bannerUrl={null}
        isVerified={profile.isVerified}
      />

      {profile.bio && <p>{profile.bio}</p>}

      <dl>
        {profile.genre && (
          <>
            <dt>Genre</dt>
            <dd>{profile.genre}</dd>
          </>
        )}
        {profile.location && (
          <>
            <dt>Location</dt>
            <dd>{profile.location}</dd>
          </>
        )}
      </dl>
    </main>
  )
}
