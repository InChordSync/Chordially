let inMemorySecureStore: Record<string, string> = {}

export async function setSecureItem(key: string, value: string): Promise<void> {
  inMemorySecureStore[key] = value
}

export async function getSecureItem(key: string): Promise<string | null> {
  return inMemorySecureStore[key] ?? null
}

export async function deleteSecureItem(key: string): Promise<void> {
  delete inMemorySecureStore[key]
}
