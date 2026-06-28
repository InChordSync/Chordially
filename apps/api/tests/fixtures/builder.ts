let counter = 0;
const uid = () => `test-${++counter}`;

export interface AuthFixture {
  userId: string;
  token: string;
  email: string;
}

export interface CreatorFixture {
  id: string;
  name: string;
  email: string;
}

export function buildAuthFixture(overrides: Partial<AuthFixture> = {}): AuthFixture {
  return {
    userId: uid(),
    token: `mock-token-${uid()}`,
    email: `user-${uid()}@test.local`,
    ...overrides,
  };
}

export function buildCreatorFixture(overrides: Partial<CreatorFixture> = {}): CreatorFixture {
  return {
    id: uid(),
    name: `Creator ${uid()}`,
    email: `creator-${uid()}@test.local`,
    ...overrides,
  };
}

export function resetFixtureCounter(): void {
  counter = 0;
}
