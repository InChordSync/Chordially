import type { TestUserContext } from '@chordially/shared';

export class RepeatableFixtureBuilder {
  public static createDefaultUser(override?: Partial<TestUserContext>): TestUserContext {
    return {
      userId: `usr_test_${Math.floor(Math.random() * 1000)}`,
      email: 'testuser@example.com',
      role: 'user',
      ...override,
    };
  }

  public static createDefaultCreator(override?: Partial<TestUserContext>): TestUserContext {
    return this.createDefaultUser({
      role: 'creator',
      email: 'creator@example.com',
      ...override,
    });
  }
}
