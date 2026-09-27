export function isChallengeNonceFresh(expiresAtIso: string): boolean {
  const expires = new Date(expiresAtIso).getTime();
  return expires > Date.now();
}
