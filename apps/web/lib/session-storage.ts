export type StoredAuthSession = {
  token: string;
  refreshToken?: string;
};

const SESSION_KEY = "chordially.session";
const EVENT_NAME = "chordially:session";

function isStoredSession(value: unknown): value is StoredAuthSession {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record["token"] === "string";
}

export function readStoredSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredAuthSession | null): void {
  if (typeof window === "undefined") return;
  if (!session) window.localStorage.removeItem(SESSION_KEY);
  else window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeToStoredSessionChanges(handler: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) handler();
  };
  const onCustom = () => handler();

  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT_NAME, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT_NAME, onCustom);
  };
}

