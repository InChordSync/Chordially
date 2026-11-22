import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const task = process.argv[2]

const hasCargo =
  spawnSync('cargo', ['--version'], { stdio: 'ignore' }).status === 0
if (!hasCargo) {
  if (process.env.CI === 'true') {
    console.error(
      `contracts:${task}: cargo not found; CI must not skip contract checks.`
    )
    process.exit(1)
  }
  console.log(
    `contracts:${task}: cargo not found, skipping. Install Rust: https://rustup.rs`
  )
  process.exit(0)
}

const run = (cmd, args, cwd = root) => {
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit' })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

if (task === 'test') {
  run('cargo', ['test', '--workspace'])
} else if (task === 'lint') {
  run('cargo', [
    'clippy',
    '--workspace',
    '--all-targets',
    '--',
    '-D',
    'warnings',
  ])
  run('cargo', ['fmt', '--all', '--check'])
} else if (task === 'build') {
  run('cargo', [
    'build',
    '-p',
    'chordially-common',
    '--target',
    'wasm32v1-none',
  ])
  for (const name of readdirSync(root)) {
    const manifest = join(root, name, 'Cargo.toml')
    if (
      existsSync(manifest) &&
      readFileSync(manifest, 'utf8').includes('cdylib')
    ) {
      run('stellar', ['contract', 'build'], join(root, name))
    }
  }
} else {
  console.error(`Unknown task "${task}". Use build, test or lint.`)
  process.exit(2)
}
