import { describe, expect, it } from "vitest"
import { prisma } from "../src/shared/database/prisma.js"

/**
 * Regression guard for the indexes added in issues #1346, #1347 and #1350.
 * Each query below is the exact shape used by a service at runtime; the test
 * asks SQLite's planner to prove it actually uses the declared index rather
 * than scanning the whole table.
 */
const QUERIES = [
  {
    name: "reconciliation scans stuck tips by status",
    index: "Tip_status_updatedAt_idx",
    sql: `SELECT * FROM "Tip" WHERE "status" = 'submitted' AND "updatedAt" < '2026-01-01' ORDER BY "updatedAt" ASC LIMIT 50`,
  },
  {
    name: "creator tip feed",
    index: "Tip_creatorId_createdAt_idx",
    sql: `SELECT * FROM "Tip" WHERE "creatorId" = 'x' ORDER BY "createdAt" DESC LIMIT 20`,
  },
  {
    name: "live stream tip backlog",
    index: "Tip_streamId_createdAt_idx",
    sql: `SELECT * FROM "Tip" WHERE "streamId" = 'x' ORDER BY "createdAt" DESC LIMIT 20`,
  },
  {
    name: "split payouts by tip",
    index: "TipPayout_tipId_idx",
    sql: `SELECT * FROM "TipPayout" WHERE "tipId" = 'x'`,
  },
  {
    name: "creator earnings from tip payouts",
    index: "TipPayout_creatorId_idx",
    sql: `SELECT * FROM "TipPayout" WHERE "creatorId" = 'x'`,
  },
  {
    name: "live streams by creator",
    index: "Stream_creatorId_endedAt_idx",
    sql: `SELECT * FROM "Stream" WHERE "creatorId" = 'x' AND "endedAt" IS NULL`,
  },
  {
    name: "payout config payees by creator",
    index: "StreamPayoutConfigPayee_creatorId_idx",
    sql: `SELECT * FROM "StreamPayoutConfigPayee" WHERE "creatorId" = 'x'`,
  },
  {
    name: "creator directory filters",
    index: "CreatorProfile_isVerified_idx",
    sql: `SELECT * FROM "CreatorProfile" WHERE "genre" = 'jazz' AND "location" = 'NYC' AND "isVerified" = 1`,
  },
  {
    name: "notification inbox",
    index: "Notification_recipientId_createdAt_idx",
    sql: `SELECT * FROM "Notification" WHERE "recipientId" = 'x' ORDER BY "createdAt" DESC LIMIT 20`,
  },
]

describe("query plans use the declared indexes", () => {
  for (const { name, index, sql } of QUERIES) {
    it(name, async () => {
      const rows = await prisma.$queryRawUnsafe<Array<{ detail: string }>>(
        `EXPLAIN QUERY PLAN ${sql}`
      )
      const plan = rows.map((row) => row.detail).join(" | ")
      expect(plan).toContain(`USING INDEX ${index}`)
    })
  }
})
