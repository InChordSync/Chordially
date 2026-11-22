# @chordially/mobile

Expo/React Native app for the Chordially mobile experience.

## Supported platforms

- iOS (simulator/device)
- Android (emulator/device)

Web is not currently a supported target for this app. Use `pnpm dev` in `apps/web` for the web experience.

## Setup

From the repo root:

```bash
pnpm install
pnpm dev:mobile
```

Or from this directory:

```bash
pnpm dev
```

## Configuration

- `EXPO_PUBLIC_API_URL`: Base URL for the Chordially API (e.g. `http://localhost:4000`). In release builds, this must be set or the app fails fast at startup.
- iOS bundle identifier: `com.chordially.mobile`
- Android package: `com.chordially.mobile`
- URL scheme: `chordially`

Platform defaults when `EXPO_PUBLIC_API_URL` is not set in dev:

- iOS simulator: `http://localhost:4000`
- Android emulator: `http://10.0.2.2:4000`
- Physical device: set `EXPO_PUBLIC_API_URL` to your machine LAN IP, e.g. `http://192.168.1.10:4000`

The app also tries to derive the dev host from Expo's bundle URL when available.

## Versioning

- `expo.version`: user-facing app version (`1.0.0`).
- `ios.buildNumber`: increment for each iOS submission.
- `android.versionCode`: increment as an integer for each Android submission.

## Permissions

Image picking uses `expo-image-picker`. `app.json` configures `photosPermission` with a user-facing string. Run `expo prebuild --no-install` to verify native permission config.

## Monorepo / Metro

The app consumes `@chordially/shared` via workspace dependency. `metro.config.js` adds the repo root to `watchFolders` and configures node module resolution for monorepo development. Jest maps `@chordially/shared` to `../../packages/shared/src/index.ts`.

## Tests

Mobile tests live in `src/__tests__/**/*.test.[jt]s?(x)`.

Run from repo root:

```bash
pnpm --filter @chordially/mobile test
```

Or from this directory:

```bash
pnpm test
```
