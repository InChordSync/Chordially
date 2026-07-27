import { ApiRetryHandler } from '@chordially/shared';

export async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  return ApiRetryHandler.executeWithRetry(async () => {
    const res = await fetch(url, init);
    if (!res.ok && (res.status >= 500 || res.status === 429)) {
      const err: any = new Error(`Request failed with status ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res;
  });
}
