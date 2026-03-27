import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("health endpoint returns ok", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise<void>((resolve) => server.once("listening", () => resolve()));

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected tcp server address");
  }

  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(json, { status: "ok" });

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("prepare payment returns a draft tip intent", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise<void>((resolve) => server.once("listening", () => resolve()));

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected tcp server address");
  }

  const response = await fetch(`http://127.0.0.1:${address.port}/payments/prepare`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      amount: "5.00",
      asset: "XLM",
      destination: "GCFX3GM2V4N2O5NFEZ5XGUV3VZL57BC4Q43SGV5WW6H2I6J53GVL5W7W"
    })
  });
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.asset, "XLM");
  assert.equal(json.amount, "5.00");
  assert.equal(json.network, "testnet");
  assert.equal(json.submitMode, "manual");

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
