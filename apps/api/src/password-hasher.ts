import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const SALT_BYTES = 16;
const KEY_LEN = 64;
const SEPARATOR = ":";

// ── Interface ─────────────────────────────────────────────────────────────────

export interface PasswordHasher {
  hash(plaintext: string): Promise<string>;
  verify(plaintext: string, stored: string): Promise<boolean>;
}

// ── scrypt adapter ────────────────────────────────────────────────────────────

/**
 * Hashes passwords with Node's built-in scrypt so no extra dependencies are
 * needed. Stored format: `<hex-salt>:<hex-hash>`.
 */
export class ScryptHasher implements PasswordHasher {
  async hash(plaintext: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES).toString("hex");
    const derived = (await scryptAsync(plaintext, salt, KEY_LEN)) as Buffer;
    return `${salt}${SEPARATOR}${derived.toString("hex")}`;
  }

  async verify(plaintext: string, stored: string): Promise<boolean> {
    const [salt, hash] = stored.split(SEPARATOR);
    if (!salt || !hash) return false;

    const derived = (await scryptAsync(plaintext, salt, KEY_LEN)) as Buffer;
    const storedBuf = Buffer.from(hash, "hex");

    if (derived.length !== storedBuf.length) return false;
    return timingSafeEqual(derived, storedBuf);
  }
}

// ── Singleton for the API process ─────────────────────────────────────────────

export const passwordHasher: PasswordHasher = new ScryptHasher();
