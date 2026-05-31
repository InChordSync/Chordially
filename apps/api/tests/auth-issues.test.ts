/**
 * Tests for issues #318, #319, #320, #321.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  getActiveSession,
  loginUser,
  logoutAllSessions,
  logoutUser,
  registerUser,
  resetAuthStore,
} from "../src/auth-store.js";
import { createApp } from "../src/app.js";
import { resetRateLimitStore } from "../src/rate-limiter.js";

function seed() {
  resetAuthStore();
  resetRateLimitStore();
  registerUser({ email: "a@example.com", password: "password123", displayName: "A" });
  return loginUser({ email: "a@example.com", password: "password123" });
}

// ── #318 – single-session logout ──────────────────────────────────────────────

test("#318: logout revokes only the targeted session", () => {
  const { session: s1 } = seed();
  const { session: s2 } = loginUser({ email: "a@example.com", password: "password123" });

  logoutUser(s1.token);

  assert.equal(getActiveSession(s1.token), undefined, "s1 revoked");
  assert.ok(getActiveSession(s2.token), "s2 still active");
});

test("#318: POST /logout returns sessionsRevoked: 1", async () => {
  const { session } = seed();
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp()).post("/api/v1/auth/logout").send({ token: session.token });
  assert.equal(res.status, 200);
  assert.equal(res.body.sessionsRevoked, 1);
});

test("#318: POST /logout on absent token returns sessionsRevoked: 0", async () => {
  seed();
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp()).post("/api/v1/auth/logout").send({ token: "nonexistent" });
  assert.equal(res.status, 200);
  assert.equal(res.body.sessionsRevoked, 0);
});

// ── #319 – global sign-out ────────────────────────────────────────────────────

test("#319: logoutAllSessions revokes every active session for a user", () => {
  const { session: s1 } = seed();
  const { session: s2 } = loginUser({ email: "a@example.com", password: "password123" });
  const { session: s3 } = loginUser({ email: "a@example.com", password: "password123" });

  const count = logoutAllSessions(s1.userId);

  assert.equal(count, 3);
  assert.equal(getActiveSession(s1.token), undefined);
  assert.equal(getActiveSession(s2.token), undefined);
  assert.equal(getActiveSession(s3.token), undefined);
});

test("#319: POST /logout-all revokes all sessions via HTTP", async () => {
  const { session } = seed();
  loginUser({ email: "a@example.com", password: "password123" }); // second session
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/logout-all")
    .set("Authorization", `Bearer ${session.token}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.sessionsRevoked >= 2, "at least 2 sessions revoked");
});

test("#319: POST /logout-all requires authentication", async () => {
  seed();
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp()).post("/api/v1/auth/logout-all");
  assert.equal(res.status, 401);
});

// ── #320 – duplicate-account policy ──────────────────────────────────────────

test("#320: email is normalized before uniqueness check (uppercase)", () => {
  resetAuthStore();
  registerUser({ email: "User@Example.COM", password: "pw", displayName: "U" });
  assert.throws(
    () => registerUser({ email: "user@example.com", password: "pw2", displayName: "U2" }),
    /already exists/,
  );
});

test("#320: email is normalized before uniqueness check (whitespace)", () => {
  resetAuthStore();
  registerUser({ email: "user@example.com", password: "pw", displayName: "U" });
  assert.throws(
    () => registerUser({ email: "  user@example.com  ", password: "pw2", displayName: "U2" }),
    /already exists/,
  );
});

test("#320: POST /register returns 409 for duplicate email (opaque)", async () => {
  resetAuthStore();
  resetRateLimitStore();
  const { default: supertest } = await import("supertest");
  const app = createApp();
  await supertest(app)
    .post("/api/v1/auth/register")
    .send({ email: "dup@example.com", password: "password123", displayName: "Dup" });
  const res = await supertest(app)
    .post("/api/v1/auth/register")
    .send({ email: "dup@example.com", password: "password123", displayName: "Dup" });
  assert.equal(res.status, 409);
  // Response must not reveal whether the account exists
  assert.ok(!JSON.stringify(res.body).toLowerCase().includes("already exists"));
});

// ── #321 – rate limiting ──────────────────────────────────────────────────────

test("#321: login endpoint returns 429 after exceeding threshold", async () => {
  resetAuthStore();
  resetRateLimitStore();
  registerUser({ email: "rl@example.com", password: "password123", displayName: "RL" });
  const { default: supertest } = await import("supertest");
  const app = createApp();
  let lastStatus = 0;
  for (let i = 0; i < 12; i++) {
    const r = await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: "rl@example.com", password: "password123" });
    lastStatus = r.status;
  }
  assert.equal(lastStatus, 429);
});

test("#321: 429 response includes retryAfter", async () => {
  resetAuthStore();
  resetRateLimitStore();
  registerUser({ email: "rl2@example.com", password: "password123", displayName: "RL2" });
  const { default: supertest } = await import("supertest");
  const app = createApp();
  for (let i = 0; i < 12; i++) {
    await supertest(app)
      .post("/api/v1/auth/login")
      .send({ email: "rl2@example.com", password: "password123" });
  }
  const res = await supertest(app)
    .post("/api/v1/auth/login")
    .send({ email: "rl2@example.com", password: "password123" });
  assert.equal(res.status, 429);
  assert.ok(res.body.retryAfter > 0);
  assert.ok(res.headers["retry-after"]);
});

test("#321: register endpoint is rate-limited independently", async () => {
  resetAuthStore();
  resetRateLimitStore();
  const { default: supertest } = await import("supertest");
  const app = createApp();
  let lastStatus = 0;
  for (let i = 0; i < 7; i++) {
    const r = await supertest(app)
      .post("/api/v1/auth/register")
      .send({ email: `u${i}@example.com`, password: "password123", displayName: "U" });
    lastStatus = r.status;
  }
  assert.equal(lastStatus, 429);
});
