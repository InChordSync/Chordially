import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <main>
      <h1>Forgot password</h1>
      <p>Password reset is not available yet. Please contact support if you need help accessing your account.</p>
      <p>
        <Link href="/login">Back to log in</Link>
      </p>
    </main>
  )
}
