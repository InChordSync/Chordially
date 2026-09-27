export function maskWalletPublicKeyForLogging(address: string): string {
  if (!address || address.length < 8) return '****';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
