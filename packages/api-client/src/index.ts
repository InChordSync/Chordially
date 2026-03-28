export interface ApiClientOptions {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export interface ApiErrorShape {
  error: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;

  async function request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(init.headers);

    if (!headers.has("content-type") && init.body) {
      headers.set("content-type", "application/json");
    }

    if (options.token) {
      headers.set("authorization", `Bearer ${options.token}`);
    }

    const response = await fetchImpl(`${options.baseUrl}${path}`, {
      ...init,
      headers
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const errorPayload = (payload ?? { error: response.statusText }) as ApiErrorShape;
      throw new ApiClientError(
        errorPayload.error || "Request failed",
        response.status,
        errorPayload.details
      );
    }

    return payload as T;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
      request<T>(path, {
        method: "POST",
        body: JSON.stringify(body)
      }),
    patch: <T>(path: string, body: unknown) =>
      request<T>(path, {
        method: "PATCH",
        body: JSON.stringify(body)
      }),
    delete: <T>(path: string) =>
      request<T>(path, {
        method: "DELETE"
      })
  };
}
