import assert from "node:assert/strict";
import { type AddressInfo } from "node:net";
import test from "node:test";

import { WALLET_AUTH_TELEMETRY_EVENTS, type WalletAuthTelemetryPayload } from "@chordially/types";

import { createApp } from "../src/app.js";
import { setWalletAuthTelemetrySink } from "../src/telemetry.js";

test("issue #424: starter intent emits wallet-link start telemetry", async () => {
  const events: WalletAuthTelemetryPayload[] = [];
  setWalletAuthTelemetrySink((event) => events.push(event));

  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/v1/stellar/starter-intent`);
    assert.equal(res.status, 200);
    await res.json();
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    setWalletAuthTelemetrySink();
  }

  assert.equal(events.length, 1);
  assert.equal(events[0]?.event, WALLET_AUTH_TELEMETRY_EVENTS.walletLinkStarted);
  assert.equal(events[0]?.outcome, "start");
  assert.equal(events[0]?.service, "stellar-service");
  assert.equal(events[0]?.boundary, "stellar.starter_intent");
  assert.equal(events[0]?.network, "testnet");
});
