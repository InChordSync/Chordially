import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const channel = /channel\s*=\s*"([^"]+)"/.exec(
  readFileSync(join(root, 'rust-toolchain.toml'), 'utf8')
)?.[1]
const cliVersion = readFileSync(
  join(root, 'STELLAR_CLI_VERSION'),
  'utf8'
).trim()

const out = (cmd, args) => {
  const res = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' })
  return res.status === 0 ? res.stdout.trim() : null
}

const rustc = out('rustc', ['--version'])
const targets = out('rustup', ['target', 'list', '--installed']) ?? ''
const stellar = out('stellar', ['--version'])

const checks = [
  [
    `rustc ${channel}`,
    rustc?.startsWith(`rustc ${channel}`),
    'curl https://sh.rustup.rs -sSf | sh   (the pinned toolchain installs itself on first cargo call)',
  ],
  [
    'target wasm32v1-none',
    targets.includes('wasm32v1-none'),
    'rustup target add wasm32v1-none',
  ],
  [
    `stellar CLI ${cliVersion}`,
    stellar?.includes(cliVersion),
    `cargo install --locked stellar-cli --version ${cliVersion}`,
  ],
]

let failed = false
for (const [name, ok, fix] of checks) {
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      fix: ${fix}`}`
  )
  failed ||= !ok
}
process.exit(failed ? 1 : 0)
