import { randomBytes } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"

// The global test setup mocks this whole module so registration tests don't
// need AWS credentials; unmock it here since this file tests the real logic.
vi.unmock("../services/wallet-crypto.service.js")

const sendMock = vi.fn()

vi.mock("@aws-sdk/client-kms", () => {
  class GenerateDataKeyCommand {
    constructor(public input: unknown) {}
  }
  class DecryptCommand {
    constructor(public input: unknown) {}
  }
  class KMSClient {
    send = sendMock
  }
  return { KMSClient, GenerateDataKeyCommand, DecryptCommand }
})

const { encryptSecret, decryptSecret } = await import("../services/wallet-crypto.service.js")

describe("wallet crypto envelope encryption", () => {
  afterEach(() => {
    sendMock.mockReset()
  })

  it("encrypts a secret using a KMS-issued data key and decrypts it back", async () => {
    const dataKey = randomBytes(32)

    sendMock.mockImplementation((command: { input: { CiphertextBlob?: Uint8Array } }) => {
      if ("CiphertextBlob" in command.input) {
        return Promise.resolve({ Plaintext: dataKey })
      }
      return Promise.resolve({ Plaintext: dataKey, CiphertextBlob: Buffer.from("wrapped-key") })
    })

    const secret = "SDNMCVXKW4XZOLXPYIBLK2QIF5NSXAOJXTIQBGOZAJIQ7WBHXKQXPZ4A"
    const encrypted = await encryptSecret(secret)

    expect(encrypted.encryptedSecret).not.toBe(secret)
    expect(encrypted.encryptedDataKey).toBe(Buffer.from("wrapped-key").toString("base64"))

    const decrypted = await decryptSecret(encrypted)
    expect(decrypted).toBe(secret)
  })

  it("throws when KMS returns no plaintext data key", async () => {
    sendMock.mockResolvedValue({})

    await expect(encryptSecret("some-secret")).rejects.toThrow(
      "KMS did not return a usable data key"
    )
  })
})

describe("wallet crypto decrypt failure paths", () => {
  const dataKey = randomBytes(32)

  function setupHappyPath() {
    sendMock.mockImplementation((command: { input: { CiphertextBlob?: Uint8Array } }) => {
      if ("CiphertextBlob" in command.input) {
        return Promise.resolve({ Plaintext: dataKey })
      }
      return Promise.resolve({ Plaintext: dataKey, CiphertextBlob: Buffer.from("wrapped-key") })
    })
  }

  afterEach(() => {
    sendMock.mockReset()
  })

  it("rejects with the underlying error when KMS is unavailable during decrypt", async () => {
    setupHappyPath()
    const secret = "SOMEPLAINTEXTSECRETVALUEFORTHETEST"
    const encrypted = await encryptSecret(secret)

    // DecryptCommand carries a CiphertextBlob, so reject only that leg.
    sendMock.mockImplementation((command: { input: { CiphertextBlob?: Uint8Array } }) => {
      if ("CiphertextBlob" in command.input) {
        return Promise.reject(new Error("KMS temporarily unavailable"))
      }
      return Promise.resolve({ Plaintext: dataKey, CiphertextBlob: Buffer.from("wrapped-key") })
    })

    await expect(decryptSecret(encrypted)).rejects.toThrow("KMS temporarily unavailable")
  })

  it("rejects when KMS returns no plaintext data key during decrypt", async () => {
    setupHappyPath()
    const secret = "ANOTHERPLAINTEXTSECRETVALUE"
    const encrypted = await encryptSecret(secret)

    sendMock.mockImplementation((command: { input: { CiphertextBlob?: Uint8Array } }) => {
      if ("CiphertextBlob" in command.input) {
        return Promise.resolve({}) // no Plaintext
      }
      return Promise.resolve({ Plaintext: dataKey, CiphertextBlob: Buffer.from("wrapped-key") })
    })

    await expect(decryptSecret(encrypted)).rejects.toThrow(
      "KMS did not return a usable data key"
    )
  })

  it("rejects corrupted ciphertext instead of returning garbage", async () => {
    setupHappyPath()
    const secret = "CORRUPTIONTESTPLAINTEXT"
    const encrypted = await encryptSecret(secret)

    // Flip a base64 character in the ciphertext so GCM authentication fails.
    const corrupted = {
      ...encrypted,
      encryptedSecret:
        (encrypted.encryptedSecret[0] === "A" ? "B" : "A") + encrypted.encryptedSecret.slice(1),
    }

    await expect(decryptSecret(corrupted)).rejects.toThrow()
  })

  it("rejects a tampered auth tag", async () => {
    setupHappyPath()
    const secret = "TAMPEREDTAGPLAINTEXT"
    const encrypted = await encryptSecret(secret)

    const tampered = {
      ...encrypted,
      authTag: (encrypted.authTag[0] === "A" ? "B" : "A") + encrypted.authTag.slice(1),
    }

    await expect(decryptSecret(tampered)).rejects.toThrow()
  })

  it("rejects an invalid base64 iv instead of crashing the process", async () => {
    setupHappyPath()
    const secret = "BADIVPLAINTEXT"
    const encrypted = await encryptSecret(secret)

    await expect(decryptSecret({ ...encrypted, iv: "!!not-base64!!" })).rejects.toThrow()
  })
})
