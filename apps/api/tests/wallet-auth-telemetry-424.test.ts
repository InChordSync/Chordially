import assert from "node:assert/strict";
import test from "node:test";

import { WALLET_AUTH_TELEMETRY_EVENTS, type WalletAuthTelemetryPayload } from "@chordially/types";

import { createApp } from "../src/app.js";
import { registerUser, resetAuthStore } from "../src/auth-store.js";
import { resetRateLimitStore } from "../src/rate-limiter.js";
import { setWalletAuthTelemetrySink } from "../src/telemetry.js";

function collectTelemetry() {
  const events: WalletAuthTelemetryPayload[] = [];
  setWalletAuthTelemetrySink((event) => events.push(event));
  return events;
}

function resetTelemetry() {
  setWalletAuthTelemetrySink();
}

test("issue #424: login success emits sanitized wallet auth telemetry", async () => {
  resetAuthStore();
  resetRateLimitStore();
  const events = collectTelemetry();
  registerUser({ email: "wallet@example.com", password: "Password1!", displayName: "Wallet" });

  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/login")
    .set("User-Agent", "SensitiveAgent/1.0")
    .send({ email: "wallet@example.com", password: "Password1!", origin: "web" });

  assert.equal(res.status, 200);
  assert.equal(events.length, 1);
  assert.deepEqual(
    {
      event: events[0]?.event,
      outcome: events[0]?.outcome,
      service: events[0]?.service,
      boundary: events[0]?.boundary,
      subjectId: events[0]?.subjectId,
    },
    {
      event: WALLET_AUTH_TELEMETRY_EVENTS.walletLinkSucceeded,
      outcome: "success",
      service: "api",
      boundary: "api.auth.login",
      subjectId: "user_1",
    },
  );

  const serialized = JSON.stringify(events[0]);
  assert.equal(serialized.includes("wallet@example.com"), false);
  assert.equal(serialized.includes("Password1!"), false);
  assert.equal(serialized.includes(res.body.session.token), false);
  assert.equal(serialized.includes("SensitiveAgent"), false);
  resetTelemetry();
});

test("issue #424: login failure emits sanitized failure telemetry", async () => {
  resetAuthStore();
  resetRateLimitStore();
  const events = collectTelemetry();
  registerUser({ email: "wallet@example.com", password: "Password1!", displayName: "Wallet" });

  const { default: supertest } = await import("supertest");
  const res = await supertest(createApp())
    .post("/api/v1/auth/login")
    .send({ email: "wallet@example.com", password: "WrongPass1!" });

  assert.equal(res.status, 401);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.event, WALLET_AUTH_TELEMETRY_EVENTS.walletAuthFailed);
  assert.equal(events[0]?.boundary, "api.auth.login");
  assert.equal(events[0]?.reason, "INVALID_CREDENTIALS");

  const serialized = JSON.stringify(events[0]);
  assert.equal(serialized.includes("wallet@example.com"), false);
  assert.equal(serialized.includes("WrongPass1!"), false);
  resetTelemetry();
});

test("issue #424: logout emits revocation telemetry without token material", async () => {
  resetAuthStore();
  resetRateLimitStore();
  const events = collectTelemetry();
  registerUser({ email: "wallet@example.com", password: "Password1!", displayName: "Wallet" });

  const { default: supertest } = await import("supertest");
  const login = await supertest(createApp())
    .post("/api/v1/auth/login")
    .send({ email: "wallet@example.com", password: "Password1!" });
  events.length = 0;

  const res = await supertest(createApp())
    .post("/api/v1/auth/logout")
    .send({ token: login.body.session.token });

  assert.equal(res.status, 200);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.event, WALLET_AUTH_TELEMETRY_EVENTS.walletLinkRevoked);
  assert.equal(events[0]?.boundary, "api.auth.logout");
  assert.equal(events[0]?.sessionsRevoked, 1);
  assert.equal(JSON.stringify(events[0]).includes(login.body.session.token), false);
  resetTelemetry();
});
