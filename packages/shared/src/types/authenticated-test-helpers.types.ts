export interface MockAuthTokenHeader {
  authorization: string;
  'x-test-user-id': string;
  'x-test-user-role': string;
}

export interface TestUserContext {
  userId: string;
  email: string;
  role: 'user' | 'creator' | 'admin';
  tenantId?: string;
}

export interface AuthenticatedRequestOptions {
  user: TestUserContext;
  customHeaders?: Record<string, string>;
}
