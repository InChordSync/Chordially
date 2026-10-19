import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const contractsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)
export const repoRoot = join(contractsDir, '..')

/** Every contract crate (a directory whose Cargo.toml builds a cdylib). */
export function listContracts() {
  return readdirSync(contractsDir)
    .map((dir) => join(contractsDir, dir, 'Cargo.toml'))
    .filter(
      (manifest) =>
        existsSync(manifest) &&
        readFileSync(manifest, 'utf8').includes('cdylib')
    )
    .map((manifest) => {
      const name = /^name\s*=\s*"([^"]+)"/m.exec(
        readFileSync(manifest, 'utf8')
      )?.[1]
      const dir = dirname(manifest)
      return {
        name,
        dir,
        wasm: join(
          dir,
          'target',
          'wasm32v1-none',
          'release',
          `${name.replaceAll('-', '_')}.wasm`
        ),
      }
    })
}
