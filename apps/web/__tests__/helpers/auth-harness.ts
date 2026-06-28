export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "creator" | "fan";
}

export const mockUser: MockUser = {
  id: "test-user-1",
  name: "Test User",
  email: "test@example.com",
  role: "fan",
};

export const mockCreator: MockUser = {
  id: "test-creator-1",
  name: "Test Creator",
  email: "creator@example.com",
  role: "creator",
};

export function buildAuthHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export function mockAuthContext(user: MockUser = mockUser): { user: MockUser; isAuthenticated: boolean } {
  return { user, isAuthenticated: true };
}

export function makeTestProps<T extends object>(overrides: Partial<T> = {}): T {
  return overrides as T;
}
