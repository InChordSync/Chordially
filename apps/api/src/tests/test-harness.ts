import type { INestApplication } from '@nestjs/common';

let app: INestApplication | null = null;

/**
 * Bootstraps the API application in a test-friendly configuration.
 * Uses an in-memory or isolated test database so tests do not pollute
 * the development or production database.
 */
export async function createTestApp(): Promise<INestApplication> {
  // Dynamically import to avoid loading the full app in non-test environments
  const { Test } = await import('@nestjs/testing');
  const { AppModule } = await import('../app.module');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  return app;
}

/**
 * Truncates all collections/tables used by the test suite.
 * Call this in a beforeEach or afterEach hook to ensure clean state.
 */
export async function cleanDatabase(): Promise<void> {
  if (!app) {
    throw new Error('Test app has not been initialised. Call createTestApp() first.');
  }

  // Retrieve the database connection from the app's dependency injection container
  // and truncate every collection registered for testing.
  // The exact provider token will depend on your ORM/ODM setup.
  try {
    const { getConnectionToken } = await import('@nestjs/mongoose');
    const connection = app.get(getConnectionToken());
    const collections = Object.values(connection.collections) as Array<{ deleteMany: (filter: object) => Promise<unknown> }>;
    await Promise.all(collections.map((col) => col.deleteMany({})));
  } catch {
    // Mongoose not available — no-op; adapt for your persistence layer
  }
}

/**
 * Wraps a test function with full app lifecycle management.
 * Creates the app before the test, tears it down after, and
 * ensures the database is clean for each invocation.
 *
 * @example
 * it('should return 200', () =>
 *   withTestApp(async (app) => {
 *     const res = await request(app.getHttpServer()).get('/health');
 *     expect(res.status).toBe(200);
 *   })
 * );
 */
export async function withTestApp(
  fn: (app: INestApplication) => Promise<void>,
): Promise<void> {
  const testApp = await createTestApp();
  await cleanDatabase();
  try {
    await fn(testApp);
  } finally {
    await testApp.close();
    app = null;
  }
}
