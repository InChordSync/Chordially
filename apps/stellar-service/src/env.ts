import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4100),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  STELLAR_NETWORK: z.enum(["testnet", "mainnet"]).default("testnet"),
  HORIZON_URL: z.string().url().default("https://horizon-testnet.stellar.org")
});

export const env = schema.parse(process.env);
