export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const appEnv =
  (process.env.NEXT_PUBLIC_APP_ENV as "development" | "preview" | "production") ??
  "development";
