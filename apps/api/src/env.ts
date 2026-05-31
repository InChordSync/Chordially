import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().min(1).default("chordially-api"),
  /** Secret used to sign and verify JWT access tokens. */
  JWT_SECRET: z.string().min(16).default("change-me-in-production-min-16ch"),
  /** Access token lifetime in seconds (default 15 minutes). */
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  /** Refresh token lifetime in seconds (default 7 days). */
  REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  /** Rate-limit sliding window in milliseconds (default 15 minutes). */
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  /** Max registration attempts per window per IP. */
  RATE_LIMIT_REGISTER_MAX: z.coerce.number().int().positive().default(5),
  /** Max login attempts per window per IP. */
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(10),
  /** Max refresh attempts per window per IP. */
  RATE_LIMIT_REFRESH_MAX: z.coerce.number().int().positive().default(30),
  /**
   * Comma-separated list of emails that should be treated as disabled accounts.
   * Intended for starter/demo flows (e.g. "disabled@example.com,other@example.com").
   */
  DISABLED_ACCOUNTS: z.string().optional().default(""),
  /**
   * Comma-separated list of emails that should be treated as banned accounts.
   * Intended for starter/demo flows (e.g. "banned@example.com").
   */
  BANNED_ACCOUNTS: z.string().optional().default(""),
});

export const env = schema.parse(process.env);
