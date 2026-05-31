"use client";

import { useEffect, useMemo, useState } from "react";

import { authClient } from "../../lib/auth-client";
import { readStoredSession, subscribeToStoredSessionChanges, writeStoredSession } from "../../lib/session-storage";

type StatusState =
  | { kind: "signed-out" }
  | { kind: "loading" }
  | { kind: "restricted"; message: string }
  | { kind: "signed-in"; displayName: string; role: string };

const restrictedMessages: Record<string, string> = {
  FORBIDDEN: "Signed in, but missing permission for this experience.",
  ACCOUNT_DISABLED: "This account is disabled.",
  ACCOUNT_BANNED: "This account is banned.",
};

export function AuthStatus() {
  const [state, setState] = useState<StatusState>({ kind: "loading" });
  const session = useMemo(() => readStoredSession(), []);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const current = readStoredSession();
      if (!current?.token) {
        if (!cancelled) setState({ kind: "signed-out" });
        return;
      }

      if (!cancelled) setState({ kind: "loading" });
      const result = await authClient.me(current.token);
      if (cancelled) return;

      if (result.ok) {
        setState({
          kind: "signed-in",
          displayName: result.data.user.displayName,
          role: result.data.user.role,
        });
        return;
      }

      const friendly = restrictedMessages[result.error.error];
      if (friendly) {
        setState({ kind: "restricted", message: friendly });
        return;
      }

      // Treat invalid/expired sessions as signed out, but preserve the ability to sign in again.
      writeStoredSession(null);
      setState({ kind: "signed-out" });
    }

    void refresh();
    const unsubscribe = subscribeToStoredSessionChanges(() => void refresh());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [session]);

  const accent =
    state.kind === "signed-in"
      ? "var(--accent-strong)"
      : state.kind === "restricted"
        ? "var(--accent)"
        : "var(--muted)";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: "0.95rem", color: accent }}>
        {state.kind === "loading" && "Checking session…"}
        {state.kind === "signed-out" && "Signed out"}
        {state.kind === "restricted" && state.message}
        {state.kind === "signed-in" && `Signed in as ${state.displayName} (${state.role})`}
      </span>

      {state.kind === "signed-in" ? (
        <button
          type="button"
          className="secondary-link"
          style={{ cursor: "pointer", border: "1px solid var(--border)", background: "transparent" }}
          onClick={() => writeStoredSession(null)}
        >
          Sign out
        </button>
      ) : (
        <a className="secondary-link" href="/auth">
          Sign in
        </a>
      )}
    </div>
  );
}

