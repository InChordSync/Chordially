import { beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../../../shared/database/prisma.js"
import { paymentIdempotencyGuard } from "../services/payment-idempotency-guard.service.js"

const RECORD = {
  key: "11111111-1111-4111-8111-111111111111",
  ownerId: "owner-1",
  requestPath: "/api/wallet/deposits",
  responseBody: { id: "deposit-1", status: "incomplete" },
  statusCode: 201,
}

describe("PaymentIdempotencyGuardService (database-backed)", () => {
  beforeEach(async () => {
    await prisma.transactionIdempotencyRecord.deleteMany()
  })

  it("reports a key as not a duplicate before any record exists", async () => {
    const result = await paymentIdempotencyGuard.checkOrLockKey(RECORD.key, RECORD.ownerId)
    expect(result.isDuplicate).toBe(false)
    expect(result.previousResponse).toBeUndefined()
  })

  it("records a key after it has been processed", async () => {
    await paymentIdempotencyGuard.saveKeyRecord(RECORD)

    const stored = await prisma.transactionIdempotencyRecord.findUnique({
      where: { ownerId_key: { ownerId: RECORD.ownerId, key: RECORD.key } },
    })
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!.responseBody)).toEqual(RECORD.responseBody)
  })

  it("detects a duplicate request and replays the previous response", async () => {
    await paymentIdempotencyGuard.saveKeyRecord(RECORD)

    const result = await paymentIdempotencyGuard.checkOrLockKey(RECORD.key, RECORD.ownerId)
    expect(result.isDuplicate).toBe(true)
    expect(result.previousResponse).toEqual(RECORD.responseBody)
    expect(typeof result.lockedAt).toBe("string")
  })

  it("scopes keys per owner so different owners never collide", async () => {
    await paymentIdempotencyGuard.saveKeyRecord(RECORD)

    const otherOwner = await paymentIdempotencyGuard.checkOrLockKey(RECORD.key, "owner-2")
    expect(otherOwner.isDuplicate).toBe(false)
  })
})
