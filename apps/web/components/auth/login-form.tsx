"use client"

import { loginSchema } from "@chordially/shared"
import { useState, type FormEvent } from "react"
import { AuthApiError } from "../../lib/auth-client"
import { useAuth } from "../../lib/auth-context"
import { mapZodIssues } from "../../lib/form-utils"
import { TextField } from "../form/text-field"

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
      setFieldErrors(mapZodIssues(result.error.issues))
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await login(result.data)
      setSuccess(true)
    } catch (error) {
      setFormError(error instanceof AuthApiError ? error.message : "Unable to log in")
    } finally {
      setIsSubmitting(false)
    }
  }

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

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          onChange={(event) => setPassword(event.target.value)}
        />
        {fieldErrors.password && <p id="password-error" role="alert">{fieldErrors.password}</p>}
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
