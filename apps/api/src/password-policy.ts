import type { AuthErrorCode } from "@chordially/types";

export type PolicyResult =
  | { ok: true }
  | { ok: false; code: AuthErrorCode; reason: string };

const RULES: Array<{ test: (p: string) => boolean; reason: string }> = [
  { test: (p) => p.length >= 8,          reason: "Password must be at least 8 characters." },
  { test: (p) => p.length <= 128,        reason: "Password must not exceed 128 characters." },
  { test: (p) => !/^\s|\s$/.test(p),     reason: "Password must not start or end with whitespace." },
  { test: (p) => /[A-Z]/.test(p),        reason: "Password must contain at least one uppercase letter." },
  { test: (p) => /[0-9]/.test(p),        reason: "Password must contain at least one digit." },
  { test: (p) => /[^A-Za-z0-9]/.test(p), reason: "Password must contain at least one special character." },
];

/**
 * Validates a plaintext password against the Chordially password policy.
 * Returns the first failing rule so clients can surface actionable feedback.
 */
export function validatePassword(password: string): PolicyResult {
  for (const rule of RULES) {
    if (!rule.test(password)) {
      return { ok: false, code: "POLICY_VIOLATION", reason: rule.reason };
    }
  }
  return { ok: true };
}

/**
 * Throws a structured error if the password violates policy.
 * Convenience wrapper for use inside route handlers.
 */
export function assertPasswordPolicy(password: string): void {
  const result = validatePassword(password);
  if (!result.ok) {
    const err = Object.assign(new Error(result.reason), {
      code: result.code,
    });
    throw err;
  }
}
