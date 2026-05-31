/**
 * lockout-store.ts
 *
 * In-memory account lockout tracker. After MAX_FAILURES consecutive failed
 * logins the account is locked for COOLDOWN_MS. A successful login clears
 * the failure counter.
 */

const MAX_FAILURES  = 5;
const COOLDOWN_MS   = 15 * 60 * 1000; // 15 minutes

interface Entry { failures: number; lockedUntil: number | null }

const store = new Map<string, Entry>();

function get(email: string): Entry {
  return store.get(email) ?? { failures: 0, lockedUntil: null };
}

/** Returns ms remaining in lockout, or 0 if not locked. */
export function lockoutRemaining(email: string): number {
  const e = get(email);
  if (!e.lockedUntil) return 0;
  const remaining = e.lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

/** Call on every failed login attempt. */
export function recordFailure(email: string): void {
  const e = get(email);
  // Reset expired lockout before counting.
  if (e.lockedUntil && Date.now() >= e.lockedUntil) {
    e.failures = 0;
    e.lockedUntil = null;
  }
  e.failures++;
  if (e.failures >= MAX_FAILURES) e.lockedUntil = Date.now() + COOLDOWN_MS;
  store.set(email, e);
}

/** Call on successful login to clear failure state. */
export function recordSuccess(email: string): void {
  store.delete(email);
}

/** Test helper. */
export function resetLockoutStore(): void {
  store.clear();
}
