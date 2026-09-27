export const metadata = {
  title: "Log In | Chordially",
  description: "Log in to your account",
}

import Link from "next/link"
import { LoginForm } from "../../components/auth/login-form"

export default function LoginPage() {
  return (
    <main>
      <h1>Log in</h1>
      <LoginForm />
      <p>
        Don&apos;t have an account? <Link href="/register">Create one</Link>
      </p>
    </main>
  )
}
