const TRANSLATIONS: Record<string, string> = {
  login: "Log In",
  register: "Register",
}

export function t(key: string): string {
  return TRANSLATIONS[key] ?? key
}
