import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().default(""),
  AWS_S3_BUCKET: z.string().default(""),
  AWS_KMS_KEY_ID: z.string().default(""),
  STELLAR_NETWORK: z.enum(["testnet", "public"]).default("testnet"),
  STELLAR_HORIZON_URL: z.string().default("https://horizon-testnet.stellar.org"),
  STELLAR_FRIENDBOT_URL: z.string().default("https://friendbot.stellar.org"),
  // Secret key of the platform's sponsor account, which funds new users'
  // base reserves so they never need to hold XLM before their first
  // transaction. When unset, wallet creation falls back to Friendbot, which
  // only works on testnet — intended for local development only.
  STELLAR_SPONSOR_SECRET_KEY: z.string().default(""),
  // Public key half of STELLAR_SPONSOR_SECRET_KEY, kept as its own variable
  // so nothing outside `packages/stellar` ever needs to derive a public key
  // from a secret (and apps/api never needs a direct stellar-sdk dependency).
  STELLAR_SPONSOR_PUBLIC_KEY: z.string().default(""),
  // Sponsor balance (in XLM) below which a low-balance warning is logged
  // and recorded as a metric on every wallet creation.
  STELLAR_SPONSOR_LOW_BALANCE_XLM: z.coerce.number().positive().default(50),
  // Issuer of the USDC asset tips/wallets can opt into alongside native
  // XLM. Defaults to Circle's official testnet USDC issuer, matching
  // STELLAR_NETWORK's own testnet default.
  STELLAR_USDC_ISSUER: z
    .string()
    .default("GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
  // Base URL of the SEP-10/SEP-24 anchor used for fiat deposits. Swappable
  // per environment: a testnet reference anchor locally, a licensed anchor
  // in production.
  ANCHOR_BASE_URL: z.string().default("https://testanchor.stellar.org/sep24"),
  // Minimum amount a creator can cash out in one payout, to keep payouts
  // from being smaller than the anchor's own fiat-settlement fees are
  // likely to be.
  CREATOR_PAYOUT_MINIMUM_AMOUNT: z.coerce.number().positive().default(10),
  TIP_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(10_000),
  TIP_RATE_LIMIT_PER_FAN: z.coerce.number().int().positive().default(5),
  TIP_RATE_LIMIT_PER_STREAM: z.coerce.number().int().positive().default(30),
  // Conservative app-wide IP limit applied as defense-in-depth under every
  // feature limiter. Deliberately looser than feature-level limits so it
  // catches aggregate abuse without masking a single endpoint's own budget.
  GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1200),
  // Per-user limit on starting creator payout withdrawals. Deliberately
  // stricter than the global IP limit: starting a real-money cash-out is a
  // high-cost operation we want to bound tightly per account.
  CREATOR_PAYOUT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  CREATOR_PAYOUT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  // Per-email limit on account registration. Combined with the generic
  // duplicate-email response (see auth.service createUserAccount), this keeps
  // bulk email probing both expensive and non-informative.
  REGISTER_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  REGISTER_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  RECONCILIATION_ENABLED: z.coerce.boolean().default(true),
  RECONCILIATION_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  // How long a tip can sit in "submitted" before reconciliation will look at
  // it at all (gives a normal in-flight submission time to finish).
  RECONCILIATION_STUCK_THRESHOLD_MS: z.coerce.number().int().positive().default(60_000),
  // How long a tip can stay unresolved before reconciliation gives up and
  // dead-letters it as failed.
  RECONCILIATION_DEAD_LETTER_THRESHOLD_MS: z.coerce.number().int().positive().default(300_000),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)
