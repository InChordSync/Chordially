import type { RegisterResponse } from "@chordially/types/src/auth-contracts.js";

export type AccountState = "verify-email" | "active";

/** Maps the API registration message to a UI account state. */
export function deriveState(message: RegisterResponse["message"]): AccountState {
  return message === "VERIFY_EMAIL" ? "verify-email" : "active";
}
