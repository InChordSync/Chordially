import { spawnSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { contractsDir, listContracts } from './lib/contracts.mjs'

const budget = JSON.parse(
  readFileSync(join(contractsDir, 'size-budget.json'), 'utf8')
)
const run = (args, cwd) => {
  const res = spawnSync('stellar', args, { cwd, stdio: 'inherit' })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

const rows = []
for (const c of listContracts()) {
  run(['contract', 'build'], c.dir)
  const raw = statSync(c.wasm).size
  run(['contract', 'optimize', '--wasm', c.wasm], c.dir)
  const optimized = statSync(c.wasm.replace(/\.wasm$/, '.optimized.wasm')).size
  const limit = budget.overrides?.[c.name] ?? budget.default
  rows.push({
    contract: c.name,
    raw,
    optimized,
    budget: limit,
    used: `${((optimized / limit) * 100).toFixed(1)}%`,
    result: optimized <= limit ? 'PASS' : 'FAIL',
  })
}

console.table(rows)
if (rows.some((r) => r.result === 'FAIL')) {
  console.error('WASM size budget exceeded.')
  process.exit(1)
}
