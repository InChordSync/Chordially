// CHORD-039: Seed data for local dev and test fixtures
// Idempotent — safe to run multiple times.

import type { SupporterReputation } from "./supporter-reputation";
import type { AuditEvent } from "./audit-event";

export const seedReputations: Omit<SupporterReputation, "updatedAt">[] = [
  {
    _id: "rep_001",
    userId: "user_fan_alice",
    artistId: "artist_001",
    level: { level: 3, xp: 420, nextLevelXp: 521 },
    streak: { currentDays: 7, longestDays: 14, lastActivityAt: new Date("2026-04-25") },
    badges: [
      { id: "badge_001", name: "First Drop", tier: "bronze", awardedAt: new Date("2026-01-10"), artistId: "artist_001" },
    ],
    totalTipped: 18.5,
    createdAt: new Date("2026-01-10"),
  },
  {
    _id: "rep_002",
    userId: "user_fan_bob",
    artistId: "artist_001",
    level: { level: 7, xp: 1100, nextLevelXp: 1521 },
    streak: { currentDays: 30, longestDays: 30, lastActivityAt: new Date("2026-04-26") },
    badges: [
      { id: "badge_002", name: "Loyal Chord", tier: "silver", awardedAt: new Date("2026-03-01"), artistId: "artist_001" },
      { id: "badge_003", name: "Backstage Pass", tier: "gold", awardedAt: new Date("2026-04-01"), artistId: "artist_001" },
    ],
    totalTipped: 95.0,
    createdAt: new Date("2026-01-15"),
  },
];

export const seedAuditEvents: Omit<AuditEvent, "_id">[] = [
  {
    action: "user.warn",
    severity: "warning",
    actor: { userId: "admin_001", role: "admin", ip: "10.0.0.1" },
    target: { type: "user", id: "user_bad_actor", snapshot: { username: "spammer99" } },
    reason: "Repeated spam in live chat",
    createdAt: new Date("2026-04-20"),
  },
  {
    action: "content.remove",
    severity: "info",
    actor: { userId: "mod_001", role: "moderator" },
    target: { type: "content", id: "post_xyz" },
    reason: "Violates community guidelines",
    createdAt: new Date("2026-04-22"),
  },
];

export async function runSeed(db: {
  collection: (name: string) => {
    updateOne: (filter: object, update: object, opts: object) => Promise<void>;
  };
}): Promise<void> {
  const reps = db.collection("supporter_reputations");
  for (const rep of seedReputations) {
    await reps.updateOne({ _id: rep._id }, { $setOnInsert: { ...rep, updatedAt: new Date() } }, { upsert: true });
  }

  const events = db.collection("audit_events");
  for (const event of seedAuditEvents) {
    await events.updateOne({ "target.id": event.target.id, action: event.action }, { $setOnInsert: event }, { upsert: true });
  }

  console.log("[seed] done — reputations and audit events seeded");
}
