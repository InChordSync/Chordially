export type UserRole = "fan" | "artist" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface SessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "DEPENDENCY_ERROR";

export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId?: string;
    apiVersion: string;
  };
}

export const API_V1_PREFIX = "/api/v1";

export type ContributorAuthState =
  | { status: "signed_out" }
  | { status: "email_unverified"; email: string }
  | { status: "signed_in"; email: string; role: "listener" | "artist" | "admin" }
  | { status: "forbidden"; reason: "insufficient_permission" | "suspended" };

export const authFixtures: Record<string, ContributorAuthState> = {
  signedOut: { status: "signed_out" },
  unverified: { status: "email_unverified", email: "new-user@chordially.test" },
  listener: { status: "signed_in", email: "listener@chordially.test", role: "listener" },
  artist: { status: "signed_in", email: "artist@chordially.test", role: "artist" },
  forbidden: { status: "forbidden", reason: "insufficient_permission" },
};
