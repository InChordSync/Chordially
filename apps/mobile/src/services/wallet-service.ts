import { apiFetch } from './api-client'
import type { WalletConnection, WalletLinkResponse, WalletUnlinkResponse } from '../types/wallet'

export async function requestWalletLink(userId: string): Promise<{ challenge: string }> {
  return apiFetch<{ challenge: string }>('/api/wallet/link', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

export async function verifyWalletSignature(challenge: string, signature: string, publicKey: string): Promise<WalletConnection> {
  const result = await apiFetch<WalletLinkResponse>('/api/wallet/verify', {
    method: 'POST',
    body: JSON.stringify({ challenge, signature, publicKey }),
  })
  return result.connection
}

export async function unlinkWallet(userId: string): Promise<WalletUnlinkResponse> {
  return apiFetch<WalletUnlinkResponse>('/api/wallet/unlink', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

export async function getWalletConnection(userId: string): Promise<WalletConnection | null> {
  try {
    return await apiFetch<WalletConnection>(`/api/wallet/connection?userId=${userId}`)
  } catch {
    return null
  }
}
