/**
 * auth-330-lockout.test.ts
 *
 * Tests for issue #330 – account lockout and cooldown on repeated failed logins.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { loginUser, registerUser, resetAuthStore } from "../src/auth-store.js";
import { resetLockoutStore, lockoutRemaining } from "../src/lockout-store.js";
import { createApp } from "../src/app.js";

const EMAIL    = "lock@example.com";
const PASSWORD = "correct-password";

function setup() {
  resetAuthStore();
  resetLockoutStore();
  registerUser({ email: EMAIL, password: PASSWORD, displayName: "Locked" });
}

function failLogin(n: number) {
  for (let i = 0; i < n; i++) {
    try { loginUser({ email: EMAIL, password: "wrong" }); } catch { /* expected */ }
  }
}

// ── unit: lockout-store ───────────────────────────────────────────────────────

test("no lockout before threshold", () => {
  setup();
  failLogin(4);
  assert.equal(lockoutRemaining(EMAIL), 0);
});

test("lockout activates at 5th failure", () => {
  setup();
  failLogin(5);
  assert.ok(lockoutRemaining(EMAIL) > 0);
});

test("locked account throws ACCOUNT_LOCKED", () => {
  setup();
  failLogin(5);
  try {
    loginUser({ email: EMAIL, password: PASSWORD });
    assert.fail("should have thrown");
  } catch (err: unknown) {
    assert.equal((err as { code?: string }).code, "ACCOUNT_LOCKED");
  }
});

test("successful login clears failure counter", () => {
  setup();
  failLogin(4);
  loginUser({ email: EMAIL, password: PASSWORD });
  assert.equal(lockoutRemaining(EMAIL), 0);
  // Should be able to fail again without immediate lockout.
  failLogin(4);
  assert.equal(lockoutRemaining(EMAIL), 0);
});

// ── HTTP: 423 response ────────────────────────────────────────────────────────

test("POST /api/v1/auth/login returns 423 when locked", async () => {
  setup();
  failLogin(5);

  const { default: supertest } = await import("supertest");
  const app = createApp();
  const res = await supertest(app)
    .post("/api/v1/auth/login")
    .send({ email: EMAIL, password: PASSWORD });

  assert.equal(res.status, 423);
  assert.equal(res.body.error, "ACCOUNT_LOCKED");
  assert.ok(res.body.retryAfterMs > 0);
});

test("POST /api/v1/auth/login returns 401 for bad creds (not locked)", async () => {
  setup();

  const { default: supertest } = await import("supertest");
  const app = createApp();
  const res = await supertest(app)
    .post("/api/v1/auth/login")
    .send({ email: EMAIL, password: "wrong-password" });

  assert.equal(res.status, 401);
  assert.equal(res.body.error, "LOGIN_FAILED");
});
