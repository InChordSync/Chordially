import { describe, expect, it } from "vitest"
import {
  PASSWORD_SALT_ROUNDS,
  PasswordService,
  passwordService,
  type PasswordHasher,
} from "../services/password.service.js"

describe("PasswordService", () => {
  const service = new PasswordService()

  it("round-trips a password through hash and compare", async () => {
    const hash = await service.hash("correct horse battery staple")

    expect(hash).not.toBe("correct horse battery staple")
    await expect(service.compare("correct horse battery staple", hash)).resolves.toBe(true)
  })

  it("rejects a wrong password against the same hash", async () => {
    const hash = await service.hash("correct horse battery staple")

    await expect(service.compare("Correct horse battery staple", hash)).resolves.toBe(false)
    await expect(service.compare("", hash)).resolves.toBe(false)
  })

  it("uses the same salt rounds as before the migration", async () => {
    const hash = await service.hash("irrelevant")

    // bcrypt encodes its cost as the third $-delimited segment ($2a$10$...).
    expect(hash.split("$")[2]).toBe(String(PASSWORD_SALT_ROUNDS).padStart(2, "0"))
  })

  it("salts, so the same password never produces the same digest twice", async () => {
    const [first, second] = await Promise.all([service.hash("same input"), service.hash("same input")])

    expect(first).not.toBe(second)
    await expect(service.compare("same input", first)).resolves.toBe(true)
    await expect(service.compare("same input", second)).resolves.toBe(true)
  })

  it("is substitutable in tests without touching bcrypt", async () => {
    // The point of the PasswordHasher interface: a test double satisfies it
    // without a dependency on the hashing implementation.
    const stub: PasswordHasher = {
      hash: async (plaintext) => `stub:${plaintext}`,
      compare: async (plaintext, hash) => hash === `stub:${plaintext}`,
    }

    const hash = await stub.hash("hunter2")
    expect(hash).toBe("stub:hunter2")
    await expect(stub.compare("hunter2", hash)).resolves.toBe(true)
    await expect(stub.compare("wrong", hash)).resolves.toBe(false)
  })

  it("exposes a ready-to-use instance for the services that predate DI", async () => {
    const hash = await passwordService.hash("still works")

    await expect(passwordService.compare("still works", hash)).resolves.toBe(true)
  })
})
