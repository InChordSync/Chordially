import { Injectable } from "@nestjs/common"
import bcrypt from "bcryptjs"

// Cost factor for bcrypt. This is not a secret and is deliberately not an env
// var: verification reads the cost back out of the stored hash, so changing it
// never invalidates existing credentials, but every new hash gets more
// expensive to produce. It is a one-value knob, owned here.
export const PASSWORD_SALT_ROUNDS = 10

/**
 * The seam tests substitute.
 *
 * `PasswordService` is the only place in the app that touches bcrypt, so a
 * test that needs a known password can hand any implementation of this to the
 * code under test instead of paying for real hashing. It also keeps the
 * `register` / `login` / `reset` paths from having to care which hashing
 * library is underneath.
 */
export interface PasswordHasher {
  /** Hashes a plaintext password into a storable digest. */
  hash(plaintext: string): Promise<string>
  /** Resolves false when `plaintext` does not match `hash`. */
  compare(plaintext: string, hash: string): Promise<boolean>
}

@Injectable()
export class PasswordService implements PasswordHasher {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, PASSWORD_SALT_ROUNDS)
  }

  async compare(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash)
  }
}

/**
 * Instance for the module-level services that predate Nest DI. `authService`
 * is still a plain exported object rather than an `@Injectable()` class, so it
 * cannot take constructor injection yet. Once it is converted, inject
 * `PasswordService` and delete this.
 */
export const passwordService: PasswordHasher = new PasswordService()
