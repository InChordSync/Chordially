import { spawnSync } from 'node:child_process'
import { repoRoot } from './contracts.mjs'

export const LOCAL = {
  horizonUrl: process.env.HORIZON_URL ?? 'http://localhost:8000',
  rpcUrl: process.env.SOROBAN_RPC_URL ?? 'http://localhost:8000/soroban/rpc',
  friendbotUrl: process.env.FRIENDBOT_URL ?? 'http://localhost:8000/friendbot',
  passphrase: 'Standalone Network ; February 2017',
}

export function compose(...args) {
  const res = spawnSync(
    'docker',
    ['compose', '-f', 'docker-compose.stellar.yml', ...args],
    {
      cwd: repoRoot,
      stdio: 'inherit',
    }
  )
  if (res.status !== 0) process.exit(res.status ?? 1)
}

async function ready() {
  try {
    const rpc = await fetch(LOCAL.rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
    }).then((r) => r.json())
    const horizon = await fetch(LOCAL.horizonUrl).then((r) => r.json())
    return (
      rpc.result?.status === 'healthy' &&
      Number(horizon.history_latest_ledger) > 1
    )
  } catch {
    return false
  }
}

export async function waitUntilReady(
  timeoutMs = Number(process.env.LOCAL_NETWORK_TIMEOUT_MS ?? 180_000)
) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await ready()) return
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  console.error(
    `Local Stellar network not ready after ${timeoutMs}ms (Horizon ${LOCAL.horizonUrl}, RPC ${LOCAL.rpcUrl}).`
  )
  process.exit(1)
}
