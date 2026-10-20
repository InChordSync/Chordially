import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { contractsDir, listContracts, repoRoot } from './lib/contracts.mjs'
import { LOCAL } from './lib/local-network.mjs'

const sh = (cmd, args, cwd = repoRoot) => {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout)
    process.exit(res.status ?? 1)
  }
  return res.stdout.trim()
}

const net = [
  '--rpc-url',
  LOCAL.rpcUrl,
  '--network-passphrase',
  LOCAL.passphrase,
]
sh('stellar', ['network', 'add', 'local', ...net])
if (spawnSync('stellar', ['keys', 'address', 'local-deployer']).status !== 0) {
  sh('stellar', [
    'keys',
    'generate',
    'local-deployer',
    '--network',
    'local',
    '--fund',
  ])
}

const ids = {}
for (const c of listContracts()) {
  sh('stellar', ['contract', 'build'], c.dir)
  ids[c.name] = sh('stellar', [
    'contract',
    'deploy',
    '--wasm',
    c.wasm,
    '--source',
    'local-deployer',
    '--network',
    'local',
  ])
  console.log(`${c.name}: ${ids[c.name]}`)
}

mkdirSync(join(contractsDir, 'deployments'), { recursive: true })
writeFileSync(
  join(contractsDir, 'deployments', 'local.json'),
  JSON.stringify(ids, null, 2) + '\n'
)
const env = [
  'STELLAR_NETWORK=local',
  `STELLAR_NETWORK_PASSPHRASE="${LOCAL.passphrase}"`,
  `HORIZON_URL=${LOCAL.horizonUrl}`,
  `SOROBAN_RPC_URL=${LOCAL.rpcUrl}`,
  `FRIENDBOT_URL=${LOCAL.friendbotUrl}`,
  ...Object.entries(ids).map(
    ([n, id]) => `CONTRACT_ID_${n.toUpperCase().replaceAll('-', '_')}=${id}`
  ),
]
writeFileSync(join(repoRoot, '.env.local'), env.join('\n') + '\n')
