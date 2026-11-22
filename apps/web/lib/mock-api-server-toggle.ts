export function isMockApiServerEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mockApi') === 'true') return true;
  }
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true';
}

export function getMockApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_MOCK_API_URL ?? 'http://localhost:4001';
}
