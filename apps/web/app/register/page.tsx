import Link from "next/link"
import { RegisterForm } from "../../components/auth/register-form"

export default function RegisterPage() {
  return (
    <main className="auth-layout">
      <h1>Create your account</h1>
      <RegisterForm />
      <p>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </main>
  )
}
