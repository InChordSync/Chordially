import { Keypair } from "@chordially/stellar"
import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../../../app.js"
import { prisma } from "../../../shared/database/prisma.js"

const app = createApp()

async function getChallenge(publicKey: string) {
  const res = await request(app).get(`/api/wallet/link-challenge?publicKey=${publicKey}`)
  return res.body as { challenge: string; nonce: string }
}

describe("POST /api/auth/register-linked", () => {
  it("registers a new user with a linked wallet after proving control of it", async () => {
    const external = Keypair.random()
    const { challenge, nonce } = await getChallenge(external.publicKey())
    const signature = external.sign(Buffer.from(nonce, "utf8")).toString("base64")

    const res = await request(app).post("/api/auth/register-linked").send({
      email: "linked-happy@test.com",
      password: "Password1!",
      publicKey: external.publicKey(),
      challenge,
      signature,
    })

    expect(res.status).toBe(201)
    expect(typeof res.body.token).toBe("string")

    const wallet = await prisma.wallet.findUnique({ where: { publicKey: external.publicKey() } })
    expect(wallet?.walletType).toBe("linked")
    expect(wallet?.encryptedSecret).toBeNull()
  })

  it("rejects a signature from a different key than the one claimed", async () => {
    const claimed = Keypair.random()
    const actual = Keypair.random()
    const { challenge, nonce } = await getChallenge(claimed.publicKey())
    const signature = actual.sign(Buffer.from(nonce, "utf8")).toString("base64")

    const res = await request(app).post("/api/auth/register-linked").send({
      email: "linked-badsig@test.com",
      password: "Password1!",
      publicKey: claimed.publicKey(),
      challenge,
      signature,
    })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("INVALID_LINK_PROOF")

    const user = await prisma.user.findUnique({ where: { email: "linked-badsig@test.com" } })
    expect(user).toBeNull()
  })

  it("rejects linking a public key that's already linked to another user", async () => {
    const external = Keypair.random()

    const first = await getChallenge(external.publicKey())
    await request(app)
      .post("/api/auth/register-linked")
      .send({
        email: "linked-first@test.com",
        password: "Password1!",
        publicKey: external.publicKey(),
        challenge: first.challenge,
        signature: external.sign(Buffer.from(first.nonce, "utf8")).toString("base64"),
      })

    const second = await getChallenge(external.publicKey())
    const res = await request(app)
      .post("/api/auth/register-linked")
      .send({
        email: "linked-second@test.com",
        password: "Password1!",
        publicKey: external.publicKey(),
        challenge: second.challenge,
        signature: external.sign(Buffer.from(second.nonce, "utf8")).toString("base64"),
      })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe("WALLET_ALREADY_LINKED")
  })

  it("rejects an expired or forged challenge", async () => {
    const external = Keypair.random()

    const res = await request(app)
      .post("/api/auth/register-linked")
      .send({
        email: "linked-forged@test.com",
        password: "Password1!",
        publicKey: external.publicKey(),
        challenge: "not-a-real-jwt",
        signature: "irrelevant",
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("INVALID_LINK_PROOF")
  })
})
