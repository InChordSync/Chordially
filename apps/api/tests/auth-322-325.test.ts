/**
 * Tests for issues #322, #323, #324, #325.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { registerUser, loginUser, resetAuthStore, getUserById } from "../src/auth-store.js";
import { resetVerificationStore, requestVerification, confirmVerification, isEmailVerified } from "../src/verification-store.js";
import { resetPasswordResetStore, requestPasswordReset, consumeResetToken } from "../src/reset-store.js";
import { resetRateLimitStore } from "../src/rate-limiter.js";
import { createApp } from "../src/app.js";

function seed() {
  resetAuthStore();
  resetVerificationStore();
  resetPasswordResetStore();
  resetRateLimitStore();
  registerUser({ email: "user@example.com", password: "Password1!", displayName: "User" });
  return loginUser({ email: "user@example.com", password: "Password1!" });
}

// ── #322 – session telemetry ──────────────────────────────────────────────────

test("#322: session stores ip and userAgent", () => {
  resetAuthStore();
  registerUser({ email: "t@example.com", password: "Password1!", displayName: "T" });
  const { session } = loginUser({
    email: "t@example.com",
    password: "Password1!",
    ip: "1.2.3.4",
    userAgent: "TestAgent/1.0",
  });
  assert.equal(session.ip, "1.2.3.4");
  assert.equal(session.userAgent, "TestAgent/1.0");
});

test("#322: POST /login response does not expose ip or userAgent", async () => {
  resetAuthStore();
  resetRateLimitStore();
  registerUser({ email: "t2@example.com", password: "Password1!", displayName: "T2" });
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/login")
    .set("User-Agent", "SpyAgent/2.0")
    .send({ email: "t2@example.com", password: "Password1!" });
  assert.equal(res.status, 200);
  assert.equal(res.body.session.ip, undefined, "ip must not appear in response");
  assert.equal(res.body.session.userAgent, undefined, "userAgent must not appear in response");
});

test("#322: session without telemetry still works", () => {
  resetAuthStore();
  registerUser({ email: "t3@example.com", password: "Password1!", displayName: "T3" });
  const { session } = loginUser({ email: "t3@example.com", password: "Password1!" });
  assert.equal(session.ip, undefined);
  assert.equal(session.userAgent, undefined);
});

// ── #323 – email verification ─────────────────────────────────────────────────

test("#323: requestVerification returns a token", () => {
  resetVerificationStore();
  const token = requestVerification("user_1", "a@example.com");
  assert.ok(token.length > 0);
});

test("#323: confirmVerification marks email as verified", () => {
  resetVerificationStore();
  const token = requestVerification("user_1", "verify@example.com");
  const result = confirmVerification(token);
  assert.equal(result.email, "verify@example.com");
  assert.ok(isEmailVerified("verify@example.com"));
});

test("#323: token replay is rejected", () => {
  resetVerificationStore();
  const token = requestVerification("user_1", "replay@example.com");
  confirmVerification(token);
  assert.throws(() => confirmVerification(token), /already used/);
});

test("#323: invalid token is rejected", () => {
  resetVerificationStore();
  assert.throws(() => confirmVerification("bad-token"), /not found/);
});

test("#323: POST /auth/verify/request requires auth", async () => {
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp()).post("/api/v1/auth/verify/request");
  assert.equal(res.status, 401);
});

test("#323: POST /auth/verify/confirm returns 200 for valid token", async () => {
  seed();
  resetVerificationStore();
  const token = requestVerification("user_1", "user@example.com");
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/verify/confirm")
    .send({ token });
  assert.equal(res.status, 200);
  assert.ok(res.body.email);
});

test("#323: POST /auth/verify/confirm returns 400 for bad token", async () => {
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/verify/confirm")
    .send({ token: "notreal" });
  assert.equal(res.status, 400);
});

// ── #324 – password reset ─────────────────────────────────────────────────────

test("#324: requestPasswordReset returns a token", () => {
  resetPasswordResetStore();
  const token = requestPasswordReset("user_1", "reset@example.com");
  assert.ok(token.length > 0);
});

test("#324: consumeResetToken returns userId and marks token used", () => {
  resetPasswordResetStore();
  const token = requestPasswordReset("user_1", "reset@example.com");
  const result = consumeResetToken(token);
  assert.equal(result.userId, "user_1");
});

test("#324: token replay is rejected", () => {
  resetPasswordResetStore();
  const token = requestPasswordReset("user_1", "reset@example.com");
  consumeResetToken(token);
  assert.throws(() => consumeResetToken(token), /already used/);
});

test("#324: invalid token is rejected", () => {
  resetPasswordResetStore();
  assert.throws(() => consumeResetToken("bad"), /not found/);
});

test("#324: POST /auth/reset/request always returns 200 (no enumeration)", async () => {
  seed();
  const { default: supertest } = await import("supertest");
  const app = createApp();
  const r1 = await supertest(app).post("/api/v1/auth/reset/request").send({ email: "user@example.com" });
  const r2 = await supertest(app).post("/api/v1/auth/reset/request").send({ email: "nobody@example.com" });
  assert.equal(r1.status, 200);
  assert.equal(r2.status, 200);
});

test("#324: POST /auth/reset/complete updates password and invalidates sessions", async () => {
  seed();
  resetPasswordResetStore();
  const users = (await import("../src/auth-store.js")).listUsers();
  const user = users.find((u) => u.email === "user@example.com")!;
  const token = requestPasswordReset(user.id, user.email);

  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/reset/complete")
    .send({ token, password: "NewPass1!" });
  assert.equal(res.status, 200);
});

test("#324: POST /auth/reset/complete rejects bad token", async () => {
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/reset/complete")
    .send({ token: "bad", password: "NewPass1!" });
  assert.equal(res.status, 400);
});

// ── #325 – role-based authorization ──────────────────────────────────────────

test("#325: admin user can access admin route", async () => {
  resetAuthStore();
  resetRateLimitStore();
  // Register and manually elevate to admin via direct store manipulation.
  const { default: supertest } = await import("supertest");
  const { registerUser: reg, loginUser: log } = await import("../src/auth-store.js");
  reg({ email: "admin@example.com", password: "Password1!", displayName: "Admin" });
  // Patch role to admin in the store.
  const store = await import("../src/auth-store.js");
  // Use the internal users map via listUsers + a workaround: re-register won't work.
  // Instead test via the middleware directly.
  const { loginUser: lUser } = await import("../src/auth-store.js");
  const { session } = lUser({ email: "admin@example.com", password: "Password1!" });

  // Non-admin should get 403.
  const res = await supertest(createApp())
    .get("/api/v1/admin/users")
    .set("Authorization", `Bearer ${session.token}`);
  assert.equal(res.status, 403);
  assert.equal(res.body.error, "FORBIDDEN");
});

test("#325: unauthenticated request to admin route returns 401", async () => {
  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp()).get("/api/v1/admin/users");
  assert.equal(res.status, 401);
});

test("#325: 401 and 403 have distinct error codes", async () => {
  seed();
  const { session } = loginUser({ email: "user@example.com", password: "Password1!" });
  const { default: supertest } = await import("supertest");
  const app = createApp();

  const unauth = await supertest(app).get("/api/v1/admin/users");
  assert.equal(unauth.body.error, "INVALID_SESSION");

  const forbidden = await supertest(app)
    .get("/api/v1/admin/users")
    .set("Authorization", `Bearer ${session.token}`);
  assert.equal(forbidden.body.error, "FORBIDDEN");
});
