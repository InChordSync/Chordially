"use client";

import { useRef, useState, type FormEvent } from "react";

type Phase = "idle" | "loading" | "sent" | "error";

export default function ResetRequestPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const submissionLock = useRef(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submissionLock.current || phase === "loading") return;
    submissionLock.current = true;
    setPhase("loading");
    const email = new FormData(e.currentTarget).get("email") as string;

    try {
      await fetch(
        `${process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000"}/api/v1/auth/reset-password/request`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }
      );
      // Always show the same message to avoid account enumeration.
      setPhase("sent");
    } catch {
      setPhase("error");
    } finally {
      submissionLock.current = false;
    }
  }

  if (phase === "sent") {
    return (
      <main className="page-shell">
        <section className="detail-panel">
          <p className="eyebrow">Password reset</p>
          <h1>Check your inbox.</h1>
          <p className="lede">
            If an account exists for that address, a reset link is on its way.
          </p>
          <div className="cta-row">
            <a href="/auth" className="secondary-link">Back to sign in</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="detail-panel">
        <p className="eyebrow">Password reset</p>
        <h1>Forgot your password?</h1>
        <p className="lede">Enter your email and we'll send a reset link if an account exists.</p>
        <form onSubmit={handleSubmit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            disabled={phase === "loading"}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "1rem", background: "transparent", color: "var(--ink)" }}
          />
          {phase === "error" && (
            <p style={{ margin: 0, color: "var(--accent)", fontSize: "0.9rem" }}>
              Something went wrong. Please try again.
            </p>
          )}
          <div className="cta-row" style={{ marginTop: 0 }}>
            <button type="submit" disabled={phase === "loading"} className="primary-link" style={{ cursor: "pointer", border: "none" }}>
              {phase === "loading" ? "Sending…" : "Send reset link"}
            </button>
            <a href="/auth" className="secondary-link">Cancel</a>
          </div>
        </form>
      </section>
    </main>
  );
}
