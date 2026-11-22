import { spawnSync } from 'node:child_process'
import {
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from 'node:fs'
import { join } from 'node:path'
import { listContracts, repoRoot } from './lib/contracts.mjs'

const outRoot = join(repoRoot, 'packages', 'stellar', 'src', 'contracts')
const header = '// GENERATED - do not edit; run pnpm contracts:bindings\n'
mkdirSync(outRoot, { recursive: true })

for (const c of listContracts()) {
  const out = join(outRoot, c.name)
  const res = spawnSync(
    'stellar',
    [
      'contract',
      'bindings',
      'typescript',
      '--wasm',
      c.wasm,
      '--output-dir',
      out,
      '--overwrite',
    ],
    { stdio: 'inherit' }
  )
  if (res.status !== 0) process.exit(res.status ?? 1)
  for (const junk of [
    'package.json',
    'node_modules',
    '.gitignore',
    'tsconfig.json',
    'README.md',
  ]) {
    rmSync(join(out, junk), { recursive: true, force: true })
  }
  const src = join(out, 'src')
  if (existsSync(src)) {
    for (const file of readdirSync(src).filter((f) => f.endsWith('.ts'))) {
      const p = join(src, file)
      const text = readFileSync(p, 'utf8')
      if (!text.startsWith(header)) writeFileSync(p, header + text)
    }
  }
}

const dirs = readdirSync(outRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
writeFileSync(
  join(outRoot, 'index.ts'),
  header +
    dirs
      .map(
        (d) => `export * as ${d.replaceAll('-', '_')} from "./${d}/src/index";`
      )
      .join('\n') +
    '\n'
)
