export type CredentialTrustLevel = 'trusted' | 'untrusted' | 'pending_review'

export interface WalletCredential {
  publicKey: string
  network: string
  verifiedAt: string | null
  linkedAt: string
  sessionCount: number
  ageDays: number
}

export interface CredentialRule {
  name: string
  trustLevel: CredentialTrustLevel
  conditions: string[]
}

const trustRules: CredentialRule[] = [
  { name: 'high-verification', trustLevel: 'trusted', conditions: ['verified_at IS NOT NULL', 'age_days > 30', 'session_count > 5'] },
  { name: 'recent-verified', trustLevel: 'trusted', conditions: ['verified_at IS NOT NULL', 'age_days > 7', 'session_count > 2'] },
  { name: 'unverified-active', trustLevel: 'pending_review', conditions: ['verified_at IS NULL', 'age_days > 90'] },
  { name: 'new-unverified', trustLevel: 'untrusted', conditions: ['verified_at IS NULL', 'age_days <= 7'] },
  { name: 'default', trustLevel: 'pending_review', conditions: [] },
]

export function evaluateCredentialTrust(credential: WalletCredential): CredentialTrustLevel {
  if (credential.verifiedAt && credential.ageDays > 30 && credential.sessionCount > 5) return 'trusted'
  if (credential.verifiedAt && credential.ageDays > 7 && credential.sessionCount > 2) return 'trusted'
  if (credential.verifiedAt === null && credential.ageDays > 90) return 'pending_review'
  if (credential.verifiedAt === null && credential.ageDays <= 7) return 'untrusted'
  return 'pending_review'
}

export function canMergeAccounts(sourceTrust: CredentialTrustLevel, targetTrust: CredentialTrustLevel): boolean {
  if (sourceTrust === 'trusted' && targetTrust === 'trusted') return true
  if (sourceTrust === 'trusted' && targetTrust === 'pending_review') return true
  return false
}

export function getMergeRestrictions(sourceTrust: CredentialTrustLevel): string[] {
  const restrictions: string[] = []
  if (sourceTrust !== 'trusted') restrictions.push('Requires admin approval')
  if (sourceTrust === 'untrusted') restrictions.push('Cannot transfer wallet linkage')
  if (sourceTrust === 'pending_review') restrictions.push('Limited to 100 XLM transfer')
  return restrictions
}
