"use client"

import { useCallback, useEffect, useState } from "react"
import type { MeResponse } from "@chordially/shared"
import { useRouter } from "next/navigation"
import { useAuth } from "../../../lib/auth-context"
import { getMe } from "../../../lib/user-client"
import { EditProfileForm } from "../../../components/profile/edit-profile-form"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: MeResponse }

export default function EditProfilePage() {
  const router = useRouter()
  const { token, isLoading } = useAuth()
  const [state, setState] = useState<LoadState>({ status: "loading" })

  const load = useCallback(async () => {
    if (!token) return
    try {
      const data = await getMe(token)
      setState({ status: "ok", data })
    } catch {
      setState({ status: "error", message: "Failed to load profile" })
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login?next=%2Fprofile%2Fedit")
    }
  }, [isLoading, token, router])

  if (isLoading || !token) {
    return <p>Loading…</p>
  }

  if (state.status === "loading") {
    return <p>Loading…</p>
  }

  if (state.status === "error") {
    return <p role="alert">{state.message}</p>
  }

  const { creatorProfile, fanProfile } = state.data.user

  const initialValues = {
    displayName:
      creatorProfile?.displayName ?? fanProfile?.displayName ?? "",
    bio: creatorProfile?.bio ?? "",
    genre: creatorProfile?.genre ?? "",
    location: creatorProfile?.location ?? "",
    genrePrefs: fanProfile?.genrePrefs ?? [],
    avatarUrl:
      creatorProfile?.avatarUrl ?? fanProfile?.avatarUrl ?? null,
  }

  return (
    <main>
      <h1>Edit Profile</h1>
      <EditProfileForm
        token={token}
        initialValues={initialValues}
        onSuccess={load}
      />
    </main>
  )
}
