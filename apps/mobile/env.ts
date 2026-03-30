import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const apiUrl: string =
  extra.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3001";

export const appEnv: "development" | "preview" | "production" =
  (extra.appEnv ?? process.env.EXPO_PUBLIC_APP_ENV ?? "development") as
    "development" | "preview" | "production";
