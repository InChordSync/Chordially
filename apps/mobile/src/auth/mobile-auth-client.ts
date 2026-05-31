import type {
  AuthErrorResponse,
  IntrospectResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from "@chordially/types/src/auth-contracts.js";

import { mobileConfig } from "../config";

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: AuthErrorResponse };

async function call<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(`${mobileConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body = (await res.json()) as unknown;
  return res.ok ? { ok: true, data: body as T } : { ok: false, error: body as AuthErrorResponse };
}

export const mobileAuthClient = {
  register: (payload: RegisterRequest) =>
    call<RegisterResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginRequest) =>
    call<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...payload, origin: "mobile" } satisfies LoginRequest & { origin: string }),
    }),

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

