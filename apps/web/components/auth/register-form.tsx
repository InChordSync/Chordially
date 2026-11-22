"use client"

import { registerSchema } from "@chordially/shared"
import { useState, type FormEvent } from "react"
import { AuthApiError } from "../../lib/auth-client"
import { useAuth } from "../../lib/auth-context"
import { mapZodIssues } from "../../lib/form-utils"
import { TextField } from "../form/text-field"

export function RegisterForm() {
  const { register } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccess(false)

    const result = registerSchema.safeParse({ email, password })
    if (!result.success) {
      setFieldErrors(mapZodIssues(result.error.issues))
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await register(result.data)
      setSuccess(true)
    } catch (error) {
      setFormError(
        error instanceof AuthApiError ? error.message : "Unable to create account"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const emailErrorId = "register-email-error"
  const passwordErrorId = "register-password-error"
  const passwordHelpId = "register-password-help"
  const passwordDescribedBy = [
    passwordHelpId,
    fieldErrors.password ? passwordErrorId : null,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        error={fieldErrors.email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <TextField
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        error={fieldErrors.password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {formError && <p role="alert">{formError}</p>}
      {success && <p role="status">Account created. You&apos;re logged in.</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  )
}
