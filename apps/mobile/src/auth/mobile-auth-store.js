const initialState = {
  isBooting: true,
  isOffline: false,
  isAuthenticated: false,
  activeSessionId: null,
  sessions: [],
};

export function createMobileAuthStore(seed = {}) {
  let state = { ...initialState, ...seed };
  const listeners = new Set();

  const emit = () => {
    listeners.forEach((listener) => listener(state));
  };

  const setState = (patch) => {
    state = { ...state, ...patch };
    emit();
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    boot: ({ sessionId, sessions } = {}) =>
      setState({
        isBooting: false,
        isAuthenticated: Boolean(sessionId),
        activeSessionId: sessionId ?? null,
        sessions: sessions ?? [],
      }),
    setOffline: (isOffline) => setState({ isOffline }),
    addSession: (session) => setState({ sessions: [...state.sessions, session] }),
    revokeSession: (sessionId) =>
      setState({
        sessions: state.sessions.filter((session) => session.id !== sessionId),
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        isAuthenticated: state.activeSessionId === sessionId ? false : state.isAuthenticated,
      }),
  };
}
