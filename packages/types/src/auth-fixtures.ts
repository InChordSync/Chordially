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
