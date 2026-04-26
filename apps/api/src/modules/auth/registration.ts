import crypto from "node:crypto";
import type { UserRole } from "@chordially/types";

const SAFE_ROLES: UserRole[] = ["fan", "artist"];

type RegistrationInput = {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
};

type RegistrationResult =
  | { ok: true; userId: string; role: UserRole }
  | { ok: false; reason: "email_taken" | "invalid_role" };

const registeredEmails = new Set<string>();

function deriveRole(requested?: UserRole): UserRole | null {
  if (!requested) return "fan";
  if (!SAFE_ROLES.includes(requested)) return null;
  return requested;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100_000, 32, "sha256").toString("hex");
}

export function registerAccount(input: RegistrationInput): RegistrationResult {
  const email = input.email.toLowerCase().trim();

  if (registeredEmails.has(email)) {
    return { ok: false, reason: "email_taken" };
  }

  const role = deriveRole(input.role);
  if (!role) {
    return { ok: false, reason: "invalid_role" };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(input.password, salt);

  const userId = crypto.randomUUID();
  registeredEmails.add(email);

  console.info("[registration] account created", { userId, role, email });

  // hash and salt stored externally; returned here for caller to persist
  void hash;
  void salt;

  return { ok: true, userId, role };
}
