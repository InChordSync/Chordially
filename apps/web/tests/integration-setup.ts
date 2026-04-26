/**
 * Integration test setup for the Next.js web application.
 * Provides helpers for route-level integration tests and component testing.
 */

/**
 * Reads TEST_BASE_URL from the environment, falling back to localhost:3000.
 * Call this once at the top of your integration test suite.
 */
export function setupIntegrationTests(): void {
  if (!process.env.TEST_BASE_URL) {
    process.env.TEST_BASE_URL = 'http://localhost:3000';
  }
}

function getBaseUrl(): string {
  return process.env.TEST_BASE_URL ?? 'http://localhost:3000';
}

/**
 * Lightweight fetch wrapper that prepends the base URL and converts
 * non-ok responses into thrown errors for easier test assertions.
 *
 * @param path   - Absolute path starting with /
 * @param options - Standard RequestInit options (method, headers, body, …)
 */
export async function testFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, options);
  return response;
}

/**
 * Stub for waiting until a CSS selector is present in the page.
 * Replace the body with a real Playwright/Puppeteer call when running
 * against a live browser; the stub lets unit-style tests import this
 * file without a browser dependency.
 *
 * @param selector - CSS selector to wait for
 * @param timeout  - Maximum wait time in milliseconds (default 5000)
 */
export async function waitForSelector(
  selector: string,
  timeout = 5000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (typeof document !== 'undefined' && document.querySelector(selector)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Selector "${selector}" not found within ${timeout}ms`);
}
