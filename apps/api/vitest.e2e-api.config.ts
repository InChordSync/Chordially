import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import swc from "unplugin-swc"

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * HTTP-level e2e suite for the Nest API (distinct from vitest.e2e.config.ts,
 * which drives the real Stellar Testnet demo). Runs against the ephemeral
 * test database and needs no external services.
 */
export default defineConfig({
  plugins: [swc.vite({ tsconfigFile: "./tsconfig.json" })],
  resolve: {
    alias: {
      "@chordially/shared": path.resolve(dirname, "../../packages/shared/src/index.ts"),
      "@chordially/stellar": path.resolve(dirname, "../../packages/stellar/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
