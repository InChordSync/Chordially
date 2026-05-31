export const toolingSmoke = "chordially";

export const authSmokeCommands = [
  "pnpm --filter @chordially/api test",
  "pnpm --filter @chordially/web test",
  "pnpm --filter @chordially/mobile test",
  "pnpm repo:health",
];
