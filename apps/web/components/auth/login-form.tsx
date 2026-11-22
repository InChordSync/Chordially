"use client"

import { loginSchema } from "@chordially/shared"
import { useState, type FormEvent } from "react"
import { AuthApiError } from "../../lib/auth-client"
import { useAuth } from "../../lib/auth-context"

export function LoginForm() {
  const { login } = useAuth()
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

    const result = loginSchema.safeParse({ email, password })

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
      await login(result.data)
      setSuccess(true)
    } catch (error) {
      setFormError(
        error instanceof AuthApiError ? error.message : "Unable to log in"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const emailErrorId = "login-email-error"
  const passwordErrorId = "login-password-error"

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
            autoComplete="current-password"
            value={password}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
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
        {fieldErrors.password && (
          <p id={passwordErrorId} role="alert">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
        <a href="/forgot-password" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "underline" }}>
          Forgot password?
        </a>
      </div>

      {formError && <p role="alert">{formError}</p>}
      {success && <p role="status">You&apos;re logged in.</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>
    </form>
  )
}
