import type { OnboardingResponse } from "@chordially/shared"
import { apiFetch, authHeaders } from "./api-client"

export function getOnboardingStatus(
  token: string
): Promise<OnboardingResponse> {
  return apiFetch<OnboardingResponse>("/api/onboarding/status", {
    headers: authHeaders(token),
  })
}

export function markStepComplete(
  token: string,
  stepKey: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/api/onboarding/step", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ stepKey }),
  })
}

export function resumeOnboarding(
  token: string
): Promise<{ stepKey: string | null }> {
  return apiFetch<{ stepKey: string | null }>("/api/onboarding/resume", {
    headers: authHeaders(token),
  })
}
