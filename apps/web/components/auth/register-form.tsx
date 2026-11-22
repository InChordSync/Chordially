"use client"

import { registerSchema } from "@chordially/shared"
import { useState, type FormEvent } from "react"
import { AuthApiError } from "../../lib/auth-client"
import { useAuth } from "../../lib/auth-context"

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
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === "string" && !errors[field]) {
          errors[field] = issue.message
        }
      }
      setFieldErrors(errors)
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
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? emailErrorId : undefined}
          onChange={(event) => setEmail(event.target.value)}
        />
        {fieldErrors.email && (
          <p id={emailErrorId} role="alert">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={passwordDescribedBy || undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <p id={passwordHelpId} style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Use at least 8 characters, including a letter and a number.
        </p>
        {fieldErrors.password && (
          <p id={passwordErrorId} role="alert">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {formError && <p role="alert">{formError}</p>}
      {success && <p role="status">Account created. You&apos;re logged in.</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  )
}
