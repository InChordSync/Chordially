type AuthSessionSummary = {
  id: string;
  device: string;
  lastSeen: string;
};

type MobileAuthState = {
  isBooting: boolean;
  isOffline: boolean;
  isAuthenticated: boolean;
  activeSessionId: string | null;
  sessions: AuthSessionSummary[];
};

const initialState: MobileAuthState = {
  isBooting: true,
  isOffline: false,
  isAuthenticated: false,
  activeSessionId: null,
  sessions: [],
};

export function createMobileAuthStore(seed: Partial<MobileAuthState> = {}) {
  let state: MobileAuthState = { ...initialState, ...seed };
  const listeners = new Set<(next: MobileAuthState) => void>();

  const emit = () => {
    listeners.forEach((listener) => listener(state));
  };

  const setState = (patch: Partial<MobileAuthState>) => {
    state = { ...state, ...patch };
    emit();
  };

  return {
    getState: () => state,
    subscribe: (listener: (next: MobileAuthState) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    boot: ({ sessionId, sessions }: { sessionId?: string | null; sessions?: AuthSessionSummary[] } = {}) =>
      setState({
        isBooting: false,
        isAuthenticated: Boolean(sessionId),
        activeSessionId: sessionId ?? null,
        sessions: sessions ?? [],
      }),
    setOffline: (isOffline: boolean) => setState({ isOffline }),
    addSession: (session: AuthSessionSummary) => setState({ sessions: [...state.sessions, session] }),
    revokeSession: (sessionId: string) =>
      setState({
        sessions: state.sessions.filter((session) => session.id !== sessionId),
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        isAuthenticated: state.activeSessionId === sessionId ? false : state.isAuthenticated,
      }),
  };
}
