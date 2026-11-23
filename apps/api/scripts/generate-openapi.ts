import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { openapiSpec } from "../src/modules/openapi/openapi.js"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const target = path.resolve(dirname, "../openapi.json")
const rendered = `${JSON.stringify(openapiSpec, null, 2)}\n`

if (process.argv.includes("--check")) {
  const committed = existsSync(target) ? readFileSync(target, "utf8") : ""
  if (committed !== rendered) {
    console.error("apps/api/openapi.json is out of date. Run `pnpm openapi:generate`.")
    process.exit(1)
  }
  console.log("apps/api/openapi.json matches the source spec.")
} else {
  writeFileSync(target, rendered)
  console.log("Wrote apps/api/openapi.json")
}
