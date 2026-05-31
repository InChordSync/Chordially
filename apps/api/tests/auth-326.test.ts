/**
 * Tests for issue #326 – normalized auth error envelope.
 *
 * Every auth endpoint must return { error: AuthErrorCode, message: string }
 * on failure. No stack traces, no inconsistent shapes.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { registerUser, resetAuthStore, loginUser, AuthServiceError } from "../src/auth-store.js";
import { resetRateLimitStore } from "../src/rate-limiter.js";
import { createApp } from "../src/app.js";

function seed() {
  resetAuthStore();
  resetRateLimitStore();
  registerUser({ email: "user@example.com", password: "Password1!", displayName: "User" });
}

// ── AuthServiceError unit ─────────────────────────────────────────────────────

test("#326: AuthServiceError carries typed code", () => {
  const err = new AuthServiceError("INVALID_CREDENTIALS", "bad creds");
  assert.equal(err.code, "INVALID_CREDENTIALS");
  assert.equal(err.name, "AuthServiceError");
  assert.ok(err instanceof Error);
});

// ── Malformed request → 400 MALFORMED_REQUEST ─────────────────────────────────

test("#326: POST /register with invalid body returns 400 MALFORMED_REQUEST", async () => {
  seed();
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/register")
    .send({ email: "not-an-email", password: "short" });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "MALFORMED_REQUEST");
  assert.ok(res.body.message);
});

test("#326: POST /login with missing fields returns 400 MALFORMED_REQUEST", async () => {
  seed();
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/login")
    .send({ email: "user@example.com" }); // missing password
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "MALFORMED_REQUEST");
});

// ── Bad credentials → 401 INVALID_CREDENTIALS ────────────────────────────────

test("#326: POST /login with wrong password returns 401 INVALID_CREDENTIALS", async () => {
  seed();
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/login")
    .send({ email: "user@example.com", password: "WrongPass1!" });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, "INVALID_CREDENTIALS");
  assert.ok(res.body.message);
});

// ── Duplicate email → 409 DUPLICATE_EMAIL ────────────────────────────────────

test("#326: POST /register with duplicate email returns 409 DUPLICATE_EMAIL", async () => {
  seed();
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/register")
    .send({ email: "user@example.com", password: "Password1!", displayName: "Dup" });
  assert.equal(res.status, 409);
  assert.equal(res.body.error, "DUPLICATE_EMAIL");
  assert.ok(res.body.message);
});

// ── Invalid refresh token → 400 TOKEN_INVALID ────────────────────────────────

test("#326: POST /refresh with bad token returns 400 TOKEN_INVALID", async () => {
  seed();
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/refresh")
    .send({ refreshToken: "not-a-real-token" });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "TOKEN_INVALID");
});

// ── Error envelope shape ──────────────────────────────────────────────────────

test("#326: all error responses share { error, message } shape", async () => {
  seed();
  const { default: supertest } = await import("supertest");
  const app = createApp();

  const cases = [
    supertest(app).post("/api/v1/auth/login").send({ email: "user@example.com", password: "bad" }),
    supertest(app).post("/api/v1/auth/register").send({ email: "user@example.com", password: "Password1!", displayName: "D" }),
    supertest(app).post("/api/v1/auth/refresh").send({ refreshToken: "bad" }),
    supertest(app).get("/api/v1/auth/me"),
  ];

  const responses = await Promise.all(cases);
  for (const res of responses) {
    assert.ok(res.status >= 400, `expected error status, got ${res.status}`);
    assert.ok(typeof res.body.error === "string", "error field must be a string");
    assert.ok(typeof res.body.message === "string", "message field must be a string");
    assert.equal(res.body.stack, undefined, "stack must not leak to client");
  }
});
