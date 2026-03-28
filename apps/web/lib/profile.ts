import { cookies } from "next/headers";

export interface DemoProfile {
  displayName: string;
  username: string;
  bio: string;
  city: string;
}

const cookieName = "chordially_profile";

const defaultProfile: DemoProfile = {
  displayName: "Ada Listener",
  username: "adalistens",
  bio: "I show up early, stay for the encore, and tip for the bridge section.",
  city: "Lagos"
};

export function getProfile() {
  const raw = cookies().get(cookieName)?.value;

  if (!raw) {
    return defaultProfile;
  }

  try {
    return JSON.parse(raw) as DemoProfile;
  } catch {
    return defaultProfile;
  }
}

export function setProfile(profile: DemoProfile) {
  cookies().set(cookieName, JSON.stringify(profile), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}
