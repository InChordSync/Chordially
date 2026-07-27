import {
  testUserContextSchema,
  type TestUserContextInput,
} from '../validation/authenticated-test-helpers.schemas.js';
import type { MockAuthTokenHeader } from '../types/authenticated-test-helpers.types.js';

export class AuthenticatedTestClient {
  public static createTestAuthHeaders(user: TestUserContextInput): MockAuthTokenHeader {
    const validated = testUserContextSchema.parse(user);
    const mockToken = Buffer.from(JSON.stringify(validated)).toString('base64');
    return {
      authorization: `Bearer mock_jwt_${mockToken}`,
      'x-test-user-id': validated.userId,
      'x-test-user-role': validated.role,
    };
  }
}
