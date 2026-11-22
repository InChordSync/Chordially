"use client"

import type { CreatorProfileResponse } from "@chordially/shared"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { CreatorHeader } from "../../../components/profile/creator-header"
import { getCreatorBySlug } from "../../../lib/creator-client"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; profile: CreatorProfileResponse }

export default function CreatorProfilePage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    setState({ status: "loading" })

    async function load() {
      try {
        const profile = await getCreatorBySlug(slug, controller.signal)
        if (!active || controller.signal.aborted) return
        setState({ status: "ok", profile })
      } catch (error) {
        if (!active || controller.signal.aborted) return
        if (error instanceof DOMException && error.name === "AbortError") return
        setState({ status: "error", message: "Creator not found" })
      }
    }

    void load()

    return () => {
      active = false
      controller.abort()
    }
  }, [slug])

  if (state.status === "loading") {
    return (
      <main>
        <p role="status">Loading…</p>
      </main>
    )
  }

  if (state.status === "error") {
    return (
      <main>
        <h1>Not Found</h1>
        <p>{state.message}</p>
      </main>
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
