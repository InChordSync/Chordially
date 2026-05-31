"use client";

import { useRef, useState, type FormEvent } from "react";

type Phase = "idle" | "loading" | "success" | "expired" | "reused" | "error";

const outcomeMessages: Record<"expired" | "reused" | "error", string> = {
  expired: "This reset link has expired. Request a new one.",
  reused: "This link has already been used. Request a new reset link.",
  error: "Something went wrong. Please try again.",
};

export default function ResetConfirmPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [mismatch, setMismatch] = useState(false);
  const submissionLock = useRef(false);
  const token = searchParams.token ?? "";

  if (!token) {
    return (
      <main className="page-shell">
        <section className="detail-panel">
          <p className="eyebrow">Password reset</p>
          <h1>Invalid link.</h1>
          <p className="lede">This reset link is missing a token.</p>
          <div className="cta-row">
            <a href="/auth/reset-password" className="primary-link">Request a new link</a>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "success") {
    return (
      <main className="page-shell">
        <section className="detail-panel">
          <p className="eyebrow">Password reset</p>
          <h1>Password updated.</h1>
          <p className="lede">Your password has been changed. Sign in with your new credentials.</p>
          <div className="cta-row">
            <a href="/auth" className="primary-link">Sign in</a>
          </div>
        </section>
      </main>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submissionLock.current || phase === "loading") return;
    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;
    const confirm = data.get("confirm") as string;

    if (password !== confirm) { setMismatch(true); return; }
    setMismatch(false);
    submissionLock.current = true;
    setPhase("loading");

    try {
      const res = await fetch(
        `${process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000"}/api/v1/auth/reset-password/confirm`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }
      );
      if (res.ok) { setPhase("success"); return; }
      const body = await res.json() as { error?: string };
      if (body.error === "TOKEN_EXPIRED") setPhase("expired");
      else if (body.error === "TOKEN_INVALID") setPhase("reused");
      else setPhase("error");
    } catch {
      setPhase("error");
    } finally {
      submissionLock.current = false;
    }
  }

  const errorMsg = (phase === "expired" || phase === "reused" || phase === "error")
    ? outcomeMessages[phase]
    : null;

  return (
    <main className="page-shell">
      <section className="detail-panel">
        <p className="eyebrow">Password reset</p>
        <h1>Set a new password.</h1>
        <form onSubmit={handleSubmit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="New password (min 8 chars)"
            disabled={phase === "loading"}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "1rem", background: "transparent", color: "var(--ink)" }}
          />
          <input
            name="confirm"
            type="password"
            required
            placeholder="Confirm new password"
            disabled={phase === "loading"}
            style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "1rem", background: "transparent", color: "var(--ink)" }}
          />
          {mismatch && <p style={{ margin: 0, color: "var(--accent)", fontSize: "0.9rem" }}>Passwords do not match.</p>}
          {errorMsg && (
            <p style={{ margin: 0, color: "var(--accent)", fontSize: "0.9rem" }}>
              {errorMsg}{" "}
              {(phase === "expired" || phase === "reused") && (
                <a href="/auth/reset-password" style={{ color: "var(--accent-strong)" }}>Request a new link.</a>
              )}
            </p>
          )}
          <div className="cta-row" style={{ marginTop: 0 }}>
            <button type="submit" disabled={phase === "loading"} className="primary-link" style={{ cursor: "pointer", border: "none" }}>
              {phase === "loading" ? "Saving…" : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
