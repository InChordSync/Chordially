import path from "node:path"
import { fileURLToPath } from "node:url"
import { configDefaults, defineConfig } from "vitest/config"
import swc from "unplugin-swc"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Vitest's default esbuild transform drops decorator metadata, so Nest
  // cannot resolve constructor-injected providers in unit tests.
  plugins: [swc.vite({ tsconfigFile: "./tsconfig.json" })],
  resolve: {
    alias: {
      "@chordially/shared": path.resolve(dirname, "../../packages/shared/src/index.ts"),
      "@chordially/stellar": path.resolve(dirname, "../../packages/stellar/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 10000,
    // Tests share a single SQLite file; run test files sequentially to
    // avoid concurrent-write lock errors against that shared database.
    fileParallelism: false,
    // The Stellar Testnet demo lives under e2e/ and only runs via
    // `pnpm test:e2e:testnet` (see vitest.e2e.config.ts) — it needs real
    // network access and takes real ledger-close time, so it's excluded
    // from the normal fast/offline test run.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
})
