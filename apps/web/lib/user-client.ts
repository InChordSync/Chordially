import type { MeResponse, UpdateMeInput } from "@chordially/shared"
import { apiFetch, authHeaders } from "./api-client"

export function getMe(token: string): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/users/me", {
    headers: authHeaders(token),
  })
}

export function getAvatarUploadUrl(
  token: string,
  contentType: string
): Promise<{ uploadUrl: string; avatarUrl: string }> {
  return apiFetch<{ uploadUrl: string; avatarUrl: string }>(
    "/api/users/me/avatar-upload-url",
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ contentType }),
    }
  )
}

export function updateMe(
  token: string,
  input: UpdateMeInput
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/api/users/me", {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  })
}
