/**
 * Seed-based smoke scenarios for local QA.
 * Run these against seeded data to verify core flows before opening a PR.
 */

export const SMOKE_SCENARIOS: Array<{
  name: string;
  endpoint: string;
  method: string;
  expectedStatus: number;
}> = [
  {
    name: 'Health check',
    endpoint: '/health',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Auth login',
    endpoint: '/auth/login',
    method: 'POST',
    expectedStatus: 200,
  },
  {
    name: 'Profile fetch',
    endpoint: '/users/profile',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Artist list',
    endpoint: '/artists',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Session create',
    endpoint: '/sessions',
    method: 'POST',
    expectedStatus: 201,
  },
  {
    name: 'Tip submit',
    endpoint: '/tips',
    method: 'POST',
    expectedStatus: 201,
  },
];
