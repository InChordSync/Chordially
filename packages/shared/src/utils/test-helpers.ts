export interface AuthHeaders {
  Authorization: string;
  "Content-Type": string;
}

export function makeAuthHeaders(token: string): AuthHeaders {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function authenticatedGet(baseUrl: string, path: string, token: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, { headers: makeAuthHeaders(token) });
}

export async function authenticatedPost(
  baseUrl: string,
  path: string,
  token: string,
  body: unknown
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: makeAuthHeaders(token),
    body: JSON.stringify(body),
  });
}

export async function expectOk(res: Response): Promise<unknown> {
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
}
