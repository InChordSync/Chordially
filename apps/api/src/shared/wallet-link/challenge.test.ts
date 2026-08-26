import { Keypair } from "@chordially/stellar"
import { describe, expect, it } from "vitest"
import { issueWalletLinkChallenge, verifyWalletLinkChallenge } from "./challenge.js"

describe("wallet link challenge", () => {
  it("verifies a signature from the claimed key over the issued nonce", () => {
    const signer = Keypair.random()
    const { challenge, nonce } = issueWalletLinkChallenge(signer.publicKey())
    const signature = signer.sign(Buffer.from(nonce, "utf8")).toString("base64")

    expect(verifyWalletLinkChallenge(challenge, signer.publicKey(), signature)).toBe(true)
  })

  it("rejects a signature from a different key than the one the challenge was issued for", () => {
    const claimedSigner = Keypair.random()
    const actualSigner = Keypair.random()
    const { challenge, nonce } = issueWalletLinkChallenge(claimedSigner.publicKey())
    const signature = actualSigner.sign(Buffer.from(nonce, "utf8")).toString("base64")

    expect(verifyWalletLinkChallenge(challenge, claimedSigner.publicKey(), signature)).toBe(false)
  })

  it("rejects a valid signature presented against a different public key than the challenge names", () => {
    const signer = Keypair.random()
    const otherPublicKey = Keypair.random().publicKey()
    const { challenge, nonce } = issueWalletLinkChallenge(signer.publicKey())
    const signature = signer.sign(Buffer.from(nonce, "utf8")).toString("base64")

    expect(verifyWalletLinkChallenge(challenge, otherPublicKey, signature)).toBe(false)
  })

  it("rejects a tampered challenge token", () => {
    const signer = Keypair.random()
    const { challenge, nonce } = issueWalletLinkChallenge(signer.publicKey())
    const signature = signer.sign(Buffer.from(nonce, "utf8")).toString("base64")

    expect(verifyWalletLinkChallenge(`${challenge}tampered`, signer.publicKey(), signature)).toBe(
      false
    )
  })

  it("rejects a garbage signature rather than throwing", () => {
    const signer = Keypair.random()
    const { challenge } = issueWalletLinkChallenge(signer.publicKey())

    expect(verifyWalletLinkChallenge(challenge, signer.publicKey(), "not-valid-base64")).toBe(false)
  })
})
