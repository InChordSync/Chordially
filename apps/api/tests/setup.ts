import { afterAll, beforeEach, vi } from "vitest"
import { prisma } from "../src/shared/database/prisma.js"

// Wallet creation on signup involves two external services (AWS KMS and the
// Stellar Friendbot). Tests should never depend on real network access or
// credentials for those, so they're mocked globally here rather than in every
// test file that happens to register a user.
vi.mock("../src/modules/wallet/services/wallet-crypto.service.js", () => ({
  encryptSecret: vi.fn(async (plaintext: string) => ({
    encryptedSecret: Buffer.from(plaintext).toString("base64"),
    encryptedDataKey: "test-encrypted-data-key",
    iv: "test-iv",
    authTag: "test-auth-tag",
  })),
  decryptSecret: vi.fn(async (encrypted: { encryptedSecret: string }) =>
    Buffer.from(encrypted.encryptedSecret, "base64").toString("utf8")
  ),
}))

vi.mock("../src/shared/stellar/client.js", async () => {
  const { HorizonStellarClient } = await vi.importActual<typeof import("@chordially/stellar")>(
    "@chordially/stellar"
  )

  const client = new HorizonStellarClient({
    network: "testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
  })

  return {
    stellarClient: {
      // Keypair generation is pure local crypto, so it's fine to keep real.
      generateKeypair: client.generateKeypair.bind(client),
      getAccount: vi.fn(),
      getNativeBalance: vi.fn(async () => "10000.0000000"),
      fundTestnetAccount: vi.fn(async () => undefined),
      isAccountNotFoundError: client.isAccountNotFoundError.bind(client),
      submitPayment: vi.fn(async () => ({
        hash: `test-hash-${Math.random().toString(36).slice(2)}`,
        ledger: 1,
        successful: true,
      })),
      submitSplitPayment: vi.fn(async () => ({
        hash: `test-split-hash-${Math.random().toString(36).slice(2)}`,
        ledger: 1,
        successful: true,
      })),
      isTransientSubmissionError: client.isTransientSubmissionError.bind(client),
      listSentPayments: vi.fn(async () => []),
      sponsorAccountCreation: vi.fn(async () => ({
        hash: `test-sponsor-hash-${Math.random().toString(36).slice(2)}`,
        ledger: 1,
        successful: true,
      })),
      getSponsorBalance: vi.fn(async () => "10000.0000000"),
      isInsufficientSponsorBalanceError: vi.fn(() => false),
      establishTrustline: vi.fn(async () => ({
        hash: `test-trustline-hash-${Math.random().toString(36).slice(2)}`,
        ledger: 1,
        successful: true,
      })),
      hasTrustline: vi.fn(async () => true),
      getAssetBalance: vi.fn(async () => "0.0000000"),
    },
  }
})

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
