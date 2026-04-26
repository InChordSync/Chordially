/**
 * Feature flag definitions for incremental rollout.
 *
 * Add new flags to the FLAGS object with a boolean value.
 * Set a flag to `true` to enable the feature for all users,
 * or `false` to keep it hidden behind the flag.
 *
 * Use `getFlag` to read a flag's current value at runtime.
 */

export const FLAGS = {
  ENABLE_TIPPING: false,
  ENABLE_LIVE_SESSION: false,
  ENABLE_BLOCKCHAIN_TIPS: false,
  ENABLE_AI_MODERATION: false,
} as const satisfies Record<string, boolean>;

/** Union type of all valid feature flag keys. */
export type FeatureFlagKey = keyof typeof FLAGS;

/**
 * Returns the current value of the given feature flag.
 *
 * @param key - A key from the FLAGS object.
 * @returns `true` if the feature is enabled, `false` otherwise.
 */
export function getFlag(key: FeatureFlagKey): boolean {
  return FLAGS[key];
}
