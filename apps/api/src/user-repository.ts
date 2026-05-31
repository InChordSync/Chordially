import type { AuthSession, AuthUser } from "@chordially/types";

// ── Contract ──────────────────────────────────────────────────────────────────

export interface UserRepository {
  findByEmail(email: string): (AuthUser & { passwordHash: string }) | undefined;
  findById(id: string): AuthUser | undefined;
  emailTaken(email: string): boolean;
  create(user: AuthUser & { passwordHash: string }): AuthUser;
  listAll(): AuthUser[];
}

export interface SessionRepository {
  save(session: AuthSession): void;
  find(token: string): AuthSession | undefined;
  remove(token: string): boolean;
  clear(): void;
}

// ── In-memory implementations ─────────────────────────────────────────────────

export class InMemoryUserRepository implements UserRepository {
  private store = new Map<string, AuthUser & { passwordHash: string }>();

  findByEmail(email: string) { return this.store.get(email); }

  findById(id: string) {
    return [...this.store.values()].find((u) => u.id === id);
  }

  emailTaken(email: string) { return this.store.has(email); }

  create(user: AuthUser & { passwordHash: string }): AuthUser {
    this.store.set(user.email, user);
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  listAll(): AuthUser[] {
    return [...this.store.values()].map(({ passwordHash: _, ...u }) => u);
  }

  reset() { this.store.clear(); }
}

export class InMemorySessionRepository implements SessionRepository {
  private store = new Map<string, AuthSession>();

  save(session: AuthSession) { this.store.set(session.token, session); }
  find(token: string) { return this.store.get(token); }
  remove(token: string) { return this.store.delete(token); }
  clear() { this.store.clear(); }
}
