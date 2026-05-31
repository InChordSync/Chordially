import assert from "node:assert/strict";
import { createMobileAuthStore } from "../src/auth/mobile-auth-store.js";

const store = createMobileAuthStore();
assert.equal(store.getState().isBooting, true);

store.boot({
  sessionId: "session-1",
  sessions: [{ id: "session-1", device: "Pixel", lastSeen: "now" }],
});
assert.equal(store.getState().isAuthenticated, true);
assert.equal(store.getState().sessions.length, 1);

store.setOffline(true);
assert.equal(store.getState().isOffline, true);

store.revokeSession("session-1");
assert.equal(store.getState().sessions.length, 0);
assert.equal(store.getState().isAuthenticated, false);

console.log("mobile auth smoke test passed");
