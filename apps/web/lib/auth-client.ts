import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshResponse,
  IntrospectResponse,
  AuthErrorResponse,
} from "@chordially/types/src/auth-contracts.js";

import { restrictionFromAuthError } from "./account-restriction";

declare const process: { env: Record<string, string | undefined> };

const BASE = process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000";

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: AuthErrorResponse };

async function call<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body = await res.json() as unknown;
  return res.ok ? { ok: true, data: body as T } : { ok: false, error: body as AuthErrorResponse };
}

export const authClient = {
  register: (payload: RegisterRequest) =>
    call<RegisterResponse>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: LoginRequest) =>
    call<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...payload, origin: "web" }),
    }),

  loginOrRestrictionRedirect: async (payload: LoginRequest) => {
    const result = await authClient.login(payload);
    if (result.ok) return result;
    const restriction = restrictionFromAuthError(result.error.error);
    if (restriction === "unknown") return result;
    return {
      ok: false as const,
      error: result.error,
      redirectTo: `/auth/restricted?status=${restriction}`,
    };
  },

  logout: (token: string) =>
    call<LogoutResponse>("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ token } satisfies LogoutRequest),
    }),

  refresh: (refreshToken: string) =>
    call<RefreshResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  me: (token: string) =>
    call<IntrospectResponse>("/api/v1/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),
};
