/**
 * Load-test baseline configuration for auth and profile endpoints.
 * k6-compatible config schema.
 */

export const LOAD_TEST_CONFIG = {
  targets: [
    { endpoint: '/auth/login', vus: 10, duration: '30s' },
    { endpoint: '/users/profile', vus: 20, duration: '30s' },
    { endpoint: '/sessions', vus: 15, duration: '30s' },
  ],
  thresholds: {
    http_req_duration: 'p(95)<500',
    http_req_failed: 'rate<0.01',
  },
};
