"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { StepIndicator } from "../../components/onboarding/StepIndicator"
import { DisplayNameStep } from "../../components/onboarding/DisplayNameStep"
import { AvatarStep } from "../../components/onboarding/AvatarStep"
import { BioStep } from "../../components/onboarding/BioStep"
import { GenreStep } from "../../components/onboarding/GenreStep"
import { LocationStep } from "../../components/onboarding/LocationStep"
import { useAuth } from "../../lib/auth-context"
import { getMe } from "../../lib/user-client"
import { getOnboardingStatus, markStepComplete } from "../../lib/onboarding-client"

const STEPS = ["displayName", "avatar", "bio", "genre", "location"] as const
const STEP_LABELS = ["Name", "Photo", "Bio", "Genre", "Location"]

type Step = (typeof STEPS)[number]

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; currentStep: number; initialValues: Record<string, string> }

export default function OnboardingPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [activeStep, setActiveStep] = useState(0)

  const load = useCallback(async () => {
    if (!token) return

    try {
      const me = await getMe(token)
      const profile = me.user.creatorProfile
      const initialValues: Record<string, string> = {
        displayName: profile?.displayName ?? "",
        avatarUrl: profile?.avatarUrl ?? "",
        bio: profile?.bio ?? "",
        genre: profile?.genre ?? "",
        location: profile?.location ?? "",
      }

      let startStep = 0
      try {
        const onboarding = await getOnboardingStatus(token)
        if (onboarding.steps.length > 0) {
          const firstIncomplete = onboarding.steps.findIndex((s) => !s.completed)
          startStep = firstIncomplete >= 0 ? firstIncomplete : onboarding.steps.length
        }
      } catch {
        // resume not available, start from beginning
      }

      setActiveStep(startStep)
      setState({ status: "ok", currentStep: startStep, initialValues })
    } catch {
      setState({ status: "error", message: "Failed to load profile" })
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  async function handleSave(stepKey: Step, value: string) {
    if (!token) return

    await markStepComplete(token, stepKey)

    const nextIndex = STEPS.indexOf(stepKey) + 1
    if (nextIndex >= STEPS.length) {
      router.push("/profile/edit")
      return
    }
    setActiveStep(nextIndex)
  }

  if (!token) {
    return (
      <main>
        <p>Please log in to set up your creator profile.</p>
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

  const { initialValues } = state
  const currentStepKey = STEPS[activeStep]

  function renderStep() {
    switch (currentStepKey) {
      case "displayName":
        return (
          <DisplayNameStep
            initialValue={initialValues.displayName}
            onSave={async (v) => handleSave("displayName", v)}
          />
        )
      case "avatar":
        return (
          <AvatarStep
            currentAvatarUrl={initialValues.avatarUrl || null}
            onSave={async (v) => handleSave("avatar", v)}
          />
        )
      case "bio":
        return (
          <BioStep
            initialValue={initialValues.bio}
            onSave={async (v) => handleSave("bio", v)}
          />
        )
      case "genre":
        return (
          <GenreStep
            initialValue={initialValues.genre}
            onSave={async (v) => handleSave("genre", v)}
          />
        )
      case "location":
        return (
          <LocationStep
            initialValue={initialValues.location}
            onSave={async (v) => handleSave("location", v)}
            onComplete={() => router.push("/profile/edit")}
          />
        )
    }
  }

  return (
    <main>
      <h1 style={{ marginBottom: "1.5rem" }}>Set Up Your Creator Profile</h1>
      <StepIndicator
        currentStep={activeStep}
        totalSteps={STEPS.length}
        stepLabels={STEP_LABELS}
      />
      {renderStep()}
      {activeStep > 0 && (
        <button
          type="button"
          onClick={() => setActiveStep((s) => s - 1)}
          style={{ marginTop: "1rem", background: "none", border: "1px solid #ccc" }}
        >
          Back
        </button>
      )}
    </main>
  )
}
