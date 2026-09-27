import { Keypair } from "@chordially/stellar"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"
import { stellarClient } from "../../../shared/stellar/client.js"
import { walletService } from "../../wallet/services/wallet.service.js"

const app = createApp()

async function registerLinkedFan(email: string) {
  const external = Keypair.random()
  const challengeRes = await request(app).get(
    `/api/wallet/link-challenge?publicKey=${external.publicKey()}`
  )
  const { challenge, nonce } = challengeRes.body as { challenge: string; nonce: string }
  const signature = external.sign(Buffer.from(nonce, "utf8")).toString("base64")

  const res = await request(app).post("/api/auth/register-linked").send({
    email,
    password: "Password1!",
    publicKey: external.publicKey(),
    challenge,
    signature,
  })

  return { token: res.body.token as string, userId: res.body.user.id as string, external }
}

async function createCreatorWithWallet(email: string, slug: string) {
  const user = await prisma.user.create({ data: { email, passwordHash: "hash" } })
  const creator = await prisma.creatorProfile.create({
    data: { userId: user.id, displayName: slug, slug },
  })
  await walletService.createWalletForUser(user.id)
  return creator
}

beforeEach(() => {
  vi.mocked(stellarClient.buildPaymentTransactionXdr).mockClear()
  vi.mocked(stellarClient.submitSignedTransactionXdr).mockReset()
  vi.mocked(stellarClient.submitSignedTransactionXdr).mockResolvedValue({
    hash: "linked-tip-hash",
    ledger: 5,
    successful: true,
  })
})

describe("POST /api/tips from a linked fan wallet", () => {
  it("returns an unsigned transaction instead of confirming immediately", async () => {
    const { token } = await registerLinkedFan("linked-fan-tip@test.com")
    const creator = await createCreatorWithWallet("linked-tip-creator@test.com", "linked-tip-creator")

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe("awaiting_signature")
    expect(res.body.unsignedTransactionXdr).toBe("test-unsigned-payment-xdr")
    expect(stellarClient.buildPaymentTransactionXdr).toHaveBeenCalledTimes(1)
  })

  it("fails fast rather than attempting split tips for a linked wallet", async () => {
    const { token } = await registerLinkedFan("linked-fan-split@test.com")
    const host = await createCreatorWithWallet("linked-split-host@test.com", "linked-split-host")
    const bob = await createCreatorWithWallet("linked-split-bob@test.com", "linked-split-bob")

    const stream = await prisma.stream.create({ data: { creatorId: host.id } })
    await prisma.streamPayoutConfig.create({
      data: {
        streamId: stream.id,
        payees: {
          create: [
            { creatorId: host.id, percentage: 60 },
            { creatorId: bob.id, percentage: 40 },
          ],
        },
      },
    })

    const res = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({
        creatorId: host.id,
        streamId: stream.id,
        amount: "10",
        idempotencyKey: crypto.randomUUID(),
      })

    expect(res.status).toBe(201)
    expect(res.body.status).toBe("failed")
    expect(res.body.failureReason).toContain("Split tips are not yet supported")
  })
})

describe("POST /api/tips/:id/submit-signed", () => {
  it("confirms the tip once the fan submits their signed transaction", async () => {
    const { token } = await registerLinkedFan("linked-submit-signed@test.com")
    const creator = await createCreatorWithWallet("linked-submit-creator@test.com", "linked-submit-creator")

    const created = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    const res = await request(app)
      .post(`/api/tips/${created.body.id}/submit-signed`)
      .set("Authorization", `Bearer ${token}`)
      .send({ signedTransactionXdr: "signed-xdr-from-external-wallet" })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("confirmed")
    expect(res.body.txHash).toBe("linked-tip-hash")
    expect(stellarClient.submitSignedTransactionXdr).toHaveBeenCalledWith(
      "signed-xdr-from-external-wallet"
    )
  })

  it("fails the tip if the signed submission is rejected by Horizon", async () => {
    const { token } = await registerLinkedFan("linked-submit-fail@test.com")
    const creator = await createCreatorWithWallet("linked-submit-fail-creator@test.com", "linked-submit-fail-creator")

    const created = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    vi.mocked(stellarClient.submitSignedTransactionXdr).mockRejectedValueOnce(
      new Error("bad signature")
    )

    const res = await request(app)
      .post(`/api/tips/${created.body.id}/submit-signed`)
      .set("Authorization", `Bearer ${token}`)
      .send({ signedTransactionXdr: "bad-xdr" })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("failed")
    expect(res.body.failureReason).toContain("bad signature")
  })

  it("rejects submitting a signature for a tip that isn't awaiting one", async () => {
    const { token } = await registerLinkedFan("linked-submit-notawaiting@test.com")
    const creator = await createCreatorWithWallet("linked-notawaiting-creator@test.com", "linked-notawaiting-creator")

    const created = await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    await request(app)
      .post(`/api/tips/${created.body.id}/submit-signed`)
      .set("Authorization", `Bearer ${token}`)
      .send({ signedTransactionXdr: "signed-once" })

    const res = await request(app)
      .post(`/api/tips/${created.body.id}/submit-signed`)
      .set("Authorization", `Bearer ${token}`)
      .send({ signedTransactionXdr: "signed-again" })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("TIP_NOT_AWAITING_SIGNATURE")
  })

  it("never decrypts a secret for a linked wallet's tip (regression guard)", async () => {
    const { token, userId } = await registerLinkedFan("linked-no-decrypt@test.com")
    const creator = await createCreatorWithWallet("linked-no-decrypt-creator@test.com", "linked-no-decrypt-creator")

    await request(app)
      .post("/api/tips")
      .set("Authorization", `Bearer ${token}`)
      .send({ creatorId: creator.id, amount: "5", idempotencyKey: crypto.randomUUID() })

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } })
    expect(wallet.walletType).toBe("linked")
    expect(wallet.encryptedSecret).toBeNull()
    // buildPaymentTransactionXdr only needs a public key — proof enough
    // that the linked path never touched decryptSecret/wallet-crypto.
    expect(stellarClient.buildPaymentTransactionXdr).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePublicKey: wallet.publicKey })
    )
  })
})
