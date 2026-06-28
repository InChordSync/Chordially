"use client"

import { useCallback, useEffect, useState } from "react"
import type { MediaAssetResponse } from "@chordially/shared"
import { MediaGallery } from "../../../components/media/MediaGallery"
import { MediaUploadButton } from "../../../components/media/MediaUploadButton"
import { useAuth } from "../../../lib/auth-context"
import {
  getMediaAssets,
  getUploadUrl,
  uploadToPresignedUrl,
  confirmUpload,
  deleteMedia,
  setMediaAsCover,
  reorderMedia,
} from "../../../lib/media-client"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; assets: MediaAssetResponse[] }

export default function MediaPage() {
  const { token } = useAuth()
  const [state, setState] = useState<LoadState>({ status: "loading" })

  const load = useCallback(async () => {
    if (!token) return
    try {
      const assets = await getMediaAssets(token)
      setState({ status: "ok", assets })
    } catch {
      setState({ status: "error", message: "Failed to load media" })
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpload(file: File) {
    if (!token || state.status !== "ok") return

    const { url, key } = await getUploadUrl(token)
    await uploadToPresignedUrl(url, file)
    await confirmUpload(token, key)
    await load()
  }

  async function handleDelete(id: string) {
    if (!token) return
    await deleteMedia(token, id)
    await load()
  }

  async function handleSetCover(id: string) {
    if (!token) return
    await setMediaAsCover(token, id)
    await load()
  }

  async function handleMoveUp(id: string) {
    if (!token || state.status !== "ok") return
    const sorted = [...state.assets].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((a) => a.id === id)
    if (idx <= 0) return
    const target = sorted[idx]
    const above = sorted[idx - 1]
    await reorderMedia(token, target.id, above.sortOrder)
    await reorderMedia(token, above.id, target.sortOrder)
    await load()
  }

  async function handleMoveDown(id: string) {
    if (!token || state.status !== "ok") return
    const sorted = [...state.assets].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((a) => a.id === id)
    if (idx < 0 || idx >= sorted.length - 1) return
    const target = sorted[idx]
    const below = sorted[idx + 1]
    await reorderMedia(token, target.id, below.sortOrder)
    await reorderMedia(token, below.id, target.sortOrder)
    await load()
  }

  if (!token) {
    return (
      <main>
        <p>Please log in to manage your media.</p>
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

  const { assets } = state

  return (
    <main>
      <h1>Media Gallery</h1>
      <div style={{ marginBottom: "1.5rem" }}>
        <MediaUploadButton onUpload={handleUpload} />
      </div>
      <MediaGallery
        assets={assets}
        onDelete={handleDelete}
        onSetCover={handleSetCover}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />
    </main>
  )
}
