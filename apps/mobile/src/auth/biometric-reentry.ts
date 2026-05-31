export type BiometricReentrySettings = {
  available: boolean;
  optedIn: boolean;
};

export const defaultBiometricReentrySettings: BiometricReentrySettings = {
  available: false,
  optedIn: false,
};

export function shouldPromptBiometricReentry(
  settings: BiometricReentrySettings,
  restoringSession: boolean,
): boolean {
  return restoringSession && settings.available && settings.optedIn;
}
