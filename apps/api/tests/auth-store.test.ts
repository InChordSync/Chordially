import assert from "node:assert/strict";
import test from "node:test";

import {
  getActiveSession,
  listUsers,
  loginUser,
  logoutUser,
  registerUser,
  resetAuthStore,
  rotateRefreshToken,
} from "../src/auth-store.js";
import { verifyAccessToken } from "../src/token-service.js";
import { createApp } from "../src/app.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function seed() {
  resetAuthStore();
  registerUser({ email: "builder@example.com", password: "password123", displayName: "Builder" });
  return loginUser({ email: "builder@example.com", password: "password123", origin: "web" });
}

// ── Issue #314 – session records as first-class objects ───────────────────────

test("session record includes metadata fields", () => {
  const { session } = seed();
  assert.ok(session.createdAt, "createdAt present");
  assert.ok(session.lastSeenAt, "lastSeenAt present");
  assert.equal(session.origin, "web");
  assert.equal(session.revokedAt, undefined);
});

test("logout revokes session rather than deleting it", () => {
  const { session } = seed();
  const revoked = logoutUser(session.token);
  assert.ok(revoked);
  // Session record still exists but is inactive.
  assert.equal(getActiveSession(session.token), undefined);
});

test("registerUser stores a contributor account", () => {
  resetAuthStore();
  const user = registerUser({ email: "builder@example.com", password: "pw", displayName: "B" });
  assert.equal(user.email, "builder@example.com");
  assert.equal(listUsers().length, 1);
});

// ── Issue #315 – signed JWT access tokens ────────────────────────────────────

test("login issues a verifiable JWT access token", () => {
  const { session } = seed();
  const payload = verifyAccessToken(session.token);
  assert.ok(payload.sub, "sub claim present");
  assert.ok(payload.sid, "sid claim present");
});

test("tampered token is rejected by verifyAccessToken", () => {
  const { session } = seed();
  const tampered = session.token.slice(0, -4) + "xxxx";
  assert.throws(() => verifyAccessToken(tampered));
});

test("requireAuth middleware rejects missing token", async () => {
  const app = createApp();
  const { default: supertest } = await import("supertest");
  const res = await supertest(app).get("/api/v1/auth/me");
  assert.equal(res.status, 401);
});

// ── Issue #316 – introspection endpoint ──────────────────────────────────────

test("GET /api/v1/auth/me returns user and session for valid token", async () => {
  resetAuthStore();
  registerUser({ email: "me@example.com", password: "pw", displayName: "Me" });
  const { session } = loginUser({ email: "me@example.com", password: "pw" });

  const { default: supertest } = await import("supertest");
  const app = createApp();
  const res = await supertest(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${session.token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, "me@example.com");
  assert.ok(res.body.session.token);
});

test("GET /api/v1/auth/me rejects revoked session", async () => {
  resetAuthStore();
  registerUser({ email: "me@example.com", password: "pw", displayName: "Me" });
  const { session } = loginUser({ email: "me@example.com", password: "pw" });
  logoutUser(session.token);

  const { default: supertest } = await import("supertest");
  const app = createApp();
  const res = await supertest(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${session.token}`);

  assert.equal(res.status, 401);
});

// ── Issue #317 – refresh token rotation ──────────────────────────────────────

test("rotateRefreshToken issues new session and refresh token", () => {
  const { session: s1, refreshToken: rt1 } = seed();
  const { session: s2, refreshToken: rt2 } = rotateRefreshToken(rt1);
  assert.notEqual(s2.token, s1.token);
  assert.notEqual(rt2, rt1);
});

test("old session is revoked after rotation", () => {
  const { session: s1, refreshToken: rt1 } = seed();
  rotateRefreshToken(rt1);
  assert.equal(getActiveSession(s1.token), undefined);
});

test("replay of used refresh token is rejected", () => {
  const { refreshToken: rt1 } = seed();
  rotateRefreshToken(rt1);
  assert.throws(() => rotateRefreshToken(rt1), /already used/);
});

test("POST /api/v1/auth/refresh rotates via HTTP", async () => {
  resetAuthStore();
  registerUser({ email: "r@example.com", password: "pw", displayName: "R" });
  const { refreshToken } = loginUser({ email: "r@example.com", password: "pw" });

  const { default: supertest } = await import("supertest");
  const app = createApp();
  const res = await supertest(app).post("/api/v1/auth/refresh").send({ refreshToken });

  assert.equal(res.status, 200);
  assert.ok(res.body.session.token);
  assert.ok(res.body.refreshToken);
  assert.notEqual(res.body.refreshToken, refreshToken);
});
